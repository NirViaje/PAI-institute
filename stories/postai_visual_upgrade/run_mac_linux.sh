#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if [ -x ../.venv/bin/python ]; then exec ../.venv/bin/python studio.py "$@"; fi
exec python3 studio.py "$@"
