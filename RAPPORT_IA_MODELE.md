# Rapport d'usage de l'IA

Assistant : Claude Code (extension VS Code). Sauf mention contraire, rien n'a été modifié dans `backend/` ni dans `API_CONTRACT.md` sur tout le TP1 et le TP2.

---

## TP1

### Mission 0 — Cartographie

- **Objectif** : comprendre l'architecture avant de coder.
- **Prompt** : *« Parcours le projet et cartographie l'appli : composants, routes, mécanisme JWT, flux de connexion. »*
- **Résultat** : [MISSION_0_CARTOGRAPHIE.md](MISSION_0_CARTOGRAPHIE.md).
- **Vérification** : lecture manuelle, comparée au code.

### Mission 1 — Inscription, connexion, profil

- **Objectif** : compléter la partie utilisateur (logout, gestion du 401, validations).
- **Prompt** : *« Ajoute la déconnexion, gère le 401 sur token invalide, renforce les validations de formulaire. »*
- **Rejeté** : un bouton « Rafraîchir mon profil » proposé puis retiré — redondant, car `PUT /api/users/me` met déjà à jour l'affichage.
- **Fichiers** : `auth.interceptor.ts`, `app.ts`/`.html`, `register-page.*`, `login-page.*`, `profile-page.*`.
- **Vérification** : `npm run build` OK ; testé dans le navigateur.
- **Ce qu'on sait expliquer** : l'intercepteur ne redirige que sur un 401 reçu *avec* un token (pas sur un mauvais mot de passe) ; `token()` persiste au rechargement (`localStorage`), `currentUser()` non, d'où le rechargement automatique du profil.

### Checkpoint Network TP1

5 scénarios capturés dans [`captures/TP1/`](captures/TP1/) : connexion réussie/refusée, lecture et modification du profil, token invalide → redirection `/login`.

---

## TP2

### Prérequis

Vérifiés avec `curl` : backend lancé, proxy correct, compte démo fonctionnel, les 3 routes du contrat répondent comme attendu, fichiers audio de test < 25 Mo.

### Mission 2 — Bibliothèque paginée (Angular Material)

- **Objectif** : pagination serveur avec Signals + Paginator Material.
- **Prompt** : *« Vérifie/complète la pagination avec des Signals (tracks, page, pages, loading, error), puis utilise le Paginator Angular Material. »*
- **Fait** : signal `error` ajouté ; `<mat-paginator>` (5/10/20 par page, libellés en français) ; conversion page Material (0-based) ↔ API (1-based) ; requête précédente annulée à chaque changement de page.
- **Bug trouvé et corrigé** : après une erreur, l'ancienne liste restait affichée sous un paginator qui annonçait une autre page — la liste est maintenant vidée en cas d'erreur.
- **Fichiers** : `tracks-page.*`, `styles.css`, `main.ts`, `angular.json`, + `shared/i18n/french-paginator-intl.ts` (nouveau).
- **Vérification** : page 1/2 testées, une requête HTTP par changement de page (`?page=…&limit=…`), aucun découpage côté Angular, boutons désactivés aux bornes.
- **Ce qu'on sait expliquer** : pourquoi la pagination doit se faire côté serveur ; pourquoi `pageIndex = page - 1` ; pourquoi on annule la requête précédente.

### Mission 3 — Upload, cards, lecture audio

- **Objectif** : analyser l'existant puis compléter uniquement ce qui manque côté frontend, sans toucher au contrat.
- **Prompt** : *« Analyse les flux upload/lecture et les contrôles backend, puis ajoute la validation frontend, les états d'envoi, des cards responsives, et complète la lecture (morceau en cours, erreurs, révocation de l'ObjectURL). »*
- **Fait** :
  - validation frontend (`shared/validators/audio-file.validator.ts`, mêmes règles que le backend) ;
  - états d'envoi : chargement, anti double-soumission, erreurs traduites, succès, remise à zéro du formulaire ;
  - cards (`components/track-card/`) + pipes `fileSize`/`audioFormat` (corrigent l'affichage, qui montrait des « Ko » sur des octets) ;
  - lecture : morceau en cours affiché, spinner par piste, erreurs traduites par **code HTTP** (avec `responseType: 'blob'`, le corps d'une erreur est aussi un `Blob`, donc illisible en JSON), `ObjectURL` révoquée à la destruction du composant.
- **Fichiers créés** : `audio-file.validator.ts`, `file-size.pipe.ts`, `audio-format.pipe.ts`, `components/track-card/*`.
- **Fichiers modifiés** : `tracks-page.*`, `styles.css`.
- **Vérification** : fichier invalide refusé (0 requête) ; double-clic → 1 seul `POST` ; envoi réussi → confirmation + formulaire vidé ; lecture → bandeau + card surlignée ; erreur simulée → message correct.
- **Ce qu'on sait expliquer** : la validation frontend améliore l'expérience mais ne remplace jamais le backend (contournable, vérifié avec `curl`) ; la différence entre le streaming serveur (`res.sendFile`, lu depuis le disque), le téléchargement en `Blob` côté client (tout ou rien) et le buffering du lecteur `<audio>` une fois le fichier en mémoire.

#### Questions mémoire, buffering, streaming

- **Le fichier est-il streamé par le backend ?** Oui, `res.sendFile()` ([app.js:394](backend/src/app.js#L394)) lit le fichier par flux depuis le disque, sans le charger en RAM côté serveur.
- **Quand le composant reçoit-il le fichier ?** En une seule fois, à la fin : `HttpClient` assemble tout le `Blob` avant d'émettre quoi que ce soit.
- **100 morceaux affichés = 100 fichiers en mémoire ?** Non. `GET /api/tracks` ne renvoie que des métadonnées ([app.js:290](backend/src/app.js#L290), `storedName` exclu) ; l'audio n'est téléchargé qu'au clic sur ▶.
- **Différence avec 100 `<audio src="...">` directs ?** Pas de JWT envoyé (401 pour chacun) et préchargement automatique des métadonnées par le navigateur, sans action de l'utilisateur.
- **Pourquoi révoquer l'`ObjectURL` ?** Sinon le `Blob` reste en mémoire indéfiniment ; le code la révoque à chaque changement de piste et à la destruction du composant.

### Améliorations facultatives

- **Prompt** : *« Ajoute la suppression avec confirmation, le rafraîchissement après suppression, le filtre par titre, et un bouton play/pause. »*
- **Suppression** : confirmation (`window.confirm`), `DELETE /api/tracks/:id` (bonus déjà au contrat), retour automatique à la page précédente si la dernière piste d'une page est supprimée.
- **Play/pause** : bascule sans nouvelle requête HTTP, synchronisée avec les contrôles natifs du lecteur.
- **Filtre par titre** : limité à la page affichée (le backend n'a pas de paramètre de recherche ; choix validé avec Aziz plutôt que de modifier le backend).
- **Non fait** : barre de progression de l'upload (facultatif, non demandé).
- **Fichiers** : `tracks-page.*`, `track-card.*`, `track.service.ts`, `styles.css`.

### Checkpoint Network TP2

- `page` change à chaque navigation → capturé : [Pagination](captures/TP2/01_pagination.md).
- Upload multipart avec `audio`+`title` → capturé : [Upload](captures/TP2/02_upload.md).
- Réponse de lecture en flux audio → capturé : [Lecture authentifiée](captures/TP2/03_lecture_audio.md).
- Fichier invalide → `400` affiché (vérifié `curl` + frontend).
- Isolation par propriétaire → vérifié avec un second compte : `200` pour le propriétaire, `404` pour un autre utilisateur, `401` sans token.

### Bug trouvé et corrigé pendant les vérifications

Le bouton « Envoyer » avait cessé de fonctionner après la refonte des cards : il rechargeait la page au lieu d'uploader. **Cause** : `<form (ngSubmit)="upload()">` sans `[formGroup]` ni `FormsModule` ne déclenche jamais `(ngSubmit)`, donc le clic faisait une vraie soumission HTML native. **Corrigé** : retour à un bouton `type="button" (click)="upload()"`, avec `(keydown.enter)` sur le titre pour garder le raccourci clavier.

### Explication : `Blob` et `ObjectURL`

**Upload** : le fichier choisi est mis dans un `FormData` (`audio` + `title`) et envoyé avec `HttpClient.post`, qui reçoit automatiquement le JWT via l'intercepteur.

**Lecture** : `GET /api/tracks/:id/audio` est appelé avec `responseType: 'blob'`. Une fois le fichier reçu en entier, `URL.createObjectURL(blob)` crée une URL locale affectée au lecteur `<audio>` — qui lit alors depuis la mémoire du navigateur, pas depuis le réseau.

**Pourquoi un `Blob` et pas une URL directe** : une URL mise dans `<audio src="...">` est demandée par le navigateur sans passer par `HttpClient`, donc sans JWT (401 vérifié). Le `Blob` est la seule façon de lire un fichier protégé.

**Pourquoi révoquer** : l'URL garde le `Blob` en mémoire tant qu'elle n'est pas révoquée. Le code le fait à chaque changement de piste et à la destruction du composant.
