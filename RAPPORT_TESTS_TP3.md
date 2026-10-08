# Rapport des tests — TP3

Exécution du 8 octobre 2026. Aucun test ne dépend d'un backend lancé ni de MongoDB.

## Lancer les tests

```bash
cd frontend-starter && npm test     # Vitest + jsdom (builder @angular/build:unit-test)
cd backend && npm test              # node --test
cd frontend-starter && npm run build
```

Configuration ajoutée pour que `npm test` fonctionne côté frontend : `jsdom` en devDependency (le runner refusait de démarrer sans environnement DOM), `tsconfig.spec.json` (types `vitest/globals`), options `buildTarget`/`tsConfig` de la cible `test` dans `angular.json`, et exclusion des `*.spec.ts` dans `tsconfig.app.json`.

## Résultat global

| Suite | Fichiers | Tests | Résultat observé |
|---|---|---|---|
| Frontend (`npm test`) | 5 | 18 | 18 réussis, 0 échec |
| Backend (`npm test`) | 2 | 8 (2 existants + 6 ajoutés) | 8 réussis, 0 échec |
| `npm run build` | — | — | OK, sans erreur ni warning |

## Tests frontend

Les appels HTTP sont interceptés par `HttpTestingController` (`provideHttpClientTesting()`) : chaque test vérifie la requête émise (URL, méthode, paramètres, headers, corps) puis lui fournit une réponse simulée. `afterEach(() => http.verify())` fait échouer un test si une requête inattendue est partie.

| # | Fichier | Test | Résultat attendu | Observé |
|---|---|---|---|---|
| 1 | `auth.service.spec.ts` | `login()` | `POST /api/auth/login`, corps `{ email, password }` ; token mémorisé (signal + `localStorage`) | ✅ |
| 2 | `auth.service.spec.ts` | `login()` en 401 | erreur transmise (401), aucun token mémorisé | ✅ |
| 3 | `track.service.spec.ts` | `list(3, 10)` | `GET /api/tracks?page=3&limit=10` | ✅ |
| 4 | `track.service.spec.ts` | `remove('t1')` | `DELETE /api/tracks/t1`, réponse 204 | ✅ |
| 5 | `track.service.spec.ts` | `upload()` | `POST /api/tracks`, `FormData` avec `audio` et `title`, `reportUploadProgress` ; émissions `Sent` → `UploadProgress` → `Response` | ✅ |
| 6 | `auth.interceptor.spec.ts` | token présent | header `Authorization: Bearer <token>` ajouté | ✅ |
| 7 | `auth.interceptor.spec.ts` | pas de token | aucun header `Authorization` | ✅ |
| 8 | `auth.interceptor.spec.ts` | 401 avec token | erreur transmise, token effacé, navigation vers `/login` | ✅ |
| 9 | `auth.guard.spec.ts` | sans token | renvoie un `UrlTree` vers `/login` | ✅ |
| 10 | `auth.guard.spec.ts` | avec token | renvoie `true` | ✅ |
| 11 | `tracks-page.spec.ts` | échec du chargement (500) | message du serveur affiché dans `.list-error`, liste vide | ✅ |
| 12 | `tracks-page.spec.ts` | suppression confirmée | `DELETE /api/tracks/t1`, état `deletingId` pendant la requête, succès notifié, puis `GET` de rechargement : la piste n'est plus listée | ✅ |
| 13 | `tracks-page.spec.ts` | confirmation annulée | aucune requête `DELETE` | ✅ |
| 14 | `tracks-page.spec.ts` | double clic sur supprimer | une seule confirmation, un seul `DELETE` | ✅ |
| 15 | `tracks-page.spec.ts` | suppression en 404 | message « n'existe plus ou ne vous appartient pas », liste rechargée | ✅ |
| 16 | `tracks-page.spec.ts` | progression de l'upload | 0 % → 25 % (affiché « 25 % », bouton désactivé) → `null` si taille inconnue → réussite, formulaire vidé, contrôles réactivés, liste rechargée | ✅ |
| 17 | `tracks-page.spec.ts` | upload en erreur (400) | état `error` avec le message traduit, contrôles réactivés | ✅ |
| 18 | `tracks-page.spec.ts` | double soumission | un seul `POST` | ✅ |

Les tests 1, 3, 6, 9, 11, 12 et 16-17 couvrent les 7 cas proposés par le sujet (au moins 3 demandés).

### Les tests vérifient-ils vraiment quelque chose ?

Contrôle fait en cassant volontairement le code, un défaut à la fois, puis en relançant la suite (le code a été restauré après chaque essai) :

| Défaut introduit | Test qui l'a détecté |
|---|---|
| Plus de rechargement de la liste après un 404 de suppression | #15 (1 échec) |
| Header renommé `Authorisation` dans l'intercepteur | #6 (1 échec) |
| Paramètre `limit` oublié dans `TrackService.list()` | #3 (1 échec) |

Chaque défaut fait échouer un test : les assertions portent bien sur le comportement attendu.

## Tests backend (extension facultative)

Nouveau fichier `backend/test/contract.test.js`. `api.test.js`, les routes et `API_CONTRACT.md` ne sont pas modifiés. Ces cas sont tous refusés par le middleware `auth` ou par Multer **avant** tout accès à MongoDB, donc ils tournent sans base. Le JWT valide est signé avec un secret aléatoire généré par le test (aucun secret écrit dans le code).

| Test | Attendu | Observé |
|---|---|---|
| `GET /api/tracks` sans JWT | 401 « Authentification requise » | ✅ |
| `DELETE /api/tracks/:id` sans JWT | 401 | ✅ |
| `GET /api/tracks` avec un JWT malformé | 401 « Jeton invalide ou expiré » | ✅ |
| `GET /api/tracks` avec un JWT signé par un autre secret | 401 | ✅ |
| `POST /api/tracks` sans fichier (JWT valide) | 400 « Fichier audio requis » | ✅ |
| `POST /api/tracks` avec un fichier `text/plain` | 400 « Format audio non accepté » | ✅ |

**Non automatisés** : la pagination (`page`/`limit`) et l'accès à la piste d'un autre utilisateur interrogent MongoDB. Les automatiser demanderait une base de test (Atlas ou `mongodb-memory-server`, nouvelle dépendance). Ces deux comportements ont été vérifiés à la main : pagination au TP2 (captures), isolation par propriétaire au checkpoint TP2 (`404` pour un autre compte). Pour `DELETE`, le filtre `{ _id, ownerId: req.auth.sub }` ([app.js:411](backend/src/app.js#L411)) produit ce même 404, dont le traitement frontend est testé (#15) et capturé (`captures/TP3/03_suppression_404.md`).
