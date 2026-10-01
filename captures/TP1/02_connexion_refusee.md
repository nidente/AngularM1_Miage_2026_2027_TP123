# Capture Network — Connexion refusée

Screenshot UI : [`02_connexion_refusee_ui.png`](./02_connexion_refusee_ui.png)

## Requête

- **Méthode** : `POST`
- **URL** : `http://localhost:4200/api/auth/login` (proxifiée vers `http://localhost:3000/api/auth/login`)
- **Corps JSON** : `{"email":"demo@example.com","password":"***"}` *(mauvais mot de passe volontaire, valeur masquée)*
- **Authorization** : absent

## Réponse

- **Statut** : `401 Unauthorized`
- **Corps JSON** : `{"message":"Identifiants incorrects"}`

Le formulaire reste sur `/login` et affiche le message d'erreur ; aucun token n'est stocké, `currentUser` reste vide.
