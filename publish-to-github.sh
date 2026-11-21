#!/usr/bin/env bash
set -euo pipefail
# Requires Git and GitHub CLI with `gh auth login`. Creates a NEW PUBLIC repository.
repo="${1:-zorays/bijli-haazir-energy-dashboard}"
command -v gh >/dev/null || { echo 'Install GitHub CLI: https://cli.github.com/' >&2; exit 1; }
command -v git >/dev/null || { echo 'Install Git: https://git-scm.com/' >&2; exit 1; }
gh auth status
if gh repo view "$repo" --json name >/dev/null 2>&1; then
  echo "Repository $repo already exists; refusing automatic modification." >&2
  exit 1
fi
if [[ ! -d .git ]]; then git init -b main; fi
git add -A
if ! git diff --cached --quiet; then
  git -c user.name='Bijli Haazir Project' -c user.email='bijli-haazir@users.noreply.github.com' commit -m 'Initial Bijli Haazir energy impact dashboard'
fi
git branch -M main
gh repo create "$repo" --public --source=. --remote=origin --push
echo "Repository uploaded: https://github.com/$repo"
echo 'One-time setting: Settings > Pages > Build and deployment > Source: GitHub Actions.'
echo 'After deployment: https://zorays.github.io/bijli-haazir-energy-dashboard/'
