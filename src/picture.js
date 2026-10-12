// Dessins : Fluent Emoji (Microsoft, MIT) en SVG dans emoji/{flat,hc}/.
// Nom de fichier = points de code hexadécimaux séparés par « - », sans le sélecteur de variante FE0F.
// « :nom: » désigne un dessin maison (emoji/{flat,hc}/nom.svg), quand l'emoji n'existe pas.
export function pictureFile(picture) {
  const custom = /^:(.+):$/.exec(picture);
  if (custom) return custom[1];
  return [...picture]
    .map((c) => c.codePointAt(0))
    .filter((c) => c !== 0xfe0f)
    .map((c) => c.toString(16))
    .join("-");
}
