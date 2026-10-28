#!/usr/bin/env bash
set -euo pipefail

# Script: generate-api-types.sh
# Purpose: Generate TypeScript type definitions from FastAPI OpenAPI spec

OUTPUT_DIR="packages/api-contracts/generated"
OUTPUT_FILE="${OUTPUT_DIR}/api-types.ts"
API_URL="${API_URL:-http://127.0.0.1:8000/openapi.json}"

mkdir -p "${OUTPUT_DIR}"

if curl -s -f "${API_URL}" -o /tmp/openapi.json 2>/dev/null; then
  echo "Fetched OpenAPI spec from ${API_URL}"
elif [ -f "apps/api/.venv/bin/python3" ]; then
  echo "Exporting OpenAPI spec directly from FastAPI app..."
  (cd apps/api && .venv/bin/python3 -c "import json; from app.main import app; print(json.dumps(app.openapi()))" > /tmp/openapi.json)
else
  echo "Error: Could not reach FastAPI at ${API_URL} and python venv not found." >&2
  exit 1
fi

echo "Generating TypeScript definitions using openapi-typescript..."
npx openapi-typescript /tmp/openapi.json -o "${OUTPUT_FILE}"
rm -f /tmp/openapi.json

echo "Successfully generated ${OUTPUT_FILE}"
