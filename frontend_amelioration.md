# Amélioration du frontend (avant le TP2)

Refonte visuelle de l'application Angular, faite avec Claude Code. Fil conducteur du design : l'univers de l'ampli de guitare (vert « tolex » grainé, accent laiton, médiator). Aucune modification dans `backend/`, `API_CONTRACT.md` inchangé (seules des routes existantes sont appelées). `npm run build` passe sans warning après chaque étape. La page Backing tracks est volontairement laissée de côté : elle sera refaite au TP2.

---

## 1. Barre de navigation

**Prompt**

> Modernise la barre de navigation de l'application, sans toucher au backend.
> - Mets en évidence le lien de la page courante (`routerLinkActive`).
> - Connecté : affiche l'utilisateur (avatar avec son initiale) et regroupe l'accès au profil et la déconnexion dans un menu déroulant.
> - Déconnecté : n'affiche que « Connexion » et un bouton « Créer un compte » ; masque « Backing tracks », qui est une route protégée.
> - Ajoute un logo et rends le titre cliquable vers `/tracks`, avec le slogan sur sa propre ligne.
> - Style moderne et cohérent avec le thème guitare, avec des animations discrètes et respectueuses de `prefers-reduced-motion`.
> - Le nom doit rester affiché après un rechargement de page (F5).

**Changements**

- **Barre flottante** : détachée des bords, coins arrondis, collée en haut au scroll. Le fond est un vert sapin uni avec une texture « tolex » (bruit SVG en CSS) et un liseré laiton intérieur façon passepoil d'ampli. Plusieurs versions en verre transparent ont été essayées puis écartées au profit de ce fond plein.
- **Logo** : médiator laiton en SVG avec trois barres d'égaliseur, qui s'animent au survol. Le titre est en police display *Bricolage Grotesque*, le slogan sur une ligne séparée.
- **Lien actif** : texte blanc et petit point laiton dessous (repère de frette), avec `aria-current="page"`.
- **Menu du compte** : bouton avatar laiton avec une flèche. Le menu déroulant affiche le nom, l'email, « Mon profil » et « Se déconnecter ». Il se ferme au clic à l'extérieur ou avec Échap.
- **Déconnecté** : lien « Connexion » et bouton laiton « Créer un compte ».
- **Corde de guitare** au pied de la barre : elle vibre au survol d'un lien ou du logo (CSS uniquement, `:has()`).
- **Au scroll**, la barre se compacte (64 → 54px).
- **Rechargement de page** : un `effect()` dans `AppComponent` recharge le profil (`GET /api/users/me`) si un token existe mais que `currentUser()` est vide.
- **Polices** Figtree (texte) et Bricolage Grotesque (titres), chargées depuis Google Fonts. Les couleurs passent par des variables CSS.

Fichiers : `app.html`, `app.ts`, `app.css`, `styles.css`, `index.html`.

---

## 2. Pages connexion et inscription

**Prompt**

> Refais les pages de connexion et d'inscription dans le même style que la navbar, de façon nettement plus moderne.
> - Mise en page marquante : écran scindé, avec un visuel lié à la guitare d'un côté et le formulaire de l'autre, en un seul composant de mise en page partagé par les deux pages.
> - Bouton submit en pleine largeur, avec un état de chargement (« Connexion… ») et désactivé pendant la requête pour éviter le double clic.
> - Bouton œil pour afficher ou masquer le mot de passe.
> - Bordure rouge sur un champ invalide et touché, en plus du message d'erreur.
> - Focus clavier bien visible sur les champs.
> - Garde les validations existantes et ne change aucune route.

**Changements**

- **Nouveau composant `auth-layout`**, avec les inputs `heading` et `subtitle` et `<ng-content>` pour le formulaire.
  - À gauche, un panneau tolex avec le titre « Vos backing tracks, partout où vous jouez. » et un **manche de guitare en SVG** : 12 frettes à l'écartement réaliste, 6 cordes, repères nacrés. Les cordes sont grattées à l'ouverture de la page et vibrent au survol.
  - À droite, le formulaire.
  - Sur mobile, le panneau passe au-dessus du formulaire.
- **Champs** de 48px : bordure laiton et halo au focus, bordure rouge si le champ est invalide après être passé dessus.
- **Bouton œil** (icônes SVG, `aria-label` et `aria-pressed`).
- **Bouton submit laiton** : signal `loading` et `finalize()` pour réactiver le bouton dans tous les cas. Il affiche un spinner avec « Connexion… » ou « Création du compte… ».
- **Erreur serveur** dans un encadré `role="alert"`.
- **Lien de bascule** en bas du formulaire : « Pas encore de compte ? » / « Déjà inscrit ? ».

Fichiers : `auth-layout/*` (nouveau), `login-page.*`, `register-page.*`, `styles.css`.

---

## 3. Page profil

**Prompt**

> Refais la page profil dans le même style que la navbar et les pages de connexion.
> - Un en-tête qui met en avant l'utilisateur : grand avatar avec l'initiale, nom, email, date d'inscription au format français.
> - Un résumé de sa bibliothèque (nombre de pistes, dernier ajout), sans créer de nouvelle route API.
> - Le formulaire de modification du nom, avec état de chargement, message de confirmation après l'enregistrement et bouton désactivé si le nom n'a pas changé.
> - Corrige le double appel `GET /api/users/me` quand on recharge directement `/profile`.

**Changements**

- **En-tête tolex** avec liseré laiton, grand avatar laiton en relief, nom en grand, email et « Membre depuis le 29 septembre 2026 ». Un avatar en forme de potard d'ampli gradué a été essayé puis retiré, car on ne comprenait pas ce que c'était.
- **Panneau « Ma bibliothèque »** : nombre de pistes et dernier ajout via `GET /api/tracks?page=1&limit=1` (l'API renvoie le total et trie par date décroissante). Il affiche un message d'invitation si la bibliothèque est vide et un lien vers `/tracks`.
- **Panneau « Modifier mon nom »** :
  - `minLength(2)`, aligné sur le backend ;
  - bouton désactivé si le nom est inchangé ;
  - spinner pendant l'enregistrement, puis « Nom mis à jour. » affiché 3 secondes (`role="status"`).
- **Double requête corrigée** : la page ne relance plus `GET /api/users/me`. Elle remplit le formulaire via un `effect()` à partir du profil déjà chargé par la nav ou par la connexion. Vérifié : un seul appel au rechargement de `/profile`.
- **Dates en français** : `registerLocaleData(localeFr)` et `LOCALE_ID = 'fr'` dans `main.ts`, utilisés par `DatePipe`.

Fichiers : `profile-page.*`, `main.ts`.

---

## 4. Finitions globales

**Prompt**

> Harmonise le reste de l'application avec le nouveau style.
> - Ajoute un footer discret, qui reste en bas de l'écran même sur les pages courtes.
> - Donne à tous les boutons et champs des états cohérents (survol, clic, focus, désactivé), sans casser les styles spécifiques déjà en place.
> - Remplace toutes les couleurs écrites en dur par des variables CSS et range `styles.css` par sections.
> - Sur un grand écran, l'interface paraît trop petite : fais en sorte qu'elle s'adapte à la taille de l'écran.
> - Ne change pas la structure de la page Backing tracks, prévue pour le TP2.

**Changements**

- **Footer** : médiator avec « Guitar Practice Cloud » d'un côté, « Projet de Programmation Web, M1 MIAGE, Université Côte d'Azur » et l'année de l'autre. L'application passe en colonne flex (`min-height: 100dvh`, `main { flex: 1 }`), ce qui garde le footer en bas.
- **Boutons** : survol plus foncé, enfoncement au clic, curseur « interdit » quand ils sont désactivés.
- **Champs** : bordure douce et halo laiton au focus.
- **Spécificité maîtrisée** : les états globaux sont écrits avec `:where()` (priorité nulle), pour que les classes spécifiques comme `.toggle-pw` ou `.btn-primary` gardent la main.
- **Variables CSS** partout. Ajout de `--green-dark`, `--line-strong`, `--tolex` et `--tolex-grain`, la texture étant partagée par la nav, les pages d'auth et le profil.
- **Échelle fluide pour les grands écrans** : la taille de base grandit avec la largeur de la fenêtre (`font-size: clamp(1rem, 0.625vw + 0.5rem, 1.25rem)` sur `:root`, soit 16px jusqu'à 1280px et 20px à partir de 1920px). Les dimensions de mise en page ont été converties de px en rem pour suivre ce mouvement, et la largeur du contenu est passée de 1050px à `--content-width: 72rem`. Sur un portable, le rendu ne change pas ; sur un grand écran, tout grandit d'environ 25 %.
- **`styles.css` réorganisé** en sections : bases, boutons/champs, page tracks (à refaire au TP2), formulaires.

Fichiers : `app.html`, `app.ts`, `app.css`, `auth-layout.css`, `styles.css`.

---

**Reste à faire** : menu burger mobile ; refonte de la page Backing tracks au TP2. Bug repéré au passage pour le TP2 : la taille des pistes est affichée en « Ko » alors que la valeur est en octets.
