# Run from this folder in PowerShell after installing Git and GitHub CLI.
# gh auth login is required. Creates a NEW PUBLIC repository under your GitHub account.
param([string]$Repo = 'zorays/bijli-haazir-energy-dashboard')
$ErrorActionPreference = 'Stop'
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw 'GitHub CLI is required: https://cli.github.com/' }
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git is required: https://git-scm.com/' }
& gh auth status
if ($LASTEXITCODE -ne 0) { throw 'Please sign in with: gh auth login' }
& gh repo view $Repo --json name 2>$null
if ($LASTEXITCODE -eq 0) { throw "Repository $Repo already exists. Refusing to modify it automatically." }
if (-not (Test-Path '.git')) { & git init -b main; if ($LASTEXITCODE -ne 0) { throw 'git init failed' } }
& git add -A
if ($LASTEXITCODE -ne 0) { throw 'git add failed' }
& git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  & git -c user.name='Bijli Haazir Project' -c user.email='bijli-haazir@users.noreply.github.com' commit -m 'Initial Bijli Haazir energy impact dashboard'
  if ($LASTEXITCODE -ne 0) { throw 'git commit failed' }
}
& git branch -M main
& gh repo create $Repo --public --source=. --remote=origin --push
if ($LASTEXITCODE -ne 0) { throw 'GitHub repository creation/push failed. Check gh permissions and authentication.' }
Write-Host "Repository uploaded: https://github.com/$Repo"
Write-Host 'One-time GitHub setting: Settings > Pages > Build and deployment > Source: GitHub Actions.'
Write-Host 'After the Deploy workflow succeeds, open https://zorays.github.io/bijli-haazir-energy-dashboard/'
