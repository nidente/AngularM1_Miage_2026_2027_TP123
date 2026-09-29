# Rapport d'usage de l'IA - TP1

Pour chaque mission, détailler et fournir des explications concernant : objectif; prompt principal; plan proposé par l'agent; vérifications réalisées par le binôme; erreurs ou propositions rejetées; fichiers effectivement modifiés; preuve de fonctionnement; ce que chaque membre sait maintenant expliquer sans l'agent.

## Mission 0 — Cartographie

- **Assistant/mode** : Claude Code (extension IDE, VS Code).
- **Objectif** : comprendre l'architecture existante sans coder, avant toute modification.
- **Prompt principal** : « Parcours tous les fichiers du projet (dont les .md de règles), puis fais la Mission 0 : cartographier l'appli et produire un schéma annoté du flux de connexion. »
- **Résultat** : voir [MISSION_0_CARTOGRAPHIE.md](MISSION_0_CARTOGRAPHIE.md) (composant racine, routes, `HttpClient`, modèles/services/pages, mécanisme JWT, schéma du flux, routes publiques/protégées).
- **Vérification** : lecture manuelle du document produit, comparaison avec le code réellement ouvert dans VS Code.

## Mission 1 — Inscription, connexion, profil

- **Assistant/mode** : Claude Code (extension IDE, VS Code).
- **Objectif** : compléter la partie utilisateur (logout, gestion du 401, validations de formulaire) après le constat fait en Mission 0.

### Journal des prompts

1. *« Passe à la Mission 1, fais toutes les tâches demandées sans rien négliger, mets à jour RAPPORT_IA_MODELE.md avec un bon prompt, sans en écrire plus que nécessaire. »* → Claude a listé les manques (pas de logout, pas de gestion 401, validations incomplètes), proposé un plan fichier par fichier, implémenté, puis lancé `npm run build` pour vérifier.
2. *« Je ne vois pas de bouton rafraîchir mon profil. »* → Claude a vérifié que le bundle servi contenait bien le bouton, et m'a fait chercher la vraie cause : navigateur pas rafraîchi / pas connecté sur `/profile`.
3. *« Ça fait quoi rafraîchir mon profil ? »* → explication : relance `GET /api/users/me` pour resynchroniser l'affichage si la donnée a changé ailleurs (autre onglet, Thunder Client...).
4. *« Le nom change déjà seul quand je clique Enregistrer, j'en ai pas besoin. »* → j'ai compris que `PUT /api/users/me` renvoie déjà l'utilisateur à jour et que le `tap()` du service met à jour le Signal directement, donc le bouton était redondant.
5. *« Supprime. »* → Claude a retiré le bouton du template, gardé le chargement automatique dans le `constructor()`, revérifié le build.

- **Fichiers modifiés** : `auth.interceptor.ts`, `app.ts`, `app.html`, `register-page.ts`, `register-page.html`, `login-page.html`, `profile-page.ts`, `profile-page.html`.
- **Fichiers non modifiés** : rien dans `backend/`, `API_CONTRACT.md` inchangé.
- **Vérifications** : `npm run build` (succès, à chaque étape).
- **Routes utilisées** : `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/users/me`, `PUT /api/users/me`.
- **Mise à jour du profil** : front `profile-page.ts` (`save()`) → `auth.service.ts` (`update()`) → `PUT /api/users/me` ; back `app.js` (`User.findByIdAndUpdate`).
- **Ce que je sais expliquer sans l'agent** : pourquoi l'intercepteur ne doit rediriger que sur un 401 *avec* token (pas sur un mauvais mot de passe) ; pourquoi `PUT /api/users/me` suffit à mettre à jour l'affichage sans requête supplémentaire ; la différence entre `token()` (persiste au `localStorage`) et `currentUser()` (réinitialisé au rechargement, d'où le chargement auto en Mission 1).

### Checkpoint Network (livrable TP1)

Réalisé avec Claude Code + MCP Playwright (navigation, capture des requêtes et screenshots automatisés dans un vrai navigateur, compte de démonstration `demo@example.com`). Mots de passe et JWT systématiquement masqués dans les fichiers de capture, conformément à la consigne du sujet.

- [Connexion réussie](captures/01_connexion_reussie.md) — `POST /api/auth/login` → 200.
- [Connexion refusée](captures/02_connexion_refusee.md) — `POST /api/auth/login` → 401.
- [Lecture du profil](captures/03_lecture_profil.md) — `GET /api/users/me` → 200, `Authorization: Bearer …`.
- [Modification du profil](captures/04_modification_profil.md) — `PUT /api/users/me` → 200.
- [Token invalide → redirection](captures/05_token_invalide_redirection.md) — `GET /api/users/me` → 401, déconnexion automatique et retour à `/login`.

**Vérification** : chaque scénario a été rejoué manuellement dans le navigateur piloté (pas de simulation de code), les statuts HTTP et le comportement de l'UI ont été observés directement, pas seulement lus dans les logs.
