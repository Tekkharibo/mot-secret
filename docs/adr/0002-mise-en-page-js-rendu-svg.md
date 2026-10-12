# Mise en page calculée en JS, rendu SVG unique

Les fiches sont mises en page par une fonction pure qui calcule les positions et tailles en millimètres, puis rendues en SVG (une page A4 = un `<svg viewBox="0 0 210 297">`). Le même SVG sert à l'aperçu et au PDF (jsPDF + svg2pdf.js). Le PDF est ainsi vectoriel (texte net, fichier léger) et fidèle à l'aperçu, et la mise en page se teste sans navigateur.

## Considered Options

- HTML + CSS (flex/grid) pour l'aperçu et capture html2canvas pour le PDF (ancienne version) : rejeté. Le PDF est une image floue et lourde, html2canvas ignore les filtres CSS, et l'ajustement de la taille des cases devait mesurer le DOM.

## Consequences

Ne pas « simplifier » en revenant à CSS flex/grid. Les polices sont nécessaires en TTF (pour jsPDF) en plus des WOFF2.
