#!/usr/bin/env bash
# Cloudflare Pages build: copy the public site into dist/, leaving out files that only belong in the repo.
# Cloudflare settings: Framework preset "None", build command "bash cloudflare-build.sh", output directory "dist".
set -euo pipefail

rm -rf dist
mkdir dist

# "*" skips dotfiles (.htaccess, .gitignore, .git)
for f in *; do
  case "$f" in
    dist|_design_source|screenshots|diffs|node_modules) continue ;;
    *.md|*.sh|*.py|*.zip|*.log|*.bak|*.sql|*.env|*.ini|*.lock) continue ;;
  esac
  cp -R "$f" dist/
done

# never publish docs or scripts from inside folders either
find dist -type f \( -name '*.md' -o -name '*.sh' -o -name '*.py' -o -name '*.zip' -o -name '*.bak' \) -delete

echo "Built $(find dist -type f | wc -l) files into dist/"
