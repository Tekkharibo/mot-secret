#!/usr/bin/env node
// Copie dans emoji/ les dessins Fluent Emoji (Microsoft, licence MIT) utilisés par src/data/themes.js
// (thèmes et alphabet illustré).
// Usage : node tools/copy-fluent-emoji.js /chemin/vers/fluentui-emoji
//   (clone de https://github.com/microsoft/fluentui-emoji ; seuls les SVG sont nécessaires)
import fs from "node:fs";
import path from "node:path";
import { PICTURE_ALPHABET, THEMES } from "../src/data/themes.js";
import { pictureFile } from "../src/picture.js";

const repo = process.argv[2];
if (!repo) {
  console.error("Usage : node tools/copy-fluent-emoji.js /chemin/vers/fluentui-emoji");
  process.exit(1);
}
const root = path.join(import.meta.dirname, "..");
const assets = path.join(repo, "assets");

const index = {};
for (const dir of fs.readdirSync(assets)) {
  const meta = path.join(assets, dir, "metadata.json");
  if (fs.existsSync(meta)) index[pictureFile(JSON.parse(fs.readFileSync(meta, "utf8")).glyph)] = dir;
}

const used = new Set();
for (const t of Object.values(THEMES)) [...t.pictures, ...t.decor].forEach((p) => used.add(p));
// « :nom: » = dessin maison déjà présent dans emoji/, ignoré ici.
for (const [p] of Object.values(PICTURE_ALPHABET)) if (!/^:.+:$/.test(p)) used.add(p);

const styles = { flat: "Flat", hc: "High Contrast" };
const missing = [];
for (const p of used) {
  const dir = index[pictureFile(p)];
  if (!dir) {
    missing.push(p);
    continue;
  }
  // Emojis avec teintes de peau : variante « Default ».
  const base = fs.existsSync(path.join(assets, dir, "Default")) ? path.join(assets, dir, "Default") : path.join(assets, dir);
  for (const [out, style] of Object.entries(styles)) {
    const src = path.join(base, style);
    const svg = fs.readdirSync(src).find((f) => f.endsWith(".svg"));
    fs.mkdirSync(path.join(root, "emoji", out), { recursive: true });
    fs.copyFileSync(path.join(src, svg), path.join(root, "emoji", out, pictureFile(p) + ".svg"));
  }
}
fs.copyFileSync(path.join(repo, "LICENSE"), path.join(root, "emoji", "LICENSE.txt"));
console.log(`${used.size - missing.length} emojis copiés.`);
if (missing.length) {
  console.error("Introuvables dans Fluent Emoji :", missing.join(" "));
  process.exit(1);
}
