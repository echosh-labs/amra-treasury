#!/bin/bash
# ==============================================================================
# echosh-labs / Sovereign Stack Documentation Trigger
# Re-generates and synchronizes master architecture dossier with live telemetry
# ==============================================================================

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}🏛️ Synchronizing Sovereign Stack Documentation & Live Telemetry${NC}"
echo -e "${CYAN}================================================================${NC}"

# Call python script in Windows Dropbox from WSL
cmd.exe /c "python c:\\Users\\justi\\Dropbox\\Sovereign\\scripts\\update_ecosystem_docs.py"

echo -e "\n${GREEN}✔ Documentation trigger completed successfully!${NC}"
