# Capture Network — Suppression confirmée (Mission 5)

Screenshot UI : [`02_suppression_ui.png`](./02_suppression_ui.png)

## Requête

- **Déclencheur** : clic sur la corbeille de la card « Capture Network TP3 », puis confirmation (`Supprimer définitivement « Capture Network TP3 » ?`). Aucune requête ne part avant la confirmation.
- **Méthode** : `DELETE`
- **URL** : `/api/tracks/<id>` (proxifiée vers `http://localhost:3000/api/tracks/<id>`)
- **Authorization** : `Bearer <JWT masqué>`

## Réponse

- **Statut** : `204 No Content` (pas de corps)
- Puis `GET /api/tracks?page=1&limit=5` → `200` : la page courante est rechargée depuis le serveur.

## Constat

La SnackBar Material affiche « « Capture Network TP3 » a été supprimée. », la card a disparu et le compteur est revenu à 7 pistes. Pendant la requête, la corbeille de la card montre un spinner et un second clic est ignoré. Côté serveur, `findOneAndDelete({ _id, ownerId: req.auth.sub })` ne supprime que si la piste appartient à l'utilisateur du JWT.
