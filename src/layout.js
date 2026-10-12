// Mise en page des fiches et des pages de correction, en millimètres (voir docs/adr/0002).
// Chaque page est une liste d'éléments positionnés (x, y = coin haut gauche, sauf textes et pastilles :
// centre) que le rendu SVG dessine tels quels.
import { FONTS } from "./data/fonts.js";
import { PICTURE_ALPHABET } from "./data/themes.js";
import { parseWord, splitAfterPunctuation } from "./word.js";

export const PAGE = { width: 210, height: 297 };
const MARGIN_TOP = 14;
const MARGIN_BOTTOM = 12; // la bande ne descend pas plus bas
const STRIP_AREA = { x: 15, width: 180 };
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
function layoutHead(title, { font, showName, bigText }, instruction, centerX = PAGE.width / 2) {
  const items = [];
  const titleSize = 11 * (FONTS[font].titleScale || 1);
  let y = MARGIN_TOP;
  items.push({ type: "text", role: "title", text: title, x: centerX, y: y + (titleSize * LINE_HEIGHT) / 2, size: titleSize });
  y += titleSize * LINE_HEIGHT;
  const line = (role, text, size, gap) => {
    y += gap;
    items.push({ type: "text", role, text, x: centerX, y: y + (size * LINE_HEIGHT) / 2, size });
    y += size * LINE_HEIGHT;
  };
  if (showName) line("name", "Prénom :", bigText ? 7 : 5.5, 3);
  if (instruction) line("instruction", instruction, 4.5, 2.5);
  return { items, bottom: Math.max(y, MARGIN_TOP + 14) + 7 };
}

// Taille de la grille : 4 colonnes × 7 lignes, cases plus petites mais espacées avec l'option « Cases espacées ».
const gridSize = (spaced) => (spaced ? { width: 4 * 40 + 3 * 2.5, height: 7 * 20 + 6 * 2.5 } : { width: 4 * 42, height: 7 * 22 });

// Grille 4 colonnes : A→X sur 6 lignes, puis Y et Z centrés ; la case libre à gauche de Y reçoit le numéro.
function layoutGrid(top, { pictureOf, number }, { spaced, bigText, showNumber }, isKey, left = (PAGE.width - gridSize(spaced).width) / 2) {
  const w = spaced ? 40 : 42;
  const h = spaced ? 20 : 22;
  const gap = spaced ? 2.5 : 0;
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
// Les morceaux d'un mot passent à la ligne si le mot dépasse la largeur de la zone ; les mots passent à la ligne entre eux.
function layoutStrip(top, groups, pictureOf, cell, { spaced, bigText }, area = STRIP_AREA) {
  const gap = spaced ? 1.5 : 0;
  const boxH = cell * 0.9;
  const colH = 2 * boxH + gap;
  const segWidth = (seg) => seg.length * cell + (seg.length - 1) * gap;

  // Range des éléments de largeurs données en lignes de la largeur de la zone.
  const pack = (widths, spacing) => {
    const lines = [];
    widths.forEach((width, i) => {
      const last = lines.at(-1);
      if (last && last.width + spacing + width <= area.width + 1e-9) {
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
    const width = lines.length > 1 ? area.width : lines[0].width;
    return { segs, lines, width, height: lines.length * colH + (lines.length - 1) * ROW_GAP };
  });

  const items = [];
  let y = top;
  for (const line of pack(words.map((w) => w.width), cell * 0.5)) {
    let x = area.x + (area.width - line.width) / 2;
    for (const wi of line.items) {
      const word = words[wi];
      word.lines.forEach((segLine, li) => {
        let sx = x + (word.width - segLine.width) / 2;
        const sy = y + li * (colH + ROW_GAP);
        for (const si of segLine.items) {
          for (const item of word.segs[si]) {
            const col = { type: "strip", x: sx, y: sy, w: cell, h: colH, boxH, gap, pictureSize: cell * 0.68, answerSize: cell * (bigText ? 0.75 : 0.6) };
            if (item.char) col.char = item.char;
            else {
              col.letter = item.letter; // réponse, affichée seulement quand on la révèle (projection)
              if (pictureOf[item.letter]) col.picture = pictureOf[item.letter];
              else col.hint = item.letter;
            }
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

  const maxCell = imagier && level === "nokey" ? 38 : 30;
  items.push(...fitStrip(word, pictureOf, options, { ...STRIP_AREA, top, bottom: PAGE.height - MARGIN_BOTTOM }, maxCell));
  return { kind: "sheet", items };
}

// Bande dans une zone : la plus grande taille de case (≤ maxCell) pour que le plus long morceau tienne
// sur la largeur, réduite par pas de 1 tant que la bande dépasse le bas de la zone.
function fitStrip(word, pictureOf, options, area, maxCell) {
  const groups = parseWord(word);
  const gap = options.spaced ? 1.5 : 0;
  const longest = Math.max(...groups.flatMap((g) => splitAfterPunctuation(g).map((s) => s.length)));
  const start = Math.min(maxCell, (area.width - (longest - 1) * gap) / longest);
  const stripAt = (cell) => layoutStrip(area.top, groups, pictureOf, cell, options, area);
  const cell = shrinkToFit(start, (c) => bottomOf(stripAt(c)) > area.bottom);
  return stripAt(cell);
}

const bottomOf = (items) => Math.max(...items.map((i) => i.y + i.h));
const shiftY = (items, dy) => items.map((i) => ({ ...i, y: i.y + dy }));

// ---------- Projection ----------
// Hauteur réservée en bas de l'écran aux boutons (◀ compteur Révéler ▶).
export const CONTROLS_HEIGHT = 22;
const MARGIN = 15;

// Fiche à l'écran : page virtuelle aux proportions de l'écran (mêmes unités que la fiche A4, ≈ mm),
// que le SVG étire à la taille réelle. Écran large : grille à gauche, bande à droite ; sinon grille au-dessus.
// Ni ligne « Prénom » ni numéro : le compteur de la projection les remplace.
export function layoutScreen({ word, pictureOf }, options, screen) {
  const ratio = screen.width / screen.height;
  const wide = ratio >= 1.3;
  // Assez grande pour la grille et la bande côte à côte (écran large) ou l'une sous l'autre.
  const width = wide ? Math.max(215 * ratio, 390) : Math.max(210, 300 * ratio);
  const height = width / ratio;
  const { game, level, title } = options;
  const imagier = game === "imagier";
  const head = layoutHead(title.trim() || "Trouve le mot secret !", { ...options, showName: false }, imagier ? INSTRUCTIONS[level] : null, width / 2);
  const items = [...head.items];
  const bottom = height - CONTROLS_HEIGHT;
  const grid = gridSize(options.spaced);
  const opts = { ...options, showNumber: false };
  let area;

  if (imagier && level === "nokey") area = { x: MARGIN, width: width - 2 * MARGIN, top: head.bottom, bottom };
  else if (wide) {
    // Grille centrée verticalement à gauche, bande dans le reste de la largeur.
    const top = head.bottom + Math.max(0, (bottom - head.bottom - grid.height) / 2);
    items.push(...layoutGrid(top, { pictureOf }, opts, imagier && level === "key", MARGIN).items);
    const x = MARGIN + grid.width + MARGIN;
    area = { x, width: width - x - MARGIN, top: head.bottom, bottom };
  } else {
    items.push(...layoutGrid(head.bottom, { pictureOf }, opts, imagier && level === "key", (width - grid.width) / 2).items);
    area = { x: MARGIN, width: width - 2 * MARGIN, top: head.bottom + grid.height + 10, bottom };
  }

  // Bande centrée verticalement dans sa zone.
  const strip = fitStrip(word, pictureOf, options, area, imagier && level === "nokey" ? 60 : 45);
  items.push(...shiftY(strip, Math.max(0, (area.bottom - bottomOf(strip)) / 2)));
  return { kind: "screen", width, height, items };
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
