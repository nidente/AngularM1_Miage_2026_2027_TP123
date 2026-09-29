# CLAUDE.md — Contexte de session pour le TP Angular (Guitar Practice Cloud)

> Fichier de contexte pour reprendre le travail sur ce TP dans une nouvelle session Claude Code. À lire en entier avant de reprendre. Dernière mise à jour : 29 septembre 2026.

## 1. Qui est l'utilisateur et le cadre

**Aziz Landoulsi**, étudiant M1 MIAGE (Université Côte d'Azur), en formation initiale. Ce dossier est le package étudiant fourni pour les **TP1, TP2 et TP3 de Programmation Web** (module Angular + Node/Express/MongoDB). Travail en binôme, usage d'assistant IA autorisé mais chaque étudiant doit pouvoir expliquer et défendre le code.

Ce TP a ses propres règles, définies par l'enseignant dans plusieurs fichiers Markdown **fournis, à ne jamais réécrire ni ignorer** :

- [`AGENTS.md`](frontend-starter/AGENTS.md), [`CLAUDE.md`](frontend-starter/CLAUDE.md), [`best-practices.md`](frontend-starter/best-practices.md) → règles Angular 22 (standalone, `inject()`, Signals, Reactive Forms, `@if`/`@for`, un composant = un dossier, services/guards/interceptors dans `src/app/shared`, **ne jamais modifier `backend/`**, toujours garder `API_CONTRACT.md` synchronisé si une route change).
- [`backend/AGENTS.md`](backend/AGENTS.md), [`backend/CLAUDE.md`](backend/CLAUDE.md), [`backend/best-practices.md`](backend/best-practices.md) → règles Node/Express/Mongoose (jamais de secret dans le code, jamais de `catch` vide, jamais de mot de passe/JWT dans les logs).
- [`CONSEILS_POUR_UTIISER_ASSISTANT_AI.md`](CONSEILS_POUR_UTIISER_ASSISTANT_AI.md) → méthode de travail avec un assistant IA : analyser avant de coder, proposer un plan, attendre validation avant modification importante, expliquer/vérifier après coup, travailler par petites étapes. **C'est la méthode suivie dans toute la conversation jusqu'ici.**
- [`API_CONTRACT.md`](API_CONTRACT.md) → contrat HTTP figé des routes (ne pas casser sans mettre à jour ce fichier dans le même changement).
- [`ATLAS_SETUP.md`](ATLAS_SETUP.md) → configuration MongoDB Atlas.
- [`RAPPORT_IA_MODELE.md`](RAPPORT_IA_MODELE.md) → rapport d'usage IA à tenir à jour à chaque mission (fait pour Mission 0, Mission 1 et le checkpoint Network, au format journal de prompts).
- `SUJET_ETUDIANT_TP1.md`, `TP2.md`, `TP3.md` → énoncés des 3 séances.

## 2. État de l'environnement local

- **Backend** : `backend/.env` existe et fonctionne (`npm start` depuis `backend/`, écoute sur `:3000`). **URI MongoDB corrigée le 29/09/2026** : `MONGODB_URI` contient maintenant `/guitar-practice-cloud?` (conforme à `ATLAS_SETUP.md` étape 5). La base `guitar-practice-cloud` a été créée au redémarrage du backend (MongoDB crée une base au premier document écrit ; le compte démo `demo@example.com` / `Demo1234!` est recréé par `backend/src/server.js` au démarrage s'il n'existe pas). L'ancienne base `test` existe toujours dans Atlas, inutilisée.
- **Frontend** : `frontend-starter/`, Angular 22, `npm start` (= `ng serve --proxy-config proxy.conf.json`) écoute sur `:4200`. Nécessite **Node ≥ v24.15.0** (géré via `nvm` : `source ~/.nvm/nvm.sh && nvm use 24`).
- Les deux serveurs tournent **dans les terminaux d'Aziz**, pas lancés par Claude. `npm run build` ne touche pas au serveur en cours : **prévenir Aziz quand une modif demande de relancer `ng serve`** (ex. `index.html`, `host` d'un composant) ou un Ctrl+Shift+R.
- **Vérifier le rendu soi-même** : le MCP Playwright (`claude mcp add playwright …`, scope local) a échoué à se connecter (timeout) dans la session du 29/09. Contournement qui marche : un script Node utilisant le module Playwright du cache npx (`~/.npm/_npx/*/node_modules/playwright`) avec `executablePath: '/usr/bin/google-chrome'` (les navigateurs Playwright téléchargés ne sont pas à la bonne version). Pour une page publique, `google-chrome --headless=new --screenshot=… URL` suffit. Écrire ces scripts dans le scratchpad, pas dans le projet.

## 3. Travail déjà fait

### Mission 0 — Cartographie (sans code)
Document complet : [`MISSION_0_CARTOGRAPHIE.md`](MISSION_0_CARTOGRAPHIE.md) — composant racine, routes, enregistrement `HttpClient`, modèles/services/pages, mécanisme JWT (interceptor + guard), schéma annoté du flux de connexion, tableau routes publiques/protégées.

### Mission 1 — Inscription, connexion, profil (code)
Le starter fourni couvrait déjà l'essentiel. Manques comblés :

1. **`auth.interceptor.ts`** : un `401` reçu sur une requête *porteuse d'un token* → déconnexion (`auth.logout()`) + redirection `/login`. Pas de redirection sur un 401 de login raté (pas de token envoyé).
2. **Déconnexion** dans la nav, visible seulement si connecté (désormais dans le menu du compte, voir plus bas).
3. **Validations** : mot de passe ≥ 8, nom ≥ 2 (alignées sur le backend), messages d'erreur par champ, submit désactivé si formulaire invalide.
4. **Profil** : le bouton « Rafraîchir mon profil » a été ajouté puis **retiré** à la demande d'Aziz (redondant : `PUT /api/users/me` met déjà à jour le Signal via `tap()`).

### Checkpoint Network TP1 — fait
Les 5 scénarios (connexion réussie/refusée, lecture/modification `/api/users/me`, token invalide → `/login`) sont dans [`captures/`](captures/) à la racine (un `.md` + un `.png` chacun) et liés dans `RAPPORT_IA_MODELE.md`. Aziz a dit ne plus s'en soucier.

### Refonte visuelle du frontend (29/09/2026) — faite
Détail complet (prompt + changements par point) dans [`frontend_amelioration.md`](frontend_amelioration.md). Résumé :

- **Thème** : univers de l'ampli de guitare. Vert « tolex » grainé (`--tolex` + `--tolex-grain`, un bruit SVG en data URI), accent laiton (`--brass`), médiator en logo. Polices **Bricolage Grotesque** (titres) et **Figtree** (texte) via Google Fonts dans `index.html`. Toutes les couleurs sont des variables CSS dans `styles.css`.
- **Navbar** (`components/app/`) : barre flottante pleine avec texture tolex et liseré laiton, lien actif marqué par un point laiton, menu déroulant du compte (avatar → nom/email, Mon profil, Se déconnecter), corde de guitare qui vibre au survol, compaction au scroll. Un `effect()` recharge le profil après un F5 si token présent et `currentUser()` vide.
- **Connexion / inscription** : nouveau composant **`components/auth-layout/`** (inputs `heading`, `subtitle`, `<ng-content>`) : écran scindé avec un manche de guitare SVG interactif à gauche, le formulaire à droite. Bouton œil, spinner + `finalize()`, bordure rouge sur champ invalide.
- **Profil** : en-tête tolex avec grand avatar laiton, panneau « Ma bibliothèque » (`GET /api/tracks?page=1&limit=1` → total + dernier ajout), formulaire du nom avec confirmation. **Changement de comportement par rapport à la Mission 1** : la page ne relance plus `GET /api/users/me` (elle utilise le profil déjà chargé par la nav/la connexion) → un seul appel au rechargement.
- **Global** : footer collé en bas (app en colonne flex), états survol/clic/désactivé sur boutons et champs écrits avec `:where()` (spécificité nulle, pour ne pas écraser `.toggle-pw`, `.btn-primary`…). Locale `fr` enregistrée dans `main.ts` pour `DatePipe`. **Échelle fluide** : `:root { font-size: clamp(1rem, 0.625vw + 0.5rem, 1.25rem) }` et dimensions de mise en page en **rem** (pas en px), largeur du contenu `--content-width: 72rem`. Aziz a un grand écran (~1830px CSS) : toujours raisonner en rem et vérifier les captures aussi à cette largeur.
- **Choix d'Aziz à respecter** : barre flottante (pas pleine largeur), fond plein et pas de verre transparent ni de dégradé, avatar simple (le potard gradué a été rejeté : « on dirait une montre »). Il aime le style moderne et créatif, mais veut comprendre chaque visuel d'un coup d'œil.
- **Pas touché** : la structure de la page Backing tracks, réservée au TP2.

Rien modifié dans `backend/` (hors `.env`), `API_CONTRACT.md` inchangé. `npm run build` passe sans warning.

## 4. Ce qu'il reste à faire

- [ ] **Menu burger mobile** de la navbar (mis de côté volontairement par Aziz).
- [ ] **TP2** (`SUJET_ETUDIANT_TP2.md`) : page Backing tracks à refaire dans le même style (cards responsives, chargement, paginator, morceau en cours…). **Bug repéré** : la taille des pistes s'affiche « 6405141 Ko » alors que la valeur est en octets.
- [ ] **TP3** pas commencé.
- [ ] `RAPPORT_IA_MODELE.md` pas encore mis à jour pour la refonte visuelle (Aziz a demandé de ne mettre à jour que ce fichier pour l'instant).
- [x] **Commit du 29/09/2026** : Missions 0-1, checkpoint Network et refonte visuelle, en un seul commit sur `main`, pas encore poussé. Laissés hors git volontairement : `.vscode/` (réglages vides) et `demo_navigation.mp4` (non référencé). **Ne committer / pousser que quand Aziz le demande.**

## 5. Comment continuer

- Suivre la méthode déjà en place : discuter et proposer avant de coder, demander confirmation avant un changement large, vérifier avec `npm run build` après chaque modif frontend, et **vérifier le rendu en capture** plutôt que supposer.
- Ne jamais modifier `backend/`, ne jamais casser `API_CONTRACT.md` sans le mettre à jour dans le même changement.
- Formatage : pas de config Prettier dans le projet ; si on formate, utiliser `--single-quote --print-width 100` (style du code existant).
- Mettre à jour `RAPPORT_IA_MODELE.md` (format journal de prompts) à chaque mission terminée, quand Aziz le demande.
- Répondre en français, direct et concis (préférence confirmée d'Aziz tout au long de la conversation).
