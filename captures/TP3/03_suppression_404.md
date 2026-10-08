# Capture Network — Suppression d'une piste déjà supprimée (Mission 5)

Screenshot UI : [`03_suppression_404_ui.png`](./03_suppression_404_ui.png)

## Scénario

La piste « Capture Network TP3 (fantome) » est affichée dans l'onglet A. Elle est supprimée depuis un onglet B (même session). L'onglet A, qui ne le sait pas, tente ensuite de la supprimer à son tour.

## Requête (onglet A)

- **Méthode** : `DELETE`
- **URL** : `/api/tracks/<id>`
- **Authorization** : `Bearer <JWT masqué>`

## Réponse

- **Statut** : `404 Not Found`, corps `{ "message": "Piste inconnue" }`
- Puis `GET /api/tracks?page=1&limit=5` → `200` : la liste est resynchronisée.

## Constat

La SnackBar d'erreur affiche « Cette piste n'existe plus ou ne vous appartient pas. La liste a été mise à jour. ». La card fantôme a disparu (0 occurrence après rechargement) et le compteur est correct. Le backend renvoie le même 404 pour une piste qui appartient à un autre utilisateur : il ne révèle pas qu'elle existe. Le message couvre donc les deux cas. Les deux lignes rouges de la console à ce moment (la ressource en 404 signalée par Chrome et `[TracksPage] Suppression impossible`) sont l'erreur attendue de ce scénario. Aucune donnée sensible n'y figure.
