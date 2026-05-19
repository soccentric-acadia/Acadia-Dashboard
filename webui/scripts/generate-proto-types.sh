#!/usr/bin/env bash
# generate-proto-types.sh
#
# Generates TypeScript types from Acadia-HAL protobuf definitions using ts-proto.
#
# Prerequisites:
#   npm install -D ts-proto protoc
#
# Usage:
#   bash scripts/generate-proto-types.sh
#
# Output:
#   src/lib/proto/generated/  — one .ts file per .proto source

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEBUI_DIR="$(dirname "$SCRIPT_DIR")"
HAL_PROTOS_DIR="${WEBUI_DIR}/../../Acadia-HAL/protos"
OUT_DIR="${WEBUI_DIR}/src/lib/proto/generated"

if [[ ! -d "$HAL_PROTOS_DIR" ]]; then
    echo "ERROR: HAL protos directory not found: ${HAL_PROTOS_DIR}" >&2
    echo "       Clone Acadia-HAL as a sibling of Acadia-Dashboard." >&2
    exit 1
fi

PROTOC_GEN_TS_PROTO="$(npx --no-install which protoc-gen-ts_proto 2>/dev/null || true)"
if [[ -z "$PROTOC_GEN_TS_PROTO" ]]; then
    echo "INFO: ts-proto not found in project. Installing..." >&2
    npm install -D ts-proto
    PROTOC_GEN_TS_PROTO="$(npx which protoc-gen-ts_proto)"
fi

mkdir -p "$OUT_DIR"

echo "Generating TypeScript types from ${HAL_PROTOS_DIR} → ${OUT_DIR}"

# Find all .proto files
mapfile -t PROTO_FILES < <(find "$HAL_PROTOS_DIR" -name "*.proto")

if [[ ${#PROTO_FILES[@]} -eq 0 ]]; then
    echo "ERROR: No .proto files found in ${HAL_PROTOS_DIR}" >&2
    exit 1
fi

npx protoc \
    --plugin="protoc-gen-ts_proto=${PROTOC_GEN_TS_PROTO}" \
    --ts_proto_out="${OUT_DIR}" \
    --ts_proto_opt=esModuleInterop=true \
    --ts_proto_opt=env=browser \
    --ts_proto_opt=outputEncodeMethods=false \
    --ts_proto_opt=outputJsonMethods=true \
    --ts_proto_opt=useOptionals=messages \
    --proto_path="${HAL_PROTOS_DIR}" \
    "${PROTO_FILES[@]}"

echo "Done. Generated files in ${OUT_DIR}"
