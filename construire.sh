#!/bin/sh
# Construit le site pour cookyourself.fitness (Cloudflare Pages) dans dist/ :
#   /      = page de présentation (site/accueil.html)
#   /app/  = l'appli (fichiers à la racine du dépôt)
# Cloudflare Pages : commande de build « sh construire.sh », dossier de sortie « dist ».
set -e
rm -rf dist && mkdir -p dist/app
cp site/accueil.html dist/index.html
for f in index.html sw.js manifest.webmanifest icon.svg apple-touch-icon.png icon-192.png icon-512.png \
         ciqual.js recettes.js recettes-proteines.js config.js droits.js compte.js confidentialite.html \
         entrainement.js bilan.js atelier.js atelier.css; do cp "$f" dist/app/; done
cp -R fonts dist/app/
echo "dist/ prêt : $(find dist -type f | wc -l | tr -d ' ') fichiers"
