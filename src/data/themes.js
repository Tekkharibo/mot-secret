// Thèmes disponibles.
// - pictures : dessins qui cachent les lettres (au moins 14 pour couvrir les mots longs)
// - decor : dessins pâles en fond de page
// - bg    : dégradé de fond [haut, bas]
// - accent: couleur des titres / de la correction
// - words : 20 mots prédéfinis du thème (insérés dans cet ordre, sans tirage au sort) ;
//           pour les saisons, les 3 mois de la saison sont à la fin
export const THEMES = {
  automne: {
    name: "Automne",
    emoji: "🍂",
    bg: ["#f6dcc0", "#fff8ef"],
    accent: "#9a4a12",
    decor: ["🍂", "🍁", "🍂", "🍄"],
    pictures: ["🍂", "🍁", "🍄", "🌰", "🦔", "🍎", "🐿️", "☔", "🍇", "🥧", "🌽", "🦉", "🧺", "🍐", "🎃", "🌂"],
    words: ["automne", "feuille", "pluie", "champignon", "châtaigne", "marron", "hérisson", "écureuil", "citrouille", "pomme", "raisin", "parapluie", "bottes", "vent", "noisette", "gland", "brouillard", "septembre", "octobre", "novembre"],
  },
  hiver: {
    name: "Hiver",
    emoji: "❄️",
    bg: ["#d6e4f2", "#f7fbff"],
    accent: "#2c4f7c",
    decor: ["❄️", "🌨️", "❄️", "⛄"],
    pictures: ["⛄", "❄️", "🧣", "🧤", "🎿", "⛸️", "🏔️", "☕", "🧊", "🐧", "🛷", "🧦", "🦭", "🌨️", "🐻‍❄️", "🏒"],
    words: ["hiver", "neige", "froid", "luge", "flocon", "glace", "bonnet", "écharpe", "gants", "ski", "patins", "igloo", "pingouin", "manteau", "bonhomme", "sapin", "chocolat", "décembre", "janvier", "février"],
  },
  printemps: {
    name: "Printemps",
    emoji: "🌸",
    bg: ["#e3f5e1", "#fdfbff"],
    accent: "#2e7d4f",
    decor: ["🌸", "🌱", "🦋", "🌼"],
    pictures: ["🌸", "🌷", "🐝", "🦋", "🌱", "🌈", "🐞", "🌼", "☔", "🐦", "🍓", "🌿", "🐌", "🪺", "🐛", "🌳"],
    words: ["printemps", "fleur", "abeille", "papillon", "jardin", "oiseau", "nid", "arbre", "bourgeon", "coccinelle", "tulipe", "pluie", "arc-en-ciel", "escargot", "soleil", "cerise", "marguerite", "mars", "avril", "mai"],
  },
  ete: {
    name: "Été",
    emoji: "☀️",
    bg: ["#cdeffa", "#fff6d6"],
    accent: "#0a7ea4",
    decor: ["☀️", "🌴", "🐚", "🌊"],
    pictures: ["☀️", "🏖️", "🍉", "🍦", "🌴", "🐚", "🩴", "🕶️", "🏄", "🦀", "🍹", "⛱️", "🐠", "🌻", "🐬", "⛵"],
    words: ["été", "soleil", "plage", "mer", "sable", "vacances", "glace", "piscine", "chapeau", "lunettes", "coquillage", "vague", "crabe", "bateau", "maillot", "pique-nique", "parasol", "juin", "juillet", "août"],
  },
  halloween: {
    name: "Halloween",
    emoji: "🎃",
    bg: ["#e7dcf0", "#fff6ea"],
    accent: "#6a2c91",
    decor: ["🦇", "🕸️", "🎃", "🌙"],
    pictures: ["🎃", "👻", "🦇", "🕷️", "🕸️", "🧙", "💀", "🍬", "🌙", "🐈‍⬛", "🧛", "🍭", "🔮", "🧹", "🧟", "🦉"],
    words: ["halloween", "citrouille", "sorcière", "fantôme", "vampire", "araignée", "toile", "balai", "chaudron", "bonbon", "squelette", "momie", "monstre", "chat", "potion", "lune", "chapeau", "déguisement", "hibou", "peur"],
  },
  noel: {
    name: "Noël",
    emoji: "🎄",
    bg: ["#f3d9d9", "#fffaf5"],
    accent: "#a3222a",
    decor: ["🎄", "⭐", "❄️", "🎁"],
    pictures: ["🎄", "🎅", "🎁", "⭐", "🔔", "🦌", "🕯️", "🍪", "🧦", "☃️", "🍬", "🎀", "🤶", "🛷", "🌟", "🧑‍🎄"],
    words: ["noël", "sapin", "cadeau", "étoile", "guirlande", "boule", "traîneau", "renne", "lutin", "bougie", "cheminée", "chaussette", "hotte", "réveillon", "bûche", "houx", "décembre", "jouet", "ange", "papillote"],
  },
  valentin: {
    name: "Saint-Valentin",
    emoji: "💘",
    bg: ["#fbdde6", "#fff7fa"],
    accent: "#c2185b",
    decor: ["❤️", "💕", "🌹", "💗"],
    pictures: ["❤️", "💌", "🌹", "💘", "🍫", "💐", "💍", "🧸", "💝", "🕊️", "💋", "🎀", "🍓", "💞", "🦢", "🧁"],
    words: ["amour", "cœur", "bisou", "câlin", "rose", "fleur", "cadeau", "lettre", "ami", "tendresse", "sourire", "chocolat", "bouquet", "février", "ensemble", "douceur", "bonheur", "famille", "merci", "partage"],
  },
  paques: {
    name: "Pâques",
    emoji: "🐣",
    bg: ["#e6f4d7", "#fffdf2"],
    accent: "#5d8a2f",
    decor: ["🌷", "🌼", "🥚", "🌸"],
    pictures: ["🐣", "🐰", "🥚", "🌷", "🐥", "🍫", "🧺", "🌼", "🐑", "🦋", "🌸", "🔔", "🥕", "🐤", "🐇", "🪺"],
    words: ["pâques", "œuf", "lapin", "poussin", "cloche", "chocolat", "printemps", "panier", "poule", "agneau", "jonquille", "tulipe", "chasse", "nid", "carotte", "fleur", "jardin", "ruban", "cocotte", "avril"],
  },
  anniversaire: {
    name: "Anniversaire",
    emoji: "🎂",
    bg: ["#fde8c8", "#f4f0ff"],
    accent: "#d0570f",
    decor: ["🎈", "🎉", "🎊", "🎈"],
    pictures: ["🎂", "🎈", "🎉", "🎁", "🥳", "🍰", "🎊", "🧁", "🎀", "🍭", "🪅", "🍬", "🎵", "🃏", "👑", "🍕"],
    words: ["anniversaire", "gâteau", "bougie", "cadeau", "ballon", "fête", "copain", "chanson", "confettis", "invités", "surprise", "bonbon", "jeu", "guirlande", "chapeau", "musique", "danse", "souffler", "âge", "joie"],
  },
  mer: {
    name: "Mer",
    emoji: "🐳",
    bg: ["#c9e8f5", "#effaff"],
    accent: "#11577a",
    decor: ["🌊", "🐚", "🐟", "🫧"],
    pictures: ["🐳", "🐙", "🦀", "🐠", "🐚", "⚓", "🦈", "🐢", "🦑", "🐬", "⛵", "🪸", "🦞", "🐡", "🧜", "🌊"],
    words: ["mer", "poisson", "baleine", "dauphin", "requin", "pieuvre", "crabe", "étoile", "méduse", "tortue", "coquillage", "vague", "bateau", "phare", "sable", "algue", "corail", "homard", "sirène", "plongée"],
  },
};

// Ordre d'affichage : saisons puis fêtes dans l'ordre de l'année scolaire (septembre → juin), puis le reste.
export const THEME_GROUPS = [
  { label: "Saisons", keys: ["automne", "hiver", "printemps", "ete"] },
  { label: "Fêtes", keys: ["halloween", "noel", "valentin", "paques", "anniversaire"] },
  { label: "Autres", keys: ["mer"] },
];

// Mode « imagier » : chaque lettre devient un dessin dont le nom commence par cette lettre.
// Mots choisis pour que le premier son corresponde à la lettre (cochon plutôt que chat).
// « :nom: » = dessin maison (emoji/{flat,hc}/nom.svg) quand l'emoji n'existe pas (pas d'emoji xylophone).
export const PICTURE_ALPHABET = {
  A: ["🐝", "abeille"],
  B: ["🐳", "baleine"],
  C: ["🐷", "cochon"],
  D: ["🐬", "dauphin"],
  E: ["🐌", "escargot"],
  F: ["🍓", "fraise"],
  G: ["🦒", "girafe"],
  H: ["🦉", "hibou"],
  I: ["🏝️", "île"],
  J: ["🧃", "jus"],
  K: ["🐨", "koala"],
  L: ["🦁", "lion"],
  M: ["🏠", "maison"],
  N: ["☁️", "nuage"],
  O: ["🍊", "orange"],
  P: ["🍎", "pomme"],
  Q: ["🎳", "quilles"],
  R: ["🦊", "renard"],
  S: ["☀️", "soleil"],
  T: ["🐢", "tortue"],
  U: ["🏭", "usine"],
  V: ["🐄", "vache"],
  W: ["🚃", "wagon"],
  X: [":xylophone:", "xylophone"],
  Y: ["🪀", "yoyo"],
  Z: ["🦓", "zèbre"],
};
