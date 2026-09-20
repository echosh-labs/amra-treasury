#!/bin/bash
# ==============================================================================
# echosh-labs / amra-treasury
# Unified Smoke Verification Test Suite (Port 8050)
# ==============================================================================

set -euo pipefail

TARGET_PORT="8050"
TARGET_URL="http://127.0.0.1:${TARGET_PORT}"
TMP_DB_DIR=$(mktemp -d "/tmp/amra-smoke-XXXXXX")
TMP_DB_PATH="${TMP_DB_DIR}/amra-smoke.db"
SERVER_PID=""

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

cleanup() {
  if [ -n "${SERVER_PID}" ] && kill -0 "${SERVER_PID}" 2>/dev/null; then
    echo -e "${YELLOW}Stopping amra-treasury server (PID: ${SERVER_PID})...${NC}"
    kill -TERM "${SERVER_PID}" 2>/dev/null || true
    wait "${SERVER_PID}" 2>/dev/null || true
  fi
  rm -rf "${TMP_DB_DIR}"
  # Restart daemon if active
  if systemctl is-enabled amra-treasury &>/dev/null; then
    echo -e "${CYAN}Restarting amra-treasury daemon service...${NC}"
    sudo systemctl restart amra-treasury || true
  fi
}
trap cleanup EXIT INT TERM

echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}🏛️ echosh-labs / amra-treasury Smoke Verification Test Suite${NC}"
echo -e "${CYAN}================================================================${NC}"

# 1. Clear contentious processes on port 8050
./scripts/clear-port.sh "${TARGET_PORT}" || true

# 2. Ensure binary exists
if [ ! -f "bin/amra-treasury" ]; then
  echo "Building amra-treasury binary..."
  mkdir -p bin
  cd backend && CGO_ENABLED=0 go build -o ../bin/amra-treasury ./cmd/server/main.go
  cd ..
fi

# 3. Boot server in background
echo "Booting amra-treasury on port ${TARGET_PORT}..."
PORT="${TARGET_PORT}" \
BOLT_DB_PATH="${TMP_DB_PATH}" \
YOUTUBE_CLIENT_ID="test_client_id_123.apps.googleusercontent.com" \
YOUTUBE_CLIENT_SECRET="test_client_secret_xyz" \
./bin/amra-treasury > "${TMP_DB_DIR}/server.log" 2>&1 &
SERVER_PID=$!

# Wait for server readiness
READY=0
for i in {1..30}; do
  if curl -s "${TARGET_URL}/healthz" | grep -q '"status":"ok"'; then
    READY=1
    break
  fi
  sleep 0.2
done

if [ "$READY" -ne 1 ]; then
  echo -e "${RED}Server failed to start within 6 seconds. Log output:${NC}"
  cat "${TMP_DB_DIR}/server.log"
  exit 1
fi

echo -e "${GREEN}✔ Server is ready and healthy.${NC}\n"

# Test Runner Helper
assert_endpoint() {
  local method="$1"
  local path="$2"
  local expected_str="$3"
  local desc="$4"

  echo -n "  • [${method}] ${path} (${desc}): "
  local resp
  resp=$(curl -s --connect-timeout 2 --max-time 5 -X "${method}" "${TARGET_URL}${path}" || echo "CURL_ERROR")
  if echo "$resp" | grep -q "${expected_str}"; then
    echo -e "${GREEN}PASS${NC}"
  else
    echo -e "${RED}FAIL${NC}"
    echo -e "    Expected: ${expected_str}"
    echo -e "    Actual:   ${resp}"
    exit 1
  fi
}

echo "Testing Endpoints:"
assert_endpoint "GET" "/healthz" '"status":"ok"' "Liveness Check"
assert_endpoint "GET" "/api/telemetry" '"service":"amra-treasury"' "System Telemetry"
assert_endpoint "GET" "/api/v1/youtube/status" '"configured"' "YouTube Status"
assert_endpoint "GET" "/api/v1/youtube/auth/url" '"auth_url"' "YouTube OAuth Consent URL"
assert_endpoint "GET" "/api/v1/youtube/jobs" '"jobs"' "YouTube Jobs Queue"
assert_endpoint "GET" "/api/v1/amra/plans" '"plans"' "AMRA Subscription Plans"
assert_endpoint "GET" "/api/v1/amra/metrics" '"total_gross_ecosystem"' "Unified Financial Metrics"
assert_endpoint "GET" "/api/v1/amra/ledger" '"ledger"' "BoltDB Immutable Audit Ledger"
assert_endpoint "GET" "/api/v1/amra/geometry" '"body"' "Vedic Parametric Mango Geometry"
assert_endpoint "GET" "/api/v1/amra/geometry/toroid" '"geometry"' "Toroidal Singularity Sacred Geometry"
assert_endpoint "GET" "/api/v1/amra/artwork" '"catalog"' "Sacred Artwork Atelier Catalog"
assert_endpoint "GET" "/api/v1/amra/gcloud/status" '"account"' "Google Cloud Project Topology"
assert_endpoint "GET" "/api/v1/esoteric/arishadvarga" '"demons"' "6 Arishadvarga Inner Adversaries"
assert_endpoint "GET" "/api/v1/studio/manifests" '"manifests"' "Creative Studio Manifest Store"
assert_endpoint "GET" "/mcp" '"service":"amra-treasury-mcp"' "Streamable HTTP MCP Transport Endpoint"
assert_endpoint "GET" "/" "AMRA Sovereign Treasury" "Embedded Static Frontend Root"
assert_endpoint "GET" "/studio" "Creative Studio" "Creative Studio Long-Form Video Suite Route"

echo -e "\n${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✔ ALL 17 INTEGRATION SMOKE TESTS PASSED CLEANLY ON PORT ${TARGET_PORT}!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
