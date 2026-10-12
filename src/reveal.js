// Cases révélées d'une fiche projetée : positions des cases de lettres (0 = première lettre, tirets et
// apostrophes non comptés), dans l'ordre où elles ont été révélées.

// « Révéler » : la première case encore cachée.
export function revealNext(revealed, total) {
  for (let pos = 0; pos < total; pos++) if (!revealed.includes(pos)) return [...revealed, pos];
  return revealed;
}

// ↑ : recache la dernière case révélée.
export const hideLast = (revealed) => revealed.slice(0, -1);

// Mode présentateur : un clic sur une case la révèle, un second la recache.
export const toggle = (revealed, pos) => (revealed.includes(pos) ? revealed.filter((p) => p !== pos) : [...revealed, pos]);
