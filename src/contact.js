// Lien « Une idée, un problème ? » : e-mail prérempli avec ce qui aide à comprendre un souci.
// Adresse assemblée ici plutôt qu'écrite en clair dans la page, pour limiter le spam des robots.
const ADDRESS = ["mot-secret", "beaune.dev"].join("@");

export function contactMailto({ version, userAgent, shareUrl }) {
  const body = [
    "Bonjour,",
    "",
    "",
    "",
    "---",
    `Version : ${version}`,
    `Appareil et navigateur : ${userAgent}`,
    `Lot en cours : ${shareUrl}`,
  ].join("\n");
  // encodeURIComponent plutôt que URLSearchParams : espaces en %20, certaines messageries affichent les « + ».
  return `mailto:${ADDRESS}?subject=${encodeURIComponent("Mot secret — idée / problème")}&body=${encodeURIComponent(body)}`;
}
