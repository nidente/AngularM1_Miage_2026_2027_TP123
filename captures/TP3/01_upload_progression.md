# Capture Network — Upload avec progression (Mission 6)

Screenshot UI : [`01_upload_progression_ui.png`](./01_upload_progression_ui.png)

## Conditions

En local, un upload de quelques Mo est instantané : la progression passerait directement de 0 à 100 %. Pour l'observer, le navigateur passait par un petit proxy TCP de test (port 4300 → `ng serve` sur 4200) qui bride l'envoi à environ 250 Ko/s. Le throttling « Slow 3G » des devtools de Chrome ne ralentit pas le corps d'un upload, d'où ce proxy. Le fichier faisait ~21 Mo (`song1.mp3` répété 6 fois, sous la limite de 25 Mo), pour dépasser la taille des tampons TCP du système.

## Requête

- **Méthode** : `POST`
- **URL** : `/api/tracks` (proxifiée vers `http://localhost:3000/api/tracks`)
- **Type** : `xhr`. Depuis Angular 22, le backend HTTP par défaut est `fetch()`, qui ne remonte pas la progression d'un envoi. `withXhr()` a été ajouté dans `main.ts`.
- **Authorization** : `Bearer <JWT masqué>`, ajouté par `auth.interceptor.ts`
- **Corps** : `multipart/form-data` avec deux champs, `audio` (le fichier) et `title` (`Capture Network TP3`)
- **Options Angular** : `observe: 'events'`, `reportUploadProgress: true`

## Événements de progression observés

23 événements `xhr.upload.onprogress` pour une seule requête (extrait) :

| Temps | Octets envoyés / total | Affiché |
|---|---|---|
| +0,1 s | 2 785 280 / 21 632 324 | 13 % |
| +16,6 s | 6 488 064 / 21 632 324 | 30 % |
| +36,4 s | 11 124 736 / 21 632 324 | 51 % |
| +57,2 s | 15 794 176 / 21 632 324 | 73 % |
| +77,1 s | 20 414 464 / 21 632 324 | 94 % |
| +85,3 s | 21 632 324 / 21 632 324 | 100 % → « Fichier reçu, enregistrement… » |

Séquence affichée dans l'interface : 0 % → 13 % → 17 % → … → 94 % → 99 % → « Fichier reçu, enregistrement… » → message de réussite.

## Réponse

- **Statut** : `201 Created`, corps JSON de la piste créée (id masqué)
- Puis `GET /api/tracks?page=1&limit=5` → `200` : la liste est rechargée et la nouvelle piste apparaît en tête.

## Constat

Pendant l'envoi, le titre, le sélecteur de fichier et le bouton sont désactivés (vérifié par le script), et la barre Material suit le pourcentage. Le premier palier à 13 % correspond aux octets absorbés d'un coup par les tampons TCP. À 100 %, le fichier est envoyé mais le serveur n'a pas encore répondu : il écrit le fichier et crée le document MongoDB. L'interface l'indique (« Fichier reçu, enregistrement… ») au lieu d'annoncer une réussite prématurée. Aucun JWT ni mot de passe dans la console. Piste supprimée juste après (capture 02).
