#!/bin/sh
# Prépare le site publié sur GitHub Pages : seuls les fichiers servis au navigateur (ni tests, ni outils, ni docs),
# avec ?v=<version> sur le CSS, le script principal et chaque import de module. Chaque version a ainsi ses propres
# adresses : un navigateur ne peut plus mélanger des fichiers en cache de deux versions.
# Usage : tools/build-site.sh <dossier à créer> <version>
set -eu
site=$1
v=$2
mkdir "$site"
cp -R index.html style.css LICENSE src fonts emoji vendor aide "$site/"
perl -pi -e "s{(href|src)=\"((?:style\.css|fonts/fonts\.css|src/main\.js))\"}{\$1=\"\$2?v=$v\"}g" "$site/index.html"
find "$site/src" -name '*.js' -exec perl -pi -e "s{((?:from\s+|import\()\")(\.\.?/[^\"?]+\.js)\"}{\$1\$2?v=$v\"}g" {} +
# Contrôle : plus aucun import relatif sans version, script principal versionné.
if grep -rnE '(from |import\()"\.\.?/[^"?]+\.js"' "$site/src"; then
  echo "Imports sans version restants" >&2
  exit 1
fi
grep -q "src/main.js?v=$v" "$site/index.html"
