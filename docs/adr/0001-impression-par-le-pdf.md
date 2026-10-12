# Impression uniquement par le PDF

L'impression navigateur (`window.print()` + CSS `@media print`) donnait un rendu différent selon le navigateur : Safari et iOS ignorent `@page { margin: 0 }` et `zoom`, ce qui coupait les fiches ou ajoutait des pages blanches, et imposait un contournement par détection du User-Agent. Nous avons décidé que le PDF généré dans le navigateur est la seule sortie imprimable : le bouton « Imprimer » produit le PDF et l'ouvre, on imprime depuis le lecteur PDF. Un seul rendu à tester, identique partout.

## Consequences

Aucune feuille de style d'impression n'est maintenue. Un bug d'impression se corrige dans la génération du PDF, jamais en CSS.
