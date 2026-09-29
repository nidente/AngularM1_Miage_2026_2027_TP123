# Mission 0 — Cartographie de l'application (TP1)

> Analyse du projet **sans modification de code**, réalisée avant toute mission de développement. Objectif : comprendre l'architecture existante et le trajet d'une requête de connexion.

## 1. Composant racine

[`frontend-starter/src/app/components/app/app.ts`](frontend-starter/src/app/components/app/app.ts)

```ts
@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent {}
```

Bootstrap dans [`main.ts`](frontend-starter/src/main.ts) via `bootstrapApplication(AppComponent, {...})`. Le template [`app.html`](frontend-starter/src/app/components/app/app.html) contient l'en-tête, la navigation (`Backing tracks` / `Profil` / `Connexion`) et le `<router-outlet />` qui affiche la page active.

## 2. Configuration des routes

[`frontend-starter/src/app/routes.ts`](frontend-starter/src/app/routes.ts)

| Chemin | Composant | Protégé par `authGuard` |
|---|---|---|
| `''` | redirection vers `tracks` | — |
| `/login` | `LoginPageComponent` | non |
| `/register` | `RegisterPageComponent` | non |
| `/profile` | `ProfilePageComponent` | **oui** |
| `/tracks` | `TracksPageComponent` | **oui** |
| `**` | redirection vers `tracks` | — |

Routes déclarées via `provideRouter(routes)` dans `main.ts`.

## 3. Enregistrement de `HttpClient`

[`frontend-starter/src/main.ts`](frontend-starter/src/main.ts) :

```ts
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
}).catch(console.error);
```

`HttpClient` est enregistré une seule fois, globalement, avec l'intercepteur `authInterceptor` branché dessus. C'est ce qui permet à `inject(HttpClient)` de fonctionner dans n'importe quel service.

## 4. Modèles, services et pages

### Modèles (`src/app/shared/models/`)

| Fichier | Contenu |
|---|---|
| `user.model.ts` | `User { id, name, email, createdAt }` — données publiques renvoyées par l'API |
| `auth-response.model.ts` | `AuthResponse { token, user: User }` — réponse de login/register |
| `track.model.ts` | `Track { id, title, originalName, mimeType, size, createdAt }` |
| `page.model.ts` | `Page<T> { items, page, limit, total, pages }` — pagination générique |

### Services (`src/app/shared/services/`)

| Service | Rôle | Méthodes |
|---|---|---|
| `auth.service.ts` | Authentification + profil, état global via Signals | `login()`, `register()`, `profile()`, `update()`, `logout()` |
| `track.service.ts` | Bibliothèque audio | `list()`, `upload()`, `audio()` |

`AuthService` expose deux Signals clés : `currentUser` (profil affiché) et `token` (JWT, initialisé depuis `localStorage.getItem('gpc_token')`).

### Pages (`src/app/components/`)

| Composant | Route | Rôle |
|---|---|---|
| `login-page` | `/login` | Formulaire de connexion (Reactive Forms), appelle `AuthService.login()` |
| `register-page` | `/register` | Formulaire d'inscription, appelle `AuthService.register()` |
| `profile-page` | `/profile` | Affiche/modifie le profil, appelle `AuthService.profile()` / `update()` |
| `tracks-page` | `/tracks` | Liste, upload et lecture des pistes audio via `TrackService` |

Chaque composant respecte la règle du projet : **il ne dialogue jamais directement avec `HttpClient`**, il passe systématiquement par un service injecté (`inject()`).

## 5. Mécanisme d'ajout du JWT aux requêtes protégées

[`frontend-starter/src/app/shared/interceptors/auth.interceptor.ts`](frontend-starter/src/app/shared/interceptors/auth.interceptor.ts)

```ts
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthService).token();
  return next(
    token
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request,
  );
};
```

Cet intercepteur HTTP s'exécute automatiquement avant **chaque** requête sortante. S'il existe un token dans `AuthService.token()`, il clone la requête en ajoutant l'en-tête `Authorization: Bearer <token>`. Aucun service ni composant n'a besoin de le faire manuellement.

Côté serveur, ce header est vérifié par le middleware `auth()` dans [`backend/src/app.js`](backend/src/app.js#L56), qui appelle `jwt.verify()` et alimente `req.auth.sub` (l'identifiant Mongo de l'utilisateur) pour les handlers suivants.

Protection complémentaire côté client : [`auth.guard.ts`](frontend-starter/src/app/shared/guards/auth.guard.ts), utilisé sur `/profile` et `/tracks`, qui bloque la navigation si `auth.token()` est vide et redirige vers `/login`. **Attention** : ce guard vérifie seulement la *présence* locale d'un token, pas sa validité côté serveur (un token expiré passerait le guard mais serait rejeté par le backend au premier appel API).

## 6. Schéma annoté du flux — clic sur « Se connecter »

```
[Utilisateur] saisit email/password et clique "Se connecter"
      │
      ▼
login-page.html (ngSubmit) ──► login-page.ts : submit()
      │  values = form.getRawValue()
      ▼
auth.service.ts : login(email, password)
      │  http.post<AuthResponse>('/api/auth/login', { email, password })
      ▼
authInterceptor (aucun token encore ⇒ requête envoyée telle quelle)
      ▼
proxy.conf.json  (dev only) : /api/*  ──►  http://localhost:3000
      ▼
backend/src/app.js : app.post('/api/auth/login', ...)
      │  1. email = req.body.email.toLowerCase()
      │  2. User.findOne({ email }).select('+passwordHash')
      │  3. user.verifyPassword(password)   [bcrypt.compare — models/User.js]
      │  4. si échec ─► 401 { message: "Identifiants incorrects" }
      │  5. si succès ─► token(user) = jwt.sign({ sub, email }, SECRET, 2h)
      ▼
réponse HTTP 200 { token, user: user.toPublic() }
      ▼
auth.service.ts : tap(response => storeAuthentication(response))
      │  localStorage.setItem('gpc_token', token)
      │  this.token.set(token)
      │  this.currentUser.set(user)
      ▼
login-page.ts : next ─► router.navigateByUrl('/tracks')
      │
      ▼
[Navigateur] affiche /tracks (protégée par authGuard, token désormais présent)

En cas d'échec (401) :
login-page.ts : error ─► this.error.set(error.error?.message) ─► affiché dans le template
```

**Requêtes suivantes protégées** (ex. `GET /api/users/me` depuis `/profile`) : le même `authInterceptor` relit `auth.token()` et ajoute `Authorization: Bearer <token>` avant l'envoi — sans nouvelle action de l'utilisateur.

## 7. Routes publiques vs protégées (`API_CONTRACT.md`)

| Méthode | Route | Authentification | Type |
|---|---|---|---|
| GET | `/health` | aucune | publique |
| POST | `/auth/register` | aucune | publique |
| POST | `/auth/login` | aucune | publique |
| GET | `/users/me` | JWT requis | protégée |
| PUT | `/users/me` | JWT requis | protégée |
| GET | `/tracks?page=&limit=` | JWT requis | protégée |
| POST | `/tracks` | JWT requis | protégée |
| GET | `/tracks/:id/audio` | JWT requis | protégée |
| DELETE | `/tracks/:id` | JWT requis | protégée (bonus) |

Règle du contrat : *« Base `/api`. Sauf inscription et connexion, envoyer `Authorization: Bearer <token>` »* — seules `register` et `login` sont publiques, tout le reste exige le JWT.

## 8. Constat à l'issue de la cartographie

Deux points de la checklist Mission 1 ne sont pas encore couverts par le code existant :

1. **Pas de bouton de déconnexion visible** — `AuthService.logout()` existe mais n'est appelé nulle part dans les templates ; la nav (`app.html`) n'est pas conditionnée à l'état de connexion.
2. **Pas de gestion globale du 401** — un token expiré (2h) n'entraîne pas de redirection automatique vers `/login` ; seul `authGuard` vérifie la présence locale du token, pas sa validité serveur.

Ces deux points seront traités en Mission 1, après validation.
