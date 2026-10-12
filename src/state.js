// Réglages de l'interface, mémorisés dans le navigateur (confort uniquement).
import { FONTS } from "./data/fonts.js";
import { THEMES } from "./data/themes.js";

const KEY = "mot-secret:v1";

export const DEFAULTS = {
  theme: "hiver",
  words: "hiver\nneige\nbonhomme de neige",
  title: "",
  game: "secret",
  level: "key",
  font: "andika",
  correction: "end",
  showName: false,
  showNumber: true,
  blackWhite: false,
  lowercase: false,
  bigText: false,
  spaced: false,
  colorVowels: false,
  seed: 1,
};

// Valeurs autorisées pour les choix ; les autres réglages doivent seulement avoir le type de leur valeur par défaut.
const CHOICES = {
  theme: Object.keys(THEMES),
  font: Object.keys(FONTS),
  game: ["secret", "imagier"],
  level: ["key", "mid", "nokey"],
  correction: ["end", "none"],
};
const isValid = (key, value) =>
  CHOICES[key] ? CHOICES[key].includes(value) : key === "seed" ? Number.isInteger(value) && value >= 1 : typeof value === typeof DEFAULTS[key];

// Réglages complets à partir de valeurs non fiables (navigateur, lien de partage) : chaque valeur invalide
// ou absente est remplacée par sa valeur par défaut, les clés inconnues sont ignorées.
export function sanitize(saved) {
  const source = saved && typeof saved === "object" ? saved : {};
  return Object.fromEntries(Object.entries(DEFAULTS).map(([key, value]) => [key, isValid(key, source[key]) ? source[key] : value]));
}

export function loadState(storage) {
  try {
    return sanitize(JSON.parse(storage.getItem(KEY)));
  } catch (_) {
    return sanitize({});
  }
}

export function saveState(storage, state) {
  try {
    storage.setItem(KEY, JSON.stringify(state));
  } catch (_) {}
}
