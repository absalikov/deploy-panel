#!/bin/bash
# Installs the server-side tools from this repo. Run by `deploy deploypanel` as root
# (POST_BUILD_ROOT_CMD) whenever something under server/ changed; safe to re-run.
# Every file is syntax-checked BEFORE anything is replaced, so a broken script in a
# commit fails the deploy (and triggers the rollback) instead of landing in /usr/local/bin.
set -euo pipefail
cd "$(dirname "$0")"
echo "server tools ($(git -C .. log -1 --format=%h 2>/dev/null || echo ?)):"
[ "$(id -u)" -eq 0 ] || { echo "install.sh must run as root"; exit 1; }

# --- 1. validate everything first
for f in bin/*; do
  case "$(head -1 "$f")" in
    *python*) python3 -m py_compile "$f" ;;
    *bash*)   bash -n "$f" ;;
    *) echo "unknown interpreter in $f"; exit 1 ;;
  esac
done
for f in sudoers/*; do visudo -cqf "$f" || { echo "invalid sudoers file $f"; exit 1; }; done
for f in systemd/*; do systemd-analyze verify "$f" >/dev/null 2>&1 || { systemd-analyze verify "$f"; exit 1; }; done

# --- 2. install only what changed (install(1) writes a new inode, so a running
#        `deploy` keeps executing its old copy safely)
changed=0
put() {  # put <src> <dest> <mode>
  if ! cmp -s "$1" "$2"; then install -o root -g root -m "$3" "$1" "$2"; echo "  updated $2"; changed=1; fi
}
for f in bin/*; do
  mode=755; [ "$(basename "$f")" = pg-local-dump ] && mode=750
  put "$f" "/usr/local/bin/$(basename "$f")" "$mode"
done
for f in sudoers/*; do put "$f" "/etc/sudoers.d/$(basename "$f")" 440; done
units=0
for f in systemd/*; do
  if ! cmp -s "$f" "/etc/systemd/system/$(basename "$f")"; then units=1; fi
  put "$f" "/etc/systemd/system/$(basename "$f")" 644
done
[ $units = 1 ] && systemctl daemon-reload && echo "  systemd reloaded"
[ $changed = 1 ] || echo "  server tools already up to date"
