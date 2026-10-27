#!/usr/bin/env bash
# Generated snapshots are rebuilt on the latest main; they are never rebased.
set -euo pipefail

git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'

for attempt in 1 2 3; do
  echo "Refresh public data: attempt $attempt/3"
  git fetch --no-tags origin main
  # This script runs in a disposable Actions checkout. Keep the newest code
  # and manual data edits before regenerating only the two snapshot files.
  git reset --hard origin/main
  python3 scripts/refresh-public-data.py
  git add -- pinned-repos.json localization-progress.json
  if git diff --cached --quiet; then
    echo 'Public snapshots are already up to date.'
    exit 0
  fi
  git commit -m 'Refresh public pins and localization progress'
  if git push origin HEAD:main; then
    exit 0
  fi
  echo 'Push did not succeed; refreshing from latest main before retrying.'
done

echo '::error::Could not publish public data after three fresh attempts.'
exit 1
