# Capture Network — Lecture de `/api/users/me`

Screenshot UI : [`03_lecture_profil_ui.png`](./03_lecture_profil_ui.png)

## Requête

- **Méthode** : `GET`
- **URL** : `http://localhost:4200/api/users/me` (proxifiée vers `http://localhost:3000/api/users/me`)
- **Authorization** : `Bearer <JWT masqué>` — présent (ajouté automatiquement par `auth.interceptor.ts`)

## Réponse

- **Statut** : `200 OK`
- **Corps JSON** :
  ```json
  {
    "id": "6aabdbd68858c30929e2e971",
    "name": "Demo",
    "email": "demo@example.com",
    "createdAt": "2026-09-17T12:23:50.705Z"
  }
  ```

Déclenchée automatiquement à l'ouverture de `/profile` (constructor de `profile-page.ts`).
