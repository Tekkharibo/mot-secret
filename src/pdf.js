// Export PDF vectoriel : chaque page SVG est convertie par svg2pdf.js dans un PDF A4 (jsPDF), voir docs/adr/0001.
// Les bibliothèques (vendor/, scripts UMD) et les polices TTF ne sont chargées qu'au premier export.
import { FONTS } from "./data/fonts.js";

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`chargement de ${src}`));
    document.head.append(s);
  });

let libs = null;
// jsPDF d'abord : svg2pdf.js s'appuie sur window.jspdf.
const loadLibs = () =>
  (libs ||= loadScript("vendor/jspdf.umd.min.js")
    .then(() => loadScript("vendor/svg2pdf.umd.min.js"))
    .catch((e) => {
      libs = null;
      throw e;
    }));

async function fontBase64(file) {
  const response = await fetch(`fonts/ttf/${file}.ttf`);
  if (!response.ok) throw new Error(`chargement de la police ${file}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

// Polices TTF (jsPDF n'accepte pas le WOFF2) : même nom de famille que dans le SVG, normal et gras.
async function addFont(doc, fontKey) {
  const { family } = FONTS[fontKey];
  for (const [weight, style] of [["400", "normal"], ["700", "bold"]]) {
    const file = `${fontKey === "atkinson" ? "atkinson-hyperlegible" : fontKey}-${weight}`;
    doc.addFileToVFS(`${file}.ttf`, await fontBase64(file));
    doc.addFont(`${file}.ttf`, family, style);
  }
}

// Pages SVG (render.js) → PDF A4 (Blob).
export async function buildPdf(svgs, fontKey) {
  await loadLibs();
  const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4", compress: true });
  await addFont(doc, fontKey);
  for (const [i, svg] of svgs.entries()) {
    if (i > 0) doc.addPage();
    await doc.svg(svg, { x: 0, y: 0, width: 210, height: 297 });
  }
  return doc.output("blob");
}
