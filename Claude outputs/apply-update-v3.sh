#!/usr/bin/env bash
# Applies the design update (v3) on the cleanup/handoff branch. Includes everything from v1 and v2.
set -euo pipefail
cd "$(dirname "$0")/.."
git switch cleanup/handoff
unzip -oq _cleanup-handoff/update-design-v3.zip -x APPLY-UPDATE.sh
git rm -q --ignore-unmatch assets/js/lib/subpage-nav.js            # replaced by site-nav.js
git rm -q --ignore-unmatch assets/images/brand/noor-network-wheel.webp  # replaced by the drawn network graphic
git add -A -- . ':(exclude)_cleanup-handoff'
git commit -q -m "Design update: network graphic from data (3 styles to compare), glass navbar, mosaic cards, motion, Fair-Soft"
echo "✓ Committed on cleanup/handoff: $(git rev-parse --short HEAD)"
echo "Compare the network styles:  python3 -m http.server 8080  then open"
echo "  http://localhost:8080/index.html?wheel=rings"
echo "  http://localhost:8080/index.html?wheel=sectors"
echo "  http://localhost:8080/index.html?wheel=strip"
