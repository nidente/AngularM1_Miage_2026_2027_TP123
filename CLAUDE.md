# CLAUDE.md — Contexte de session pour le TP Angular (Guitar Practice Cloud)

> Fichier de contexte pour reprendre le travail sur ce TP dans une nouvelle session Claude Code. À lire en entier avant de reprendre. Dernière mise à jour : 29 septembre 2026.

## 1. Qui est l'utilisateur et le cadre

**Aziz Landoulsi**, étudiant M1 MIAGE (Université Côte d'Azur), en formation initiale. Ce dossier est le package étudiant fourni pour les **TP1, TP2 et TP3 de Programmation Web** (module Angular + Node/Express/MongoDB). Travail en binôme, usage d'assistant IA autorisé mais chaque étudiant doit pouvoir expliquer et défendre le code.

Ce TP a ses propres règles, définies par l'enseignant dans plusieurs fichiers Markdown **fournis, à ne jamais réécrire ni ignorer** :

- [`AGENTS.md`](frontend-starter/AGENTS.md), [`CLAUDE.md`](frontend-starter/CLAUDE.md), [`best-practices.md`](frontend-starter/best-practices.md) → règles Angular 22 (standalone, `inject()`, Signals, Reactive Forms, `@if`/`@for`, un composant = un dossier, services/guards/interceptors dans `src/app/shared`, **ne jamais modifier `backend/`**, toujours garder `API_CONTRACT.md` synchronisé si une route change).
- [`backend/AGENTS.md`](backend/AGENTS.md), [`backend/CLAUDE.md`](backend/CLAUDE.md), [`backend/best-practices.md`](backend/best-practices.md) → règles Node/Express/Mongoose (jamais de secret dans le code, jamais de `catch` vide, jamais de mot de passe/JWT dans les logs).
- [`CONSEILS_POUR_UTIISER_ASSISTANT_AI.md`](CONSEILS_POUR_UTIISER_ASSISTANT_AI.md) → méthode de travail avec un assistant IA : analyser avant de coder, proposer un plan, attendre validation avant modification importante, expliquer/vérifier après coup, travailler par petites étapes. **C'est la méthode suivie dans toute la conversation jusqu'ici**, avec une variante demandée par Aziz pour les missions longues : les découper en points numérotés (numérotation **inventée par Claude**, absente du sujet officiel) et avancer un point à la fois.
- [`API_CONTRACT.md`](API_CONTRACT.md) → contrat HTTP figé des routes (ne pas casser sans mettre à jour ce fichier dans le même changement). La route bonus `DELETE /api/tracks/:id` y figurait déjà avant qu'on l'utilise côté frontend.
- [`ATLAS_SETUP.md`](ATLAS_SETUP.md) → configuration MongoDB Atlas.
- [`RAPPORT_IA_MODELE.md`](RAPPORT_IA_MODELE.md) → rapport d'usage IA tenu à jour à chaque mission, au format journal de prompts. **À jour pour TP1 (Mission 0, Mission 1, checkpoint Network) et TP2 en entier** (prérequis, Mission 2, Mission 3 en 7 points, améliorations facultatives, checkpoint Network).
- `SUJET_ETUDIANT_TP1.md`, `TP2.md`, `TP3.md` → énoncés des 3 séances.

## 2. État de l'environnement local

- **Backend** : `backend/.env` fonctionne (`npm start` depuis `backend/`, écoute sur `:3000`). `MONGODB_URI` contient `/guitar-practice-cloud?` (conforme à `ATLAS_SETUP.md`). Le compte démo `demo@example.com` / `Demo1234!` est recréé par `backend/src/server.js` au démarrage s'il n'existe pas. L'ancienne base `test` existe toujours dans Atlas, inutilisée.
- **Frontend** : `frontend-starter/`, Angular 22, `npm start` (= `ng serve --proxy-config proxy.conf.json`) écoute sur `:4200`. Nécessite **Node ≥ v24.15.0** (`source ~/.nvm/nvm.sh && nvm use 24`). **Angular Material 22.1.8 + CDK installés** (thème `azure-blue` recoloré aux couleurs du site via ses variables CSS dans `styles.css`), utilisés pour le paginator de la bibliothèque.
- Les deux serveurs tournent **dans les terminaux d'Aziz**, pas lancés par Claude. `npm run build` ne touche pas au serveur en cours : **prévenir Aziz quand une modif demande de relancer `ng serve`** (`angular.json`, `index.html`, `host` d'un composant) ou un Ctrl+Shift+R.
- **Vérifier le rendu soi-même** : le MCP Playwright ne se connecte pas dans ces sessions (timeout). Contournement qui marche : un script Node utilisant le module Playwright du cache npx (`~/.npm/_npx/*/node_modules/playwright`) avec `executablePath: '/usr/bin/google-chrome'`. Écrire ces scripts dans le scratchpad, jamais dans le projet.
- **Données de démonstration** : le compte démo contient **7 pistes de test** (Blues en la, Rock en mi, Funk en ré, Jazz en sol, Reggae en do, Ballade en fa, + `song2.mp3` sans titre custom), uploadées par Claude avec `curl` pour tester la pagination (Mission 2). **Un compte de test supplémentaire** `intrus.checkpoint@example.com` a été créé pour vérifier l'isolation par propriétaire (checkpoint Network) ; il n'y a pas de route pour le supprimer, il reste dans Atlas sans conséquence. **Incident du 29/09** : un script de test Claude a supprimé par erreur les 7 pistes de démo (bug du script, pas de l'appli) ; elles ont été réapprovisionnées à l'identique.

## 3. Travail déjà fait

### TP1 — fait en entier
Mission 0 (cartographie, [`MISSION_0_CARTOGRAPHIE.md`](MISSION_0_CARTOGRAPHIE.md)), Mission 1 (inscription/connexion/profil), checkpoint Network ([`captures/TP1/`](captures/TP1/)), puis toute la **refonte visuelle** du 29/09/2026 (détail dans [`frontend_amelioration.md`](frontend_amelioration.md)) : thème « ampli de guitare » (vert tolex grainé `--tolex`/`--tolex-grain`, accent laiton `--brass`, polices Bricolage Grotesque/Figtree), navbar flottante avec menu du compte, pages connexion/inscription en écran scindé (`components/auth-layout/`), profil avec résumé de bibliothèque, footer, échelle fluide en `rem` pour grand écran. Rien modifié dans `backend/` (hors `.env`).

**Choix d'Aziz à respecter sur le design** : barre flottante (pas pleine largeur), fond plein sans verre transparent ni dégradé, avatar simple (le potard gradué a été rejeté : « on dirait une montre »). Il aime le style moderne et créatif, mais veut comprendre chaque visuel d'un coup d'œil — vérifier le rendu en capture avant de considérer une modif terminée.

### TP2 — fait en entier (29/09/2026)

- **Prérequis** : vérifiés avec `curl` (backend, proxy, compte démo, contrat, fichiers `fichiers-audio-de-test/`).
- **Mission 2 — pagination avec Angular Material** : `TrackService.list(page, limit)`, signals `limit`/`total`/`error` ajoutés, `<mat-paginator>` (5/10/20 par page), conversion page Material (0-based) ↔ page API (1-based) dans `onPage()`, requête précédente annulée à chaque changement de page, libellés en français (`shared/i18n/french-paginator-intl.ts`).
- **Mission 3 — upload, cards, lecture**, découpée en 7 points par Claude (numérotation absente du sujet) :
  1. Analyse des flux upload/lecture + rôle de l'intercepteur JWT (pourquoi `<audio src="...">` ne peut pas porter le JWT).
  2. Contrôles du backend vérifiés avec `curl` (champ `audio` obligatoire, formats, 25 Mo).
  3. Validation frontend (`shared/validators/audio-file.validator.ts`, mêmes règles que le backend).
  4. États d'envoi (chargement, anti double-soumission, erreurs traduites, succès, remise à zéro).
  5. Cards (`components/track-card/`), pipes `fileSize`/`audioFormat` (corrigent l'affichage des tailles, qui montrait des « Ko » sur des octets).
  6. Lecture : morceau en cours, spinner par piste, erreur traduite **par code HTTP** (piège Angular : `responseType: 'blob'` rend `error.error` illisible, même en JSON), révocation de l'`ObjectURL` dans `DestroyRef.onDestroy()`.
  7. Réponses écrites aux 5 questions mémoire/buffering/streaming (dans `RAPPORT_IA_MODELE.md`).
- **Améliorations facultatives** : suppression avec confirmation (`DELETE /api/tracks/:id`, bonus déjà au contrat) avec retour automatique d'une page si la dernière piste d'une page est supprimée ; **play/pause** sur le bouton de la card (bascule sans nouvelle requête, synchronisé avec les contrôles natifs) ; **filtre par titre limité à la page affichée** (le backend n'a pas de paramètre de recherche — décision d'Aziz de ne pas toucher au backend pour ça, voir point 4).
- **Checkpoint Network** : les 5 vérifications du sujet faites, dont l'isolation par propriétaire testée avec un second compte (200 pour le propriétaire, 404 pour un autre utilisateur, 401 sans token). **Captures dans [`captures/TP2/`](captures/TP2/)** (pagination, upload, lecture authentifiée), sur le modèle du TP1.
- **Livrables du sujet vérifiés un par un** (code, cards, 2 captures Network, explication écrite `Blob`/`ObjectURL`, réponses mémoire/buffering) : les deux captures et l'explication écrite manquaient initialement (restées seulement dans le chat) — comblé, tout est maintenant dans `RAPPORT_IA_MODELE.md` et `captures/TP2/`.
- **Bug réel trouvé pendant cette vérification et corrigé** : le bouton « Envoyer » de l'upload ne fonctionnait plus depuis la refonte des cards (point 5) — `<form (ngSubmit)="upload()">` sans `[formGroup]` ni `FormsModule` ne déclenche jamais `(ngSubmit)`, donc le clic faisait une vraie soumission HTML native (rechargement de page). Remis en `<div>` + bouton `type="button" (click)="upload()"`, comme à l'origine du starter. **Leçon retenue** : retester les interactions clé après une refonte visuelle du template, pas seulement le rendu visuel.
- **Détail petit fix** : le nombre de pistes/page du paginator Material était collé à gauche dans son cadre ; centré via une règle ciblée dans `styles.css`.

Rien modifié dans `backend/`, `API_CONTRACT.md` inchangé. `npm run build` passe sans warning à chaque étape.

## 4. Ce qu'il reste à faire

- [ ] **Menu burger mobile** de la navbar (mis de côté volontairement par Aziz, TP1).
- [ ] **TP3** (`SUJET_ETUDIANT_TP3.md`) pas commencé.
- [ ] **Commit et push du TP2** : tout le travail du TP2 (Mission 2, Mission 3, améliorations, fix paginator) n'est **pas encore commité**. Le dernier commit (`c774c9f`) ne couvre que le TP1. **Ne committer / pousser que quand Aziz le demande.**
- [ ] Décider si `intrus.checkpoint@example.com` (compte de test du checkpoint Network) doit être supprimé depuis Atlas — aucune urgence.

## 5. Comment continuer

- Suivre la méthode déjà en place : discuter et proposer avant de coder, demander confirmation avant un changement large, découper une mission longue en points numérotés si Aziz le demande, vérifier avec `npm run build` après chaque modif frontend, et **vérifier le rendu en capture** plutôt que supposer.
- Ne jamais modifier `backend/`, ne jamais casser `API_CONTRACT.md` sans le mettre à jour dans le même changement. Pour toute amélioration facultative qui semblerait nécessiter une modif backend (ex. recherche serveur), **demander à Aziz** plutôt que trancher seul : c'est une règle explicite du projet.
- Formatage : pas de config Prettier dans le projet ; si on formate, utiliser `--single-quote --print-width 100` (style du code existant).
- Mettre à jour `RAPPORT_IA_MODELE.md` (format journal de prompts, un seul prompt reconstruit par étape) à la fin de chaque mission/étape, quand Aziz le demande — pas de mise à jour automatique en cours de route.
- Répondre en français, direct et concis (préférence confirmée d'Aziz tout au long de la conversation).
- **Prudence avec les scripts de test qui suppriment des données** (cf. incident du 29/09) : préférer un test isolé (un seul élément) avant une boucle, et vérifier la condition d'arrêt.
