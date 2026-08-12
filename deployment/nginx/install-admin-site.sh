#!/usr/bin/env bash
set -euo pipefail

SOURCE="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/admin.eraasim.signalgrowth.in.conf}"
TARGET="/etc/nginx/sites-available/admin.eraasim.signalgrowth.in"
BACKUP="${TARGET}.backup.$(date -u +%Y%m%dT%H%M%SZ)"
STAGED="${TARGET}.eraasim-new.$$"

if [[ ${EUID} -ne 0 ]]; then
  echo "Run this installer as root (for example, with sudo)." >&2
  exit 1
fi
if [[ ! -f "${SOURCE}" ]]; then
  echo "Tracked Eraasim Admin Nginx config not found: ${SOURCE}" >&2
  exit 1
fi

had_existing=false
if [[ -f "${TARGET}" ]]; then
  cp --preserve=mode,ownership,timestamps "${TARGET}" "${BACKUP}"
  had_existing=true
  echo "Backed up existing Eraasim Admin config to ${BACKUP}"
fi

install -o root -g root -m 0644 "${SOURCE}" "${STAGED}"
mv "${STAGED}" "${TARGET}"

if ! nginx -t; then
  if [[ "${had_existing}" == true ]]; then
    cp --preserve=mode,ownership,timestamps "${BACKUP}" "${TARGET}"
  else
    rm -f "${TARGET}"
  fi
  echo "Nginx validation failed; the previous Eraasim Admin config was restored." >&2
  exit 1
fi

systemctl reload nginx
echo "Eraasim Admin Nginx config validated and reloaded."
