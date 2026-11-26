#!/usr/bin/env bash
# Applies the design update (v16) on the cleanup/handoff branch. Includes everything from v1 to v15.
set -euo pipefail
cd "$(dirname "$0")/.."
git switch cleanup/handoff
unzip -oq _cleanup-handoff/update-design-v16.zip -x APPLY-UPDATE.sh
git rm -q --ignore-unmatch assets/js/lib/subpage-nav.js            # replaced by site-nav.js
git rm -q --ignore-unmatch assets/images/brand/noor-network-wheel.webp  # replaced by the drawn network graphic
git rm -q --ignore-unmatch assets/images/brand/wordmark-white.svg   # replaced by the grey wordmark.svg
git rm -q --ignore-unmatch assets/images/brand/wordmark.svg   # the hero title is text again
git add -A -- . ':(exclude)_cleanup-handoff'
git commit -q -m "Design update v16: lighter CEO heading without side lines, smooth wheel rotation, mobile carousel redesign, CLS fixes, Marcellus title, glass navbar, mosaic cards, Fair-Soft"
echo "✓ Committed on cleanup/handoff: $(git rev-parse --short HEAD)"
