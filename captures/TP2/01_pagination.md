# Capture Network — Pagination (Mission 2)

Screenshot UI : [`01_pagination_ui.png`](./01_pagination_ui.png)

## Requêtes observées (changement de page)

- **Page 1** :
  - **Méthode** : `GET`
  - **URL** : `http://localhost:4200/api/tracks?page=1&limit=5` (proxifiée vers `http://localhost:3000/api/tracks?page=1&limit=5`)
  - **Authorization** : `Bearer <JWT masqué>`
  - **Statut** : `200 OK`
- **Clic sur « Page suivante »** :
  - **Méthode** : `GET`
  - **URL** : `http://localhost:4200/api/tracks?page=2&limit=5`
  - **Statut** : `200 OK`

## Constat

Le paramètre `page` change bien à chaque clic (`1` → `2`), et une **nouvelle requête HTTP** est envoyée à chaque fois : aucun découpage n'est fait côté Angular, toute la pagination est déléguée au serveur (`Track.find(...).skip((page-1)*limit).limit(limit)`, backend/src/app.js). La capture montre la page 2 (« 6 – 7 sur 7 »), avec 2 pistes différentes de la page 1.
