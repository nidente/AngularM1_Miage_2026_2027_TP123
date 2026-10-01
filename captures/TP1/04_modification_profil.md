# Capture Network — Modification du profil (`PUT /api/users/me`)

Screenshot UI : [`04_modification_profil_ui.png`](./04_modification_profil_ui.png)

## Requête

- **Méthode** : `PUT`
- **URL** : `http://localhost:4200/api/users/me` (proxifiée vers `http://localhost:3000/api/users/me`)
- **Corps JSON** : `{"name":"Demo Guitariste"}`
- **Authorization** : `Bearer <JWT masqué>` — présent

## Réponse

- **Statut** : `200 OK`
- **Corps JSON** :
  ```json
  {
    "id": "6aabdbd68858c30929e2e971",
    "name": "Demo Guitariste",
    "email": "demo@example.com",
    "createdAt": "2026-09-17T12:23:50.705Z"
  }
  ```

Le Signal `currentUser` est mis à jour directement via le `tap()` de la réponse, sans nouvel appel à `/api/users/me` (pourquoi le bouton "Rafraîchir mon profil" a été retiré).
