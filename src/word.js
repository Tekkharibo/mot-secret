// Analyse des mots saisis : un mot devient une liste de groupes (un par mot séparé par des espaces),
// chaque groupe une liste d'éléments { letter: "E" } ou { char: "-" } (tiret, apostrophe… recopiés tels quels).

const isLetter = (ch) => ch >= "A" && ch <= "Z";

export function parseWord(raw) {
  const text = raw
    .replace(/[œŒ]/g, "OE")
    .replace(/[æÆ]/g, "AE")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => [...word].map((ch) => (isLetter(ch) ? { letter: ch } : { char: ch })));
}

// « arc-en-ciel » → « arc- », « en- », « ciel » : passage à la ligne possible après chaque signe,
// pour garder de grandes cases.
export function splitAfterPunctuation(group) {
  const parts = [[]];
  group.forEach((item, i) => {
    parts.at(-1).push(item);
    if (item.char && i < group.length - 1) parts.push([]);
  });
  return parts;
}

// Liste saisie (un mot par ligne) → mots retenus, sans les lignes vides ni celles sans lettre.
export function parseWordList(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => parseWord(line).flat().some((item) => item.letter));
}
