// Lien de partage : tout le lot dans le fragment de l'URL (#v1.<JSON en base64url>), rien n'est envoyé à un serveur.
// Le préfixe de version permet de changer de format (compression…) sans casser les anciens liens.
import { DEFAULTS, sanitize } from "./state.js";

const VERSION = "v1.";

const toBase64url = (text) => {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
};
const fromBase64url = (code) => {
  const binary = atob(code.replaceAll("-", "+").replaceAll("_", "/"));
  return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
};

// Fragment d'URL (sans « # ») qui contient tous les réglages du lot.
export function encodeShare(state) {
  const lot = Object.fromEntries(Object.keys(DEFAULTS).map((key) => [key, state[key]]));
  return VERSION + toBase64url(JSON.stringify(lot));
}

// Réglages du lot, ou null si le lien est abîmé ou d'un format inconnu.
export function decodeShare(hash) {
  if (!hash.startsWith(VERSION)) return null;
  try {
    return sanitize(JSON.parse(fromBase64url(hash.slice(VERSION.length))));
  } catch (_) {
    return null;
  }
}

// Seuls les fragments « #v<n>. » sont des liens de partage (pas les ancres #settings, #apercu).
export const isShareHash = (hash) => /^#v\d+\./.test(hash);
