# 🎃 Nuit de l’horreur

Jeu de tir 3D d’Halloween qui tourne dans le navigateur (téléphone en paysage, clavier AZERTY, manette Xbox).
Aucun serveur ni outil de compilation : ce sont **3 fichiers statiques**.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html` | Structure de la page (interface, menus) et chargement des scripts |
| `style.css` | Toute la mise en forme (variables de couleurs en haut du fichier) |
| `game.js` | Toute la logique du jeu, découpée en 14 sections numérotées (voir l’en-tête du fichier) |

Le moteur 3D [three.js r128](https://cdnjs.com/libraries/three.js/r128) est chargé depuis le CDN cdnjs (voir `index.html`).

## Tester en local

Ouvrez simplement `index.html` dans un navigateur, ou lancez un petit serveur :

```bash
python3 -m http.server 8080   # puis ouvrez http://localhost:8080
```

## Mettre en ligne (hébergement statique gratuit)

Il suffit d’envoyer le dossier tel quel, **sans commande de build** :

- **Netlify** : glissez-déposez le dossier sur https://app.netlify.com/drop
- **GitHub Pages** : créez un dépôt, envoyez les 3 fichiers, puis *Settings → Pages → Deploy from a branch → main / (root)*
- **Cloudflare Pages** ou **Vercel** : importez le dépôt ; framework « None », dossier de sortie `/` (racine)
- **Firebase Hosting** : `firebase init hosting` (dossier public = ce dossier), puis `firebase deploy`

Conseils :
- Utilisez **HTTPS** (fourni par tous les services ci-dessus) : il est nécessaire pour le plein écran et le verrouillage de l’orientation sur mobile.
- Pour fonctionner **sans dépendance externe**, téléchargez `three.min.js` (r128) dans un dossier `lib/` et remplacez l’URL du CDN dans `index.html` par `lib/three.min.js`.
- Les réglages et le record sont enregistrés dans le navigateur (`localStorage`), propres à chaque appareil et à chaque adresse.

## Où modifier quoi (dans `game.js`)

| Pour changer… | Cherchez |
|---|---|
| Les armes (dégâts, cadence, prix) | tableau `W`, puis `MG` `RT` `RV` `PA` `PR` `WT` |
| Les ennemis (vie, vitesse, dégâts) | tableau `T` |
| Les cartes, couleurs et histoire par étape | tableau `MAP` ; densité du brouillard : `FD` |
| Les pouvoirs de la boutique | tableaux `POW` (passifs) et `AC` (actifs) |
| Les dialogues | `INTRO` (début) et `OUTRO` (fin) |
| Les réglages par défaut | objet `CFG` |
| Les attaques des boss | fonction `bossAI` |
| Les couleurs de l’interface | variables `:root` en haut de `style.css` |

## Commandes

- **Clavier AZERTY** : ZQSD bouger · souris ou flèches viser · clic / Espace tirer · clic droit ou Maj viser · R recharger · A / E ou molette changer d’arme · F pouvoir actif · P paramètres
- **Manette Xbox** : sticks bouger / viser · RT tirer · LT viser · X recharger · Y pouvoir · LB / RB armes · Start continuer
- **Tactile** : glisser à gauche pour bouger, à droite (ou depuis TIR) pour viser ; boutons TIR, ARME, RECH., VISER, POUVOIR
