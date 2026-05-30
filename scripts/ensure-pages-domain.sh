#!/usr/bin/env bash
# Attach a custom domain to a Cloudflare Pages project (idempotent).
set -euo pipefail

account_id="${1:?account id required}"
project_name="${2:?project name required}"
domain="${3:?domain required}"
api_token="${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN required}"

api_base="https://api.cloudflare.com/client/v4/accounts/${account_id}/pages/projects/${project_name}/domains"

list_response="$(curl -fsS \
  -H "Authorization: Bearer ${api_token}" \
  "${api_base}")"

if echo "${list_response}" | jq -e --arg d "${domain}" '.result[] | select(.name == $d)' >/dev/null; then
  echo "Domain ${domain} is already attached to ${project_name}."
  exit 0
fi

attach_response="$(curl -fsS -X POST "${api_base}" \
  -H "Authorization: Bearer ${api_token}" \
  -H "Content-Type: application/json" \
  --data "{\"name\":\"${domain}\"}")"

if [[ "$(echo "${attach_response}" | jq -r '.success')" != "true" ]]; then
  echo "Failed to attach ${domain} to ${project_name}:" >&2
  echo "${attach_response}" | jq . >&2
  exit 1
fi

echo "Attached ${domain} to ${project_name}. DNS and SSL are provisioned by Cloudflare when the zone is on the same account."
