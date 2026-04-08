#!/bin/bash
# Sans Plan Examiner v2 - Commit with Loki tracking
# Usage: bash .loki/scripts/commit.sh "commit message"

MSG="${1:-loki: checkpoint}"
echo "Committing: $MSG"
git add -A
git commit -m "$MSG"
echo "Done."