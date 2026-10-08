# Rapport d'usage de l'IA

Assistant : Claude Code (extension VS Code). Rien n'a été modifié dans `backend/src/` ni dans `API_CONTRACT.md` sur les TP1, TP2 et TP3. Seule exception au TP3 : un fichier de tests ajouté dans `backend/test/` (extension facultative du sujet, sans toucher aux routes).

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

---

## TP3

### Lecture du code et des tests existants

- **Prompt** : *« Lis le sujet TP3, le code concerné et les tests existants, liste ce qui manque, puis propose un plan découpé en points. »*
- **Manques identifiés** : la suppression existait déjà (bonus TP2) mais sans SnackBar et sans gestion du cas « piste déjà supprimée » ; aucune progression d'upload ; aucun `.spec.ts`, et `npm test` ne démarrait pas (environnement DOM manquant).
- **Plan** : 10 points (numérotation de l'assistant, absente du sujet), validés avant de coder.

### Mission 5 — Suppression d'une piste

- **Prompt** : *« Remplace les messages de suppression par une SnackBar Material, puis gère le 404 quand la piste a déjà été supprimée dans un autre onglet. »*
- **Fait** :
  - `shared/services/notification.service.ts` (nouveau) : enveloppe `MatSnackBar` (succès 4 s ; erreur 8 s avec bouton « Fermer », annoncée aux lecteurs d'écran) ;
  - 404 : message « Cette piste n'existe plus ou ne vous appartient pas. La liste a été mise à jour. » **et** rechargement de la page courante, pour retirer la card fantôme et corriger le compteur ;
  - `deletingId` remis à zéro dans un `finalize()` ; messages d'erreur par code HTTP (`deleteErrorMessage()`).
- **Gardé** : `window.confirm` pour la confirmation (le sujet ne demande pas de dialog Material).
- **Fichiers** : `notification.service.ts`, `tracks-page.*`, `audio-file.validator.ts`, `styles.css`.
- **Vérification** : `npm run build` OK ; navigateur : 204 → SnackBar de succès + rechargement ; piste supprimée depuis un second onglet → 404 → SnackBar d'erreur, card fantôme retirée, compteur correct.

#### Explication : pourquoi un service, et pourquoi le guard ne suffit pas

- **Service** : le composant ne connaît que `TrackService.remove(id)`. L'URL, la méthode et le JWT (ajouté par l'intercepteur) sont centralisés à un seul endroit, et le composant se teste en simulant le service ou la réponse HTTP.
- **Guard et interface** : ils ne tournent que dans le navigateur de l'utilisateur. N'importe qui peut appeler `DELETE /api/tracks/:id` avec `curl` ou les devtools, sans passer par Angular, ou modifier le code chargé. Masquer un bouton ou bloquer une route n'empêche donc rien.
- **Ce qui protège vraiment** : le backend. Le middleware `auth` vérifie la signature et l'expiration du JWT (sinon 401), puis `findOneAndDelete({ _id, ownerId: req.auth.sub })` ne supprime que si la piste appartient à l'utilisateur du token. Sinon il répond 404, sans même révéler que la piste existe.

### Mission 6 — Progression de l'upload

- **Prompt** : *« Fais émettre à l'upload ses événements HTTP et affiche un état unique : aucun envoi / en cours avec pourcentage / réussi / échoué. »*
- **Fait** :
  - `TrackService.upload()` : `observe: 'events'` + `reportUploadProgress: true` ;
  - `shared/models/upload-state.model.ts` (nouveau) : type union `idle | uploading(progress) | success(track) | error(message)`. Il remplace trois signaux indépendants (`uploading`, `uploadError`, `uploadSuccess`) qui pouvaient se contredire ;
  - `<mat-progress-bar>` + pourcentage ; mode indéterminé si la taille totale est inconnue ; à 100 % : « Fichier reçu, enregistrement… » (le serveur n'a pas encore répondu) ;
  - contrôles désactivés pendant l'envoi, garde anti double soumission conservée, largeur du bouton fixée pour que les champs ne bougent pas.
- **Problème rencontré** : la barre restait bloquée à 0 %. **Cause** : depuis Angular 22, le backend HTTP par défaut est `fetch()`, qui ne remonte pas la progression d'un envoi. `reportProgress` est d'ailleurs déprécié au profit de `reportUploadProgress`. **Corrigé** : `provideHttpClient(withXhr(), …)` dans `main.ts`.
- **Fichiers** : `track.service.ts`, `upload-state.model.ts`, `tracks-page.*`, `main.ts`.
- **Vérification** : en local l'envoi est instantané, et le throttling des devtools ne ralentit pas le corps d'un upload. Test fait via un petit proxy TCP qui bride le débit (script de test hors projet) : 23 événements de 13 % à 100 % pour un fichier de 21 Mo ; erreur 400 simulée → message traduit, contrôles réactivés ; aucun JWT ni mot de passe dans la console.

#### Explication : pourquoi un upload avec progression se traite différemment

Une requête « normale » (`observe: 'body'`) n'émet qu'une seule valeur, la réponse finale, puis se termine. Avec `observe: 'events'`, le même Observable émet plusieurs fois pour une seule requête : `Sent` (requête partie), plusieurs `UploadProgress` (`loaded` / `total` octets envoyés), puis `Response` (le corps). Le code doit donc trier les événements selon leur `type`, ne prendre la piste créée que dans l'événement `Response`, et ne pas déclarer la réussite dès 100 % : à ce moment-là, le serveur écrit encore le fichier et le document MongoDB. Le pourcentage vaut `Math.round(100 * loaded / total)`, et `total` peut manquer, d'où le mode indéterminé.

### Mission 7 — Tests automatisés

- **Prompt** : *« Rends `npm test` fonctionnel, puis écris des tests ciblés avec réponses HTTP simulées : services, intercepteur, guard, et le composant (erreur, suppression, progression d'upload). »*
- **Fait** : 18 tests frontend dans 5 fichiers, 6 tests backend ajoutés (401 sans JWT et avec JWT invalide, upload sans fichier, MIME refusé) dans `backend/test/contract.test.js`.
- **Config** : `jsdom` (devDependency), `tsconfig.spec.json`, cible `test` d'`angular.json` complétée, specs exclues du build applicatif.
- **Non fait** : tests backend de pagination et de piste d'un autre utilisateur. Ils demandent MongoDB (base de test ou nouvelle dépendance) ; ces deux points ont été vérifiés à la main au TP2.
- **Vérification** : 18/18 et 8/8. Les tests ont aussi été validés en cassant volontairement le code 3 fois (oubli de `limit`, header mal nommé, pas de rechargement après 404) : chaque défaut fait échouer un test.
- **Rapport** : [RAPPORT_TESTS_TP3.md](RAPPORT_TESTS_TP3.md) (résultats attendus et observés).

### Vérifications finales et checkpoint Network TP3

- `npm run build` OK ; `npm test` frontend 18/18 ; `npm test` backend 8/8.
- `DELETE` après confirmation → capturé : [Suppression](captures/TP3/02_suppression.md) ; cas 404 : [Suppression d'une piste déjà supprimée](captures/TP3/03_suppression_404.md).
- Upload et événements de progression → capturé : [Upload avec progression](captures/TP3/01_upload_progression.md).
- Console : le seul 404 inattendu venait de `favicon.ico`, absent du starter. Corrigé avec `public/favicon.svg` (le médiator du logo). Il ne reste que les erreurs attendues des scénarios d'échec, sans aucune donnée sensible.

### Restitution orale — réponses préparées

1. **Pourquoi la suppression passe par un service ?** Pour séparer l'affichage de l'accès HTTP : une seule définition de l'URL et de la méthode, un JWT ajouté par l'intercepteur, un composant testable en simulant le réseau.
2. **Comment le backend protège la suppression ?** Middleware `auth` (JWT valide et non expiré, sinon 401), puis suppression filtrée par `ownerId = req.auth.sub` (sinon 404). L'interface Angular, elle, est contournable.
3. **Comment Angular calcule le pourcentage d'upload ?** Avec `withXhr()`, `HttpClient` écoute `xhr.upload.onprogress` et émet des `HttpUploadProgressEvent` (`loaded`, `total`). On calcule `100 * loaded / total`. Il faut `observe: 'events'` + `reportUploadProgress: true`. Le backend `fetch` par défaut ne le permet pas.
4. **Pourquoi les tests HTTP n'ont pas besoin de MongoDB ?** `provideHttpClientTesting()` remplace le réseau : aucune requête ne quitte le test. `HttpTestingController` capture la requête, on vérifie URL, méthode, paramètres et headers, puis on fournit nous-mêmes la réponse (`flush`). Côté backend, les cas testés sont refusés avant tout accès à la base.
5. **Que vérifie un test d'intercepteur ou de guard ?** Intercepteur : le header `Authorization: Bearer …` est présent avec un token et absent sans, et un 401 avec token déconnecte et redirige. Guard : sans token, il renvoie un `UrlTree` vers `/login` ; avec token, `true`.
6. **Test unitaire vs test d'intégration ?** Un test unitaire isole une pièce (un service, un guard) et simule tout le reste, ici le réseau. Il est rapide, déterministe et pointe la cause d'un échec. Un test d'intégration fait fonctionner plusieurs pièces réelles ensemble (Angular + Express + MongoDB). Il attrape les problèmes d'assemblage mais il est plus lent et dépend de l'environnement. Les tests backend ajoutés sont intermédiaires : vrai serveur Express et vrais middlewares, mais sans base.
