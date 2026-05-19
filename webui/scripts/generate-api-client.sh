#!/usr/bin/env bash
# generate-api-client.sh
#
# Generates TypeScript API client types from the running Acadia-Server's
# OpenAPI JSON spec (served at /openapi.json by the Drogon framework).
#
# Prerequisites:
#   npm install -D openapi-typescript
#
# Usage:
#   bash scripts/generate-api-client.sh [SERVER_URL]
#
#   SERVER_URL defaults to http://localhost:3000
#
# Output:
#   src/lib/api/generated/openapi.d.ts

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEBUI_DIR="$(dirname "$SCRIPT_DIR")"
OUT_DIR="${WEBUI_DIR}/src/lib/api/generated"
OUT_FILE="${OUT_DIR}/openapi.d.ts"

SERVER_URL="${1:-http://localhost:3000}"
OPENAPI_URL="${SERVER_URL}/openapi.json"

echo "Fetching OpenAPI spec from ${OPENAPI_URL} ..."

# Verify server is reachable
if ! curl --silent --fail --max-time 5 "${OPENAPI_URL}" > /dev/null 2>&1; then
    echo "ERROR: Cannot reach ${OPENAPI_URL}" >&2
    echo "       Start Acadia-Server before running this script." >&2
    exit 1
fi

mkdir -p "$OUT_DIR"

echo "Generating TypeScript types → ${OUT_FILE}"

npx openapi-typescript "${OPENAPI_URL}" --output "${OUT_FILE}"

echo "Done. Generated ${OUT_FILE}"
echo ""
echo "NOTE: The canonical REST types used by the dashboard live in"
echo "      src/lib/api/types.ts — generated types are for reference only."
echo "      Update types.ts manually to match any upstream server changes."
