#!/usr/bin/env bash
# Applies the design update (v12) on the cleanup/handoff branch. Includes everything from v1 to v11.
set -euo pipefail
cd "$(dirname "$0")/.."
git switch cleanup/handoff
unzip -oq _cleanup-handoff/update-design-v12.zip -x APPLY-UPDATE.sh
git rm -q --ignore-unmatch assets/js/lib/subpage-nav.js            # replaced by site-nav.js
git rm -q --ignore-unmatch assets/images/brand/noor-network-wheel.webp  # replaced by the drawn network graphic
git rm -q --ignore-unmatch assets/images/brand/wordmark-white.svg   # replaced by the grey wordmark.svg
git add -A -- . ':(exclude)_cleanup-handoff'
git commit -q -m "Design update (glass navbar on every page): grey logo wordmark as hero title, larger circular network (with Fair-Soft), glass navbar, mosaic cards, motion, Fair-Soft"
echo "✓ Committed on cleanup/handoff: $(git rev-parse --short HEAD)"
