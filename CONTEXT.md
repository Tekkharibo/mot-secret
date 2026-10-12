# Mot secret

Générateur de fiches imprimables où l'enfant décode un mot dont les lettres sont remplacées par des dessins.

Termes métier en français ; identifiant de code anglais entre parenthèses.

## Language

### Production

**Lot** (`batch`):
Ensemble des fiches générées d'un coup à partir de la liste de mots.
_Avoid_: série, document

**Fiche** (`sheet`):
Page A4 d'exercice consacrée à un seul mot ou une seule expression.
_Avoid_: page, puzzle, exercice

**Page de correction** (`answerPage`):
Page qui récapitule les réponses des fiches du lot, une ligne numérotée par mot.
_Avoid_: corrigé, solution

### Jeu

**Jeu** (`game`):
Règle appliquée à toutes les fiches du lot : Mot secret ou Imagier.
_Avoid_: mode, type

**Mot secret** (`secret`):
Jeu où les lettres du mot sont cachées dans la grille par des dessins du thème tirés au sort.

**Imagier** (`imagier`):
Jeu où chaque lettre du mot devient le dessin de l'alphabet illustré qui commence par cette lettre.
_Avoid_: imagier pour désigner les 26 dessins (dire « alphabet illustré »)

**Niveau** (`level`):
Difficulté de l'Imagier : facile (avec clé), moyen (grille avec les seules lettres du mot dessinées), difficile (sans grille).
_Avoid_: difficulté

### Contenu d'une fiche

**Grille** (`grid`):
Alphabet de 26 cases sur 4 colonnes, Y et Z centrés sur la dernière ligne.
_Avoid_: tableau, alphabet

**Clé** (`key`):
Grille dont chaque case montre le dessin et sa lettre (Imagier, niveau facile).
_Avoid_: légende

**Bande** (`strip`):
Zone du mot à décoder : une rangée de dessins au-dessus d'une rangée de cases à remplir.
_Avoid_: mot, ligne

**Dessin** (`picture`):
Image qui remplace une lettre dans la grille ou la bande.
_Avoid_: icône, picto, emoji, image

**Décor** (`decor`):
Dessins pâles en fond de page, sans rôle dans le jeu.
_Avoid_: fond, illustration

### Paramètres

**Thème** (`theme`):
Ensemble cohérent de couleurs, de dessins, de décor et de 20 mots proposés.
_Avoid_: saison, univers

**Alphabet illustré** (`pictureAlphabet`):
Les 26 dessins fixes de l'Imagier, un par lettre, indépendants du thème.
_Avoid_: imagier

**Tirage** (`seed`):
Valeur qui fixe l'attribution des dessins aux lettres en Mot secret ; « Mélanger » en change.
_Avoid_: graine, aléa
