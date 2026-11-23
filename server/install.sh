#!/bin/bash
# Installs the server-side tools and the panel's Python packages from this repo. Run by
# `deploy deploypanel` as root (POST_BUILD_ROOT_CMD) whenever something under server/ changed;
# safe to re-run.
# Every file is syntax-checked BEFORE anything is replaced, so a broken script in a
# commit fails the deploy (and triggers the rollback) instead of landing in /usr/local/bin.
set -euo pipefail
cd "$(dirname "$0")"
echo "server tools ($(git -C .. log -1 --format=%h 2>/dev/null || echo ?)):"
[ "$(id -u)" -eq 0 ] || { echo "install.sh must run as root"; exit 1; }

# --- 1. validate everything first
for f in bin/*; do
  [ -f "$f" ] || continue
  case "$(head -1 "$f")" in
    # parse only: py_compile would leave a __pycache__ dir next to the scripts
    *python*) python3 -c 'import ast, sys; ast.parse(open(sys.argv[1], encoding="utf-8").read(), sys.argv[1])' "$f" ;;
    *bash*)   bash -n "$f" ;;
    *) echo "unknown interpreter in $f"; exit 1 ;;
  esac
done
for f in sudoers/*; do visudo -cqf "$f" || { echo "invalid sudoers file $f"; exit 1; }; done
for f in systemd/*; do systemd-analyze verify "$f" >/dev/null 2>&1 || { systemd-analyze verify "$f"; exit 1; }; done
if grep -vE '^[[:space:]]*(#.*)?$' requirements.txt | grep -qvE '^[A-Za-z0-9._-]+==[A-Za-z0-9.+!_-]+$'; then
  echo "requirements.txt: pin every package as name==version"; exit 1
fi

# --- 2. install only what changed (install(1) writes a new inode, so a running
#        `deploy` keeps executing its old copy safely)
changed=0
put() {  # put <src> <dest> <mode>
  if ! cmp -s "$1" "$2"; then install -o root -g root -m "$3" "$1" "$2"; echo "  updated $2"; changed=1; fi
}
for f in bin/*; do
  [ -f "$f" ] || continue
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

# --- 3. the panel's own Python packages: requirements.txt → its venv, only when the file differs
#        from what was installed there last time. Checked by importing the new app.py; on any
#        failure the previous package set is put back and the deploy fails (→ rollback).
VENV=/opt/deploypanel/venv
if [ ! -x "$VENV/bin/python" ]; then
  echo "  no $VENV — panel packages not installed"
elif cmp -s requirements.txt "$VENV/.requirements.txt"; then
  echo "  panel packages already up to date"
else
  venv_owner=$(stat -c %U "$VENV")
  venv_pip() {  # venv_pip <command> <args…>, as the venv's owner so file ownership stays as is
    runuser -u "$venv_owner" -- env HOME="$(getent passwd "$venv_owner" | cut -d: -f6)" \
      "$VENV/bin/python" -m pip "$1" --disable-pip-version-check --no-cache-dir "${@:2}"
  }
  work=$(mktemp -d); chmod 755 "$work"
  install -m 644 requirements.txt "$work/new.txt"
  "$VENV/bin/python" -m pip freeze --disable-pip-version-check > "$work/old.txt"; chmod 644 "$work/old.txt"
  echo "  panel packages: installing requirements.txt into $VENV…"
  if venv_pip install -q -r "$work/new.txt" && "$VENV/bin/python" -m pip check --disable-pip-version-check \
     && (cd .. && "$VENV/bin/python" -B -c 'import app'); then
    install -m 644 -o "$venv_owner" requirements.txt "$VENV/.requirements.txt"
    echo "  panel packages updated"
  else
    echo "  panel packages failed — restoring the previous set"
    venv_pip install -q -r "$work/old.txt" || echo "  ‼ restoring the previous packages failed too"
    rm -rf "$work"; exit 1
  fi
  rm -rf "$work"
fi
