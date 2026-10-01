# Capture Network — Connexion réussie

Screenshot UI : [`01_connexion_reussie_ui.png`](./01_connexion_reussie_ui.png)

## Requête

- **Méthode** : `POST`
- **URL** : `http://localhost:4200/api/auth/login` (proxifiée vers `http://localhost:3000/api/auth/login`)
- **Corps JSON** : `{"email":"demo@example.com","password":"***"}` *(mot de passe masqué volontairement)*
- **Authorization** : absent (pas encore de token à ce stade)

## Réponse

- **Statut** : `200 OK`
- **Corps JSON** (masqué) :
  ```json
  {
    "token": "<JWT masqué>",
    "user": {
      "id": "6aabdbd68858c30929e2e971",
      "name": "Demo",
      "email": "demo@example.com",
      "createdAt": "2026-09-17T12:23:50.705Z"
    }
  }
  ```

Le token est ensuite stocké côté client (Signal + `localStorage`) et réutilisé dans l'en-tête `Authorization` des requêtes protégées suivantes. Redirection vers `/tracks` après connexion.
