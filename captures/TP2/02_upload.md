# Capture Network — Upload d'une piste (Mission 3)

Screenshot UI : [`02_upload_ui.png`](./02_upload_ui.png)

## Requête

- **Méthode** : `POST`
- **URL** : `http://localhost:4200/api/tracks` (proxifiée vers `http://localhost:3000/api/tracks`)
- **Authorization** : `Bearer <JWT masqué>`
- **Corps** : `multipart/form-data`, construit par `TrackService.upload()` avec exactement deux champs :
  - `audio` : le fichier `song1.mp3`
  - `title` : `Capture Network TP2`

## Réponse

- **Statut** : `201 Created`
- **Corps JSON (masqué)** :
  ```json
  {
    "id": "<id masqué>",
    "title": "Capture Network TP2",
    "originalName": "song1.mp3",
    "mimeType": "audio/mpeg",
    "size": 3605337,
    "createdAt": "2026-09-29T..."
  }
  ```

## Constat

La capture montre le message de succès (« « Capture Network TP2 » a été ajoutée à votre bibliothèque. ») et la nouvelle piste en tête de la page 1, juste après l'envoi. Le backend a validé le champ `audio` (multer `upload.single("audio")`) et le format (`audio/mpeg` dans la liste blanche), sans qu'aucune modification du contrat n'ait été nécessaire. Piste supprimée juste après la capture pour ne pas polluer la bibliothèque de démonstration.
