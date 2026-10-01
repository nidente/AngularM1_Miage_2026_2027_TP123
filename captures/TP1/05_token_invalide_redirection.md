# Capture Network — Token invalide → 401 → redirection `/login`

Screenshot UI : [`05_token_invalide_redirection_ui.png`](./05_token_invalide_redirection_ui.png)

## Scénario

Le `gpc_token` stocké dans `localStorage` est remplacé manuellement par une valeur corrompue (`token.invalide.corrompu`), puis `/profile` est rechargé.

## Requête

- **Méthode** : `GET`
- **URL** : `http://localhost:4200/api/users/me`
- **Authorization** : `Bearer token.invalide.corrompu`

## Réponse

- **Statut** : `401 Unauthorized`
- **Corps JSON** : `{"message":"Jeton invalide ou expiré"}`

## Comportement observé

`auth.interceptor.ts` intercepte le 401 reçu sur une requête porteuse d'un token, appelle `auth.logout()` (le `gpc_token` est supprimé de `localStorage`, vérifié après coup) et redirige vers `/login`. C'est le comportement ajouté en Mission 1 (le starter fourni ne le faisait pas).
