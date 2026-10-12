// Mise en page des fiches et des pages de correction, en millimètres (voir docs/adr/0002).
// Chaque page est une liste d'éléments positionnés (x, y = coin haut gauche, sauf textes et pastilles :
// centre) que le rendu SVG dessine tels quels.
import { FONTS } from "./data/fonts.js";
import { PICTURE_ALPHABET } from "./data/themes.js";
import { parseWord, splitAfterPunctuation } from "./word.js";

export const PAGE = { width: 210, height: 297 };
const MARGIN_TOP = 14;
const MARGIN_BOTTOM = 12; // la bande ne descend pas plus bas
const STRIP_MAX_WIDTH = 180;
const ROW_GAP = 6; // entre deux lignes de la bande
const LINE_HEIGHT = 1.25; // hauteur d'une ligne de texte / taille de la police
const BADGE = 11;
const ANSWERS_PER_PAGE = 10;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const INSTRUCTIONS = {
  key: "Chaque dessin cache la première lettre de son nom : cherche-le dans l'imagier.",
  mid: "Chaque dessin cache la première lettre de son nom : trouve sa place dans l'alphabet.",
  nokey: "Écris la première lettre du nom de chaque dessin.",
};

// Réduit une taille par pas de 1 mm tant qu'elle déborde, sans descendre sous 10 mm.
export function shrinkToFit(start, overflows) {
  let size = start;
  while (size > 10 && overflows(size)) size -= 1;
  return size;
}

// En-tête : titre, ligne « Prénom », consigne. Renvoie les éléments et la hauteur occupée.
function layoutHead(title, { font, showName, bigText }, instruction) {
  const items = [];
  const titleSize = 11 * (FONTS[font].titleScale || 1);
  let y = MARGIN_TOP;
  items.push({ type: "text", role: "title", text: title, x: PAGE.width / 2, y: y + (titleSize * LINE_HEIGHT) / 2, size: titleSize });
  y += titleSize * LINE_HEIGHT;
  const line = (role, text, size, gap) => {
    y += gap;
    items.push({ type: "text", role, text, x: PAGE.width / 2, y: y + (size * LINE_HEIGHT) / 2, size });
    y += size * LINE_HEIGHT;
  };
  if (showName) line("name", "Prénom :", bigText ? 7 : 5.5, 3);
  if (instruction) line("instruction", instruction, 4.5, 2.5);
  return { items, bottom: Math.max(y, MARGIN_TOP + 14) + 7 };
}

// Grille 4 colonnes : A→X sur 6 lignes, puis Y et Z centrés ; la case libre à gauche de Y reçoit le numéro.
function layoutGrid(top, { pictureOf, number }, { spaced, bigText, showNumber }, isKey) {
  const w = spaced ? 40 : 42;
  const h = spaced ? 20 : 22;
  const gap = spaced ? 2.5 : 0;
  const left = (PAGE.width - (4 * w + 3 * gap)) / 2;
  const slots = [...ALPHABET.slice(0, 24), null, "Y", "Z", null];
  const items = slots.map((letter, i) => {
    const x = left + (i % 4) * (w + gap);
    const y = top + Math.floor(i / 4) * (h + gap);
    if (letter === null) return i === 24 && showNumber ? { type: "badge", text: String(number), x: x + w / 2, y: y + h / 2, size: BADGE } : null;
    const picture = isKey ? PICTURE_ALPHABET[letter][0] : pictureOf[letter];
    return { type: "cell", letter, picture, showLetter: isKey || !picture, x, y, w, h, key: isKey, letterSize: isKey ? (bigText ? 8 : 6) : bigText ? 17 : 13 };
  });
  return { items: items.filter(Boolean), bottom: top + 7 * h + 6 * gap };
}

// Bande : colonnes (dessin + case) regroupées en morceaux insécables, eux-mêmes en mots.
// Les morceaux d'un mot passent à la ligne si le mot dépasse 180 mm ; les mots passent à la ligne entre eux.
function layoutStrip(top, groups, pictureOf, cell, { spaced, bigText }) {
  const gap = spaced ? 1.5 : 0;
  const boxH = cell * 0.9;
  const colH = 2 * boxH + gap;
  const segWidth = (seg) => seg.length * cell + (seg.length - 1) * gap;

  // Range des éléments de largeurs données en lignes de 180 mm max.
  const pack = (widths, spacing) => {
    const lines = [];
    widths.forEach((width, i) => {
      const last = lines.at(-1);
      if (last && last.width + spacing + width <= STRIP_MAX_WIDTH + 1e-9) {
        last.items.push(i);
        last.width += spacing + width;
      } else lines.push({ items: [i], width });
    });
    return lines;
  };

  // Chaque mot : ses morceaux rangés en lignes, centrés.
  const words = groups.map((group) => {
    const segs = splitAfterPunctuation(group);
    const lines = pack(segs.map(segWidth), gap);
    const width = lines.length > 1 ? STRIP_MAX_WIDTH : lines[0].width;
    return { segs, lines, width, height: lines.length * colH + (lines.length - 1) * ROW_GAP };
  });

  const items = [];
  let y = top;
  for (const line of pack(words.map((w) => w.width), cell * 0.5)) {
    let x = (PAGE.width - line.width) / 2;
    for (const wi of line.items) {
      const word = words[wi];
      word.lines.forEach((segLine, li) => {
        let sx = x + (word.width - segLine.width) / 2;
        const sy = y + li * (colH + ROW_GAP);
        for (const si of segLine.items) {
          for (const item of word.segs[si]) {
            const col = { type: "strip", x: sx, y: sy, w: cell, h: colH, boxH, gap, pictureSize: cell * 0.68, answerSize: cell * (bigText ? 0.75 : 0.6) };
            if (item.char) col.char = item.char;
            else if (pictureOf[item.letter]) col.picture = pictureOf[item.letter];
            else col.hint = item.letter;
            items.push(col);
            sx += cell + gap;
          }
        }
      });
      x += word.width + cell * 0.5;
    }
    y += Math.max(...line.items.map((wi) => words[wi].height)) + ROW_GAP;
  }
  return items;
}

export function layoutSheet({ word, number, pictureOf }, options) {
  const { game, level, title, showNumber, spaced } = options;
  const imagier = game === "imagier";
  const head = layoutHead(title.trim() || "Trouve le mot secret !", options, imagier ? INSTRUCTIONS[level] : null);
  const items = [...head.items];
  let top;
  if (imagier && level === "nokey") {
    if (showNumber) {
      items.push({ type: "badge", text: String(number), x: PAGE.width / 2, y: head.bottom + 6 + BADGE / 2, size: BADGE });
      top = head.bottom + 6 + BADGE + 10;
    } else top = head.bottom + 14;
  } else {
    const grid = layoutGrid(head.bottom, { pictureOf, number }, options, imagier && level === "key");
    items.push(...grid.items);
    top = grid.bottom + 14;
  }

  const groups = parseWord(word);
  const gap = spaced ? 1.5 : 0;
  const longest = Math.max(...groups.flatMap((g) => splitAfterPunctuation(g).map((s) => s.length)));
  const maxCell = imagier && level === "nokey" ? 38 : 30;
  const start = Math.min(maxCell, (STRIP_MAX_WIDTH - (longest - 1) * gap) / longest);
  const limit = PAGE.height - MARGIN_BOTTOM;
  const stripAt = (cell) => layoutStrip(top, groups, pictureOf, cell, options);
  const cell = shrinkToFit(start, (c) => Math.max(...stripAt(c).map((i) => i.y + i.h)) > limit);
  items.push(...stripAt(cell));
  return { kind: "sheet", items };
}

// Correction : une ligne par mot, toutes de même largeur ; les cases se partagent la largeur.
export function layoutAnswerPages(words, options) {
  const { spaced, bigText } = options;
  const pages = [];
  for (let start = 0; start < words.length; start += ANSWERS_PER_PAGE) {
    const head = layoutHead("Correction", { ...options, showName: false }, null);
    const items = [...head.items];
    words.slice(start, start + ANSWERS_PER_PAGE).forEach(({ word, number }, row) => {
      const y = head.bottom + row * (16 + 8);
      items.push({ type: "badge", text: String(number), x: 20 + BADGE / 2, y: y + 8, size: BADGE });
      const boxes = parseWord(word).flatMap((group, gi) => [...(gi > 0 ? [{ blank: true }] : []), ...group]);
      const gap = spaced ? 1.5 : 0;
      const left = 20 + BADGE + 6;
      const w = (170 - BADGE - 6 - (boxes.length - 1) * gap) / boxes.length;
      const size = Math.min(8 * (bigText ? 1.3 : 1), (150 / boxes.length) * 0.7);
      boxes.forEach((box, i) => items.push({ type: "answer", ...box, x: left + i * (w + gap), y, w, h: 16, size }));
    });
    pages.push({ kind: "answers", items });
  }
  return pages;
}
