#!/bin/bash
# ==============================================================================
# echosh-labs / amra-treasury
# Batch Long-Form Video Producer & YouTube Dispatch CLI
# Generational Sovereignty Automation Tool
# ==============================================================================

set -euo pipefail

API_URL="http://127.0.0.1:8050"
PRESET="${1:-18min}"
FREQ="${2:-432}"
DISPATCH="${3:-false}"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}🎬 AMRA Creative Studio: Long-Form Video Batch Producer${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"

# 1. Resolve Presets
BASE_CYCLE=108
REPEATS=10

case "$PRESET" in
  "test"|"quick-verify")
    BASE_CYCLE=2
    REPEATS=2
    ;;
  "9min"|"quick")
    BASE_CYCLE=54
    REPEATS=10
    ;;
  "18min"|"canonical")
    BASE_CYCLE=108
    REPEATS=10
    ;;
  "36min"|"double")
    BASE_CYCLE=108
    REPEATS=20
    ;;
  "60min"|"1hr"|"hour")
    BASE_CYCLE=108
    REPEATS=34
    ;;
  *)
    echo -e "${YELLOW}Using custom/default preset: 108s cycle x 10 repeats (18 min)${NC}"
    ;;
esac

TOTAL_SEC=$(( BASE_CYCLE * REPEATS ))
DURATION_MIN=$(awk "BEGIN {printf \"%.1f\", $TOTAL_SEC / 60}")

echo -e "  • Preset:           ${YELLOW}${PRESET}${NC} (${BASE_CYCLE}s x ${REPEATS} cycles = ${TOTAL_SEC}s / ${DURATION_MIN} min)"
echo -e "  • Frequency:        ${YELLOW}${FREQ} Hz${NC} Nāda Drone"
echo -e "  • YouTube Dispatch: ${YELLOW}${DISPATCH}${NC}"

# 2. Check API Health
if ! curl -s "${API_URL}/healthz" | grep -q '"status":"ok"'; then
  echo -e "${RED}Error: amra-treasury API is not responding on port 8050.${NC}"
  echo -e "Ensure service is running: sudo systemctl status amra-treasury"
  exit 1
fi

# 3. Formulate Manifest Payload
JOB_ID="batch-$(date +%s)"
MANIFEST_FILE=$(mktemp /tmp/manifest-XXXXXX.json)
cat <<EOF > "$MANIFEST_FILE"
{
  "manifest": {
    "id": "manifest-${JOB_ID}",
    "title": "Āmra Anāhata Meditation | ${FREQ}Hz Harmonic Toroid",
    "description": "Long-form sacred geometry toroidal singularity and Āmra Rūpa Mango focal mandala. Calibrated to ${FREQ}Hz harmonic resonance for deep yoga nidra.",
    "canvas": {
      "width": 1280,
      "height": 720,
      "fps": 30
    },
    "patternLoop": {
      "baseCycleSeconds": ${BASE_CYCLE},
      "repeatCount": ${REPEATS},
      "cycleHueRotationDeg": 15,
      "harmonicOctaveProgression": true,
      "pranaHeatIncrement": 0.05
    },
    "backgroundTrack": {
      "geometryStyle": "torus_flower_of_life",
      "palette": "amra_multivariate",
      "rotationRateRpm": 1.5,
      "layerCount": 8,
      "zoomOscillation": true
    },
    "objectTracks": [
      {
        "id": "obj-amra-mango",
        "objectType": "amra_mango",
        "name": "Āmra Rūpa Mango",
        "anchorX": 0.5,
        "anchorY": 0.5,
        "baseScale": 1.0,
        "glowColor": "#f59e0b",
        "glowRadius": 32,
        "animationMode": "pulsing_prana",
        "keyframes": [
          { "timeSec": 0, "opacity": 0.3, "scale": 0.9, "rotationDeg": 0 },
          { "timeSec": $(( BASE_CYCLE / 2 )), "opacity": 1.0, "scale": 1.1, "rotationDeg": 180 },
          { "timeSec": ${BASE_CYCLE}, "opacity": 0.3, "scale": 0.9, "rotationDeg": 360 }
        ]
      }
    ],
    "audioTrack": {
      "enabled": true,
      "baseFrequencyHz": ${FREQ},
      "harmonicPreset": "anahata_432",
      "binauralBeatHz": 4.5,
      "octaveModulation": true,
      "volume": 0.75
    }
  }
}
EOF

# 4. Trigger Headless Render
ENDPOINT="/api/v1/studio/render"
if [ "$DISPATCH" = "true" ]; then
  ENDPOINT="/api/v1/studio/dispatch"
fi

echo -e "\n${CYAN}Submitting render job to ${ENDPOINT}...${NC}"
RESP=$(curl -s -X POST "${API_URL}${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d @"$MANIFEST_FILE")
rm -f "$MANIFEST_FILE"

ACTIVE_JOB_ID=$(echo "$RESP" | grep -o '"id":"job_render_[^"]*' | cut -d'"' -f4 || echo "")
if [ -z "$ACTIVE_JOB_ID" ]; then
  ACTIVE_JOB_ID=$(echo "$RESP" | grep -o '"jobId":"[^"]*' | cut -d'"' -f4 || echo "")
fi

if [ -z "$ACTIVE_JOB_ID" ]; then
  echo -e "${RED}Failed to launch render job. Response:${NC}"
  echo "$RESP"
  exit 1
fi

echo -e "${GREEN}✔ Render Job Queued Successfully! [Job ID: ${ACTIVE_JOB_ID}]${NC}"
echo -e "Monitoring progress from ${API_URL}/api/v1/studio/jobs?id=${ACTIVE_JOB_ID}...\n"

# 5. Monitor Job Progress
while true; do
  STATUS_RESP=$(curl -s "${API_URL}/api/v1/studio/jobs/${ACTIVE_JOB_ID}")
  STATUS=$(echo "$STATUS_RESP" | grep -o '"status":"[^"]*' | cut -d'"' -f4 || echo "unknown")
  PROGRESS=$(echo "$STATUS_RESP" | grep -o '"progress_pct":[0-9.]*' | cut -d':' -f2 || echo "0")
  OUTPUT_PATH=$(echo "$STATUS_RESP" | grep -o '"output_path":"[^"]*' | cut -d'"' -f4 || echo "")

  PROGRESS_INT=$(printf "%.0f" "$PROGRESS" 2>/dev/null || echo "0")
  printf "\r  [Status: %-10s] Progress: %5.1f%%" "$STATUS" "$PROGRESS"

  if [ "$STATUS" = "completed" ]; then
    printf "\n\n${GREEN}✔ Video Compilation Completed Successfully!${NC}\n"
    echo -e "  • Output Path: ${CYAN}${OUTPUT_PATH}${NC}"
    if [ -f "$OUTPUT_PATH" ]; then
      FILE_SIZE=$(ls -lh "$OUTPUT_PATH" | awk '{print $5}')
      echo -e "  • File Size:   ${GREEN}${FILE_SIZE}${NC}"
    fi
    break
  elif [ "$STATUS" = "failed" ]; then
    ERR=$(echo "$STATUS_RESP" | grep -o '"error_message":"[^"]*' | cut -d'"' -f4 || echo "Unknown failure")
    printf "\n\n${RED}✘ Render Job Failed:${NC} %s\n" "$ERR"
    exit 1
  fi

  sleep 2
done
