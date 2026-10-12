# Mot secret — générateur de fiches

Générateur de fiches « mot secret » à imprimer en A4 : les lettres du mot sont remplacées par des dessins,
et l'enfant décode le mot à l'aide de l'alphabet. 100 % statique, hébergé sur GitHub Pages.

> Réécriture en cours (v1.0.0) : voir [BACKLOG.md](BACKLOG.md). Vocabulaire : [CONTEXT.md](CONTEXT.md).
> Décisions d'architecture : [docs/adr/](docs/adr/).

## Développement

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
- `fonts/` : polices adaptées à la lecture (SIL OFL, `fonts/OFL.txt`).

## Licence

[MIT](LICENSE) © 2026 Amaury Beauné (Tekkharibo). Les polices restent sous SIL OFL, les Fluent Emoji sous leur licence MIT.
