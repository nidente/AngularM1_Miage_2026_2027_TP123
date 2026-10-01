# Capture Network — Lecture audio authentifiée (Mission 3)

Screenshot UI : [`03_lecture_audio_ui.png`](./03_lecture_audio_ui.png)

## Requête

- **Méthode** : `GET`
- **URL** : `http://localhost:4200/api/tracks/<id>/audio` (proxifiée vers `http://localhost:3000/api/tracks/<id>/audio`)
- **Authorization** : `Bearer <JWT masqué>` — ajouté automatiquement par `auth.interceptor.ts`, indispensable ici car la route est protégée (sans lui, `401`).

## Réponse

- **Statut** : `200 OK`
- **Content-Type** : `audio/mpeg`
- **Corps** : flux binaire (le fichier audio), streamé depuis le disque par `res.sendFile()` côté backend — jamais chargé entièrement en RAM côté serveur.

## Constat

`TrackService.audio(id)` récupère ce flux avec `responseType: 'blob'`. Une fois reçu, `URL.createObjectURL(blob)` donne une URL locale (`blob:http://localhost:4200/...`) affectée au lecteur `<audio>`. La capture montre le bandeau « Lecture en cours : Capture Network TP2 », la card correspondante surlignée d'un liseré laiton, et le lecteur natif actif (0:00 / 3:00). Une URL directement placée dans `<audio src="...">` n'aurait reçu aucun JWT (vérifié par ailleurs : `401` sans token).
