# Le Petit Chat

Statut : fiche de conception validée, structure préparée. Prototype jouable : exploration, dialogues dans le décor, première amitié avec Mad Nebula et Moon Key à ramasser.

Titre : **Le Petit Chat**. Signature : *A small adventure among the stars.* Le jeu sera en anglais.

## Organisation

- `index.html` : page du jeu, actuellement une page d'attente.
- `css/game.css` : styles du jeu, indépendants du portfolio.
- `js/game.js` : point d'entrée du futur prototype.
- `assets/characters/` : personnage principal et animations.
- `assets/cats/` : chats et animations.
- `assets/environments/` : décors et éléments d'exploration.
- `assets/audio/` : musiques et sons.
- `CONCEPT.md` : fiche de conception et décisions à prendre.

Le portfolio reste à la racine. L'aperçu et le lien dans Playground seront ajoutés quand une première version sera prête.

## Aperçu local

Depuis la racine du dépôt : `python3 -m http.server 8000`, puis ouvrir `http://localhost:8000/game/`.

## Prochaine étape

Définir la première rencontre jouable à partir de la fiche validée, puis construire le prototype.

## Prototype 02

- Déplacements : flèches, WASD, ZQSD ou commandes tactiles.
- Réactions : petites bulles de pensée avec pictogrammes, temporaires et sans clic à effectuer.
- Mad Nebula : nourriture, refus des câlins, jeu et respect de son espace. Deux niveaux de confiance.
- Moon Key : approcher la clé dorée au sud-ouest, puis E ou Pick up. Elle est conservée dans localStorage pour une future planète ; aucune porte à ouvrir dans ce chapitre.
- Restart chapter réinitialise la rencontre, mais conserve la clé collectée.
- La progression de confiance reste limitée à la session.

## Interface simplifiée

Le panneau présente uniquement le nom du chat, la confiance (0 à 2), les besoins Food / Space et la sacoche. Les réactions apparaissent automatiquement pendant environ trois secondes, et restent en pause quand le jeu est en pause. Les actions redonnent le focus au décor pour reprendre immédiatement les déplacements.

## Portail et intégration

Après le niveau 2 de confiance, le portail en bas à droite s'active. Approcher puis utiliser E ou Teleport ouvre l'écran d'arrivée de la prochaine planète, encore en préparation. Le bouton Return to Mad Nebula conserve la confiance et l'inventaire. La Moon Key reste disponible ; aucun nouveau chat ni défi n'est encore défini pour cette destination.

Le portfolio inclut une miniature SVG animée indépendante du moteur du jeu et un lien vers `game/` dans Playground.

## Jouer dans Playground

Le clic sur la miniature ou Play charge `game/index.html?embed=1` dans une iframe sur le portfolio. Aucun nouvel onglet n'est nécessaire. Close game détruit la session et réaffiche l'aperçu ; la clé reste sauvegardée mais la confiance recommence. Open full page utilise explicitement `game/index.html` pour fonctionner aussi dans un aperçu de fichiers local. Cliquer le décor active les commandes clavier.
