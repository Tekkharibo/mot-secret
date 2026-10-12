# Mot secret — générateur de fiches

Générateur de fiches « mot secret » à imprimer en A4 : les lettres du mot sont remplacées par des dessins,
et l'enfant décode le mot à l'aide de l'alphabet. 100 % statique, hébergé sur GitHub Pages.

> Réécriture en cours (v1.0.0) : voir [BACKLOG.md](BACKLOG.md). Vocabulaire : [CONTEXT.md](CONTEXT.md).
> Décisions d'architecture : [docs/adr/](docs/adr/).

## Utilisation

En ligne : https://tekkharibo.github.io/mot-secret/

1. Choisir un thème et un jeu : **Mot secret** (quelques lettres cachées par des dessins du thème) ou **Imagier**
   (chaque lettre devient un dessin dont le nom commence par cette lettre, trois niveaux).
2. Saisir un mot par ligne, ou « Utiliser les 20 mots du thème ».
3. « Télécharger le PDF (A4) », ou « Imprimer » qui ouvre le PDF dans un nouvel onglet.
4. Ou « 📽️ Projeter » (TBI, vidéoprojecteur, iPad) : une fiche par écran, ◀ ▶ / glisser / clavier pour changer de fiche,
   « Révéler » pour remplir la réponse case par case, Échap pour quitter.

Options : titre, ligne « Prénom », numérotation, page de correction, noir et blanc, « Mélanger » les dessins ;
lisibilité (police adaptée, minuscules, texte agrandi, cases espacées, voyelles / consonnes en couleur).
Les réglages sont mémorisés dans le navigateur.

## Développement

L'application est en modules ES : elle doit être servie en HTTP (`npm run serve`), pas ouverte en `file://`.


```sh
npm install
npx playwright install chromium webkit
npm test            # tests unitaires et DOM (Vitest + jsdom)
npm run test:e2e    # tests navigateur (Playwright : Chromium + WebKit)
npm run serve       # http://localhost:8080
```

Branches : `feature/<sujet>` depuis `develop` (squash merge), puis `develop` → `main` (déploiement).

## Ressources

- `emoji/` : dessins [Fluent Emoji](https://github.com/microsoft/fluentui-emoji) de Microsoft (MIT, `emoji/LICENSE.txt`),
  `flat/` en couleur, `hc/` (High Contrast) en noir et blanc. `xylophone.svg` est un dessin maison.
  Après avoir ajouté des dessins dans `src/data/themes.js` : `node tools/copy-fluent-emoji.js /chemin/vers/fluentui-emoji`.
- `fonts/` : polices adaptées à la lecture (SIL OFL, `fonts/OFL.txt`) : WOFF2 pour l'aperçu, `fonts/ttf/` pour le PDF
  (jsPDF n'accepte que le TTF), générés par `python3 tools/woff2-to-ttf.py fonts fonts/ttf`.
- `vendor/` : jsPDF et svg2pdf.js (MIT, `vendor/LICENSES.txt`), chargés seulement au premier export PDF.

## Soutenir le projet

☕ [ko-fi.com/tekkharibo](https://ko-fi.com/tekkharibo) : la page Ko-fi liste aussi les soutiens.

## Licence

[MIT](LICENSE) © 2026 Amaury Beauné (Tekkharibo). Les polices restent sous SIL OFL, les Fluent Emoji sous leur licence MIT.
