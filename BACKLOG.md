# Mot secret — backlog

Taille estimée : **S** (moins d'une heure) · **M** (quelques heures) · **L** (une journée ou plus).
Contraintes communes : tout reste statique (GitHub Pages), sans serveur ni base de données ; licence MIT ; TDD.
Vocabulaire : voir [CONTEXT.md](CONTEXT.md).

## v1.0.0 — réécriture (parité stricte avec l'ancienne version)

Réécriture propre de l'ancienne version (`Tekkharibo/divers/mot-secret`), sans nouvelle fonction.
Repris tels quels : `emoji/`, `fonts/`, `vendor/`, données des thèmes et de l'alphabet illustré, outil de copie des emojis.
Une branche `feature/…` par ligne, dans cet ordre.

| # | Feature | Taille | Contenu |
|---|---|---|---|
| 1 | Socle | S | `LICENSE`, `package.json`, Vitest + jsdom, Playwright (Chromium + WebKit), CI sur les PR, ressources reprises. |
| 2 | Analyse des mots | S | Accents ignorés, `œ`/`æ` dépliés, espaces = mots séparés, `-` et `'` recopiés, coupure de ligne après `-` et `'`. |
| 3 | Attribution des dessins | S | Mot secret : tirage reproductible par thème, mot et tirage ; avertissement si trop de lettres différentes. Imagier : alphabet illustré. |
| 4 | Mise en page | M | Calcul en mm de la fiche (grille, clé, bande, titre, prénom, numéro, décor) et de la page de correction (10 mots par page) ; taille des cases réduite tant que la bande déborde. |
| 5 | Rendu SVG | M | Une page A4 = un SVG ; options de lisibilité (4 polices, minuscules, texte agrandi, cases espacées, voyelles / consonnes en couleur) ; noir et blanc (dessins `hc/`). |
| 6 | Export PDF | M | jsPDF + svg2pdf.js, polices TTF incorporées, bibliothèques chargées au premier export ; « Imprimer » ouvre le PDF. |
| 7 | Interface | M | Panneau de réglages, aperçu, barre mobile, 20 mots du thème, « Mélanger », réglages mémorisés et validés au chargement. |
| 8 | Déploiement | S | GitHub Actions publie Pages depuis `main`, `?v=<commit>` ajouté automatiquement aux adresses (`tools/build-site.sh`), tag `v1.0.0`. |

## v1.1 et suivantes — idées retenues

### 1. ✅ Lien Ko-fi pour les dons — S (fait)

- Lien « ☕ Soutenir le projet » en bas du panneau de réglages et dans le README, ouvert dans un nouvel onglet.
- Sans le widget Ko-fi : ni script externe ni traceur (usage en classe, RGPD).
- Jamais présent sur les fiches ni dans le PDF.
- Identifiant : `https://ko-fi.com/tekkharibo`. Les soutiens sont listés sur la page Ko-fi elle-même (pas de liste
  dans l'appli : Ko-fi n'a pas d'API publique, il faudrait un serveur pour recevoir ses webhooks).

### 2. ✅ Bouton contact (mailto) — S (fait)

- Lien « ✉️ Une idée, un problème ? » en bas du panneau, qui ouvre la messagerie.
- Objet prérempli « Mot secret — idée / problème » ; corps prérempli avec la version, l'appareil, le navigateur et le lien du lot en cours (n° 3).
- Adresse assemblée en JavaScript plutôt qu'écrite en clair, contre le spam.
- Adresse : `mot-secret@beaune.dev`.

### 3. ✅ Partager un lot par lien — M (fait)

- Bouton « 🔗 Copier le lien » : l'URL contient tout le lot (thème, jeu, niveau, mots, options, titre, tirage).
- Données après le `#` : `#v1.` + JSON en base64url, sans compression (≈ 550 caractères pour 20 mots) ;
  rien n'est envoyé à un serveur. Le préfixe de version permettra d'ajouter la compression sans casser les liens.
- À l'ouverture, le lien remplace les réglages mémorisés, puis est retiré de l'adresse ; un lien abîmé est ignoré et signalé.
- Sur smartphone, partage natif (`navigator.share`) quand il existe.
- Sert de base au mode vidéoprojecteur, au bouton contact et au mode en ligne.

### 4. ✅ Mode projection (vidéoprojecteur, TBI, iPad) — M (fait)

- Bouton « 📽️ Projeter » : plein écran quand le navigateur le permet (sinon toute la fenêtre, iPhone), une fiche par écran.
- Mise en page adaptée à l'écran : large (≥ 1,3 : 16:9, iPad paysage) → grille à gauche, bande à droite ;
  haut ou carré (iPad portrait, smartphone) → grille au-dessus. Recalculée à chaque rotation.
- Fiche suivante facile : grands boutons ◀ ▶ et compteur en bas, glisser au doigt, clavier / télécommande
  (flèches, espace, Page suivante/précédente), Échap pour quitter.
- « 👁 Révéler » : case par case dans l'ordre de lecture (Entrée ou ↓ ; ↑ recache), réponse en vert ; « ↺ Cacher » à la fin.
  Changer de fiche recache tout. Remplace la page de correction en projection.
- Titre et consigne gardés ; ni ligne « Prénom » ni numéro. Options de lisibilité appliquées.
- Plus tard, si le besoin se confirme : export PDF 16:9.

### 4 bis. ✅ Mode présentateur (deux écrans) — M (fait)

Comme le mode présentateur de PowerPoint, quand le TBI est branché sur le même ordinateur (écran étendu).

- Option « Mode présentateur » dans la projection : ouvre une seconde fenêtre (vue élèves, sans la réponse) à glisser
  sur le TBI ; Chrome / Edge peuvent la placer directement sur le second écran (Window Management API).
- La fenêtre de départ devient la vue enseignant : la fiche telle que la voient les élèves, **cliquable case par case**
  (un clic révèle la case aux élèves, un second la recache), la réponse en clair **seulement tant qu'on maintient un bouton**
  (comme un mot de passe), la fiche suivante, ◀ ▶ « Révéler » « Tout révéler » « Cacher » et le compteur.
- Fenêtre élèves sans boutons ; glisser au doigt, clavier et télécommande y pilotent aussi la présentation.
  Fenêtre élèves fermée par erreur : signalée, avec un bouton pour la rouvrir. « Terminer » ferme les deux.
- Synchronisation par `BroadcastChannel` : sans serveur, marche hors connexion.
- Hors périmètre : piloter le TBI depuis un autre appareil (téléphone, tablette), qui demanderait un relais réseau.

### 5. Personnaliser le fond de page — M

- Choix des deux couleurs du dégradé, avec retour au fond du thème.
- Option « Fond blanc », et afficher ou masquer le décor.
- Option avancée : importer une image, gardée dans le navigateur. Elle ne passe pas dans le lien de partage (trop lourde).

## En attente

### 6. Compléter une fiche à l'ordinateur ou à la tablette — L

- L'enfant tape les lettres dans les cases au lieu d'imprimer.
- Sans serveur : le lot arrive par le lien de partage (n° 3), la vérification se fait dans le navigateur.
- Un serveur ne deviendrait nécessaire que pour collecter les résultats (score, comptes élèves) : hors périmètre.
- Une fiche à la fois, grandes cases, passage automatique à la case suivante, case verte ou rouge, résumé en fin de lot.
- Réponse brouillée dans le lien pour ne pas être lisible en clair.

## Propositions complémentaires (à valider)

| Idée | Taille | Intérêt |
|---|---|---|
| 2 fiches par page A4 | M | Divise le papier par deux pour les mots courts. |
| Niveaux du Mot secret | M | Facile : quelques lettres déjà écrites. Difficile : dessins pièges sur des lettres absentes du mot. |
| Nouveaux thèmes | S chacun | Rentrée, ferme, espace, animaux, carnaval, galette des rois. |
| Application installable hors ligne (PWA) | M | Icône sur le téléphone ou l'ordinateur de classe, marche sans réseau. |

## Ordre suggéré après la v1.0.0

1. ✅ Ko-fi (n° 1).
2. ✅ Partage par lien (n° 3).
3. ✅ Projection (n° 4), puis ✅ mode présentateur (n° 4 bis).
4. Fond personnalisé (n° 5).
5. Mode en ligne (n° 6), si le besoin se confirme.
6. ✅ Contact (n° 2).
