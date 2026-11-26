# Webshop 2025

Monorepo demo storefront: **Nest.js** API (Postgres / TypeORM, RabbitMQ stub) + **Next.js** App Router catalog with **OAuth 2.0** social sign-in (Google, Microsoft, Facebook).

## Structure

```
backend/     Nest.js API (`/health`, `/products`, `/auth/*`, seed data)
frontend/    Next.js storefront (Catalog + Account)
docker-compose.yml
.gitlab-ci.yml
sonar-project.properties
```

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

| Service     | URL                                             |
| ----------- | ----------------------------------------------- |
| Storefront  | http://localhost:3000                           |
| Account     | http://localhost:3000/account                   |
| API health  | http://localhost:3001/health                    |
| Products    | http://localhost:3001/products                  |
| Auth me     | http://localhost:3001/auth/me                   |
| RabbitMQ UI | http://localhost:15672 (`webshop` / `webshop`)  |
| SonarQube   | http://localhost:9000 (Compose profile `sonar`) |

## Local development

```bash
docker compose up -d postgres rabbitmq
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
npm install
npm run dev:api   # http://localhost:3001
npm run dev:web   # http://localhost:3000
```

### Scripts

| Command              | Description                                      |
| -------------------- | ------------------------------------------------ |
| `npm run lint`       | ESLint + Prettier check                          |
| `npm test`           | Backend + frontend unit tests                    |
| `npm run build`      | Production builds for both apps                  |
| `npm run sonar:up`   | Start local SonarQube Community (Docker profile) |
| `npm run sonar:scan` | Run sonar-scanner-cli against local Sonar        |
| `npm run sonar`      | Start SonarQube + run scanner                    |

## OAuth 2.0 social sign-in

The Account tab signs users in with Google, Microsoft (Azure AD / identity platform), or Facebook via Nest Passport. Users and sessions persist in Postgres (TypeORM). The API sets an HTTP-only `webshop_session` cookie after the provider callback and redirects to `/account`.

### Redirect URIs to register

Use these exact callback URLs in each provider console (local Docker / `npm run dev`):

| Provider  | Redirect / callback URI                         |
| --------- | ----------------------------------------------- |
| Google    | `http://localhost:3001/auth/google/callback`    |
| Microsoft | `http://localhost:3001/auth/microsoft/callback` |
| Facebook  | `http://localhost:3001/auth/facebook/callback`  |

### Console setup (what to create)

1. **Google** — [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)  
   Create an **OAuth 2.0 Client ID** (Web application). Add the redirect URI above. Copy Client ID + Client secret into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

2. **Microsoft** — [Azure Portal → App registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)  
   Register a new app. Platform: **Web**. Redirect URI: the Microsoft callback above. Create a **client secret**. Add Microsoft Graph delegated permission `User.Read`. Set `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, and optionally `MICROSOFT_TENANT` (`common` for multi-tenant / personal accounts).

3. **Facebook** — [Meta for Developers](https://developers.facebook.com/apps)  
   Create an app with **Facebook Login**. Add the Facebook callback as a Valid OAuth Redirect URI. Copy App ID + App Secret into `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET`. Request the `email` permission.

Placeholders like `your-google-client-id` are treated as **not configured**; those provider buttons stay disabled until real values are set.

### Auth API routes

| Method | Path                       | Purpose                                       |
| ------ | -------------------------- | --------------------------------------------- |
| GET    | `/auth/providers`          | Providers with real credentials configured    |
| GET    | `/auth/google`             | Start Google OAuth                            |
| GET    | `/auth/google/callback`    | Google callback → set cookie → `/account`     |
| GET    | `/auth/microsoft`          | Start Microsoft OAuth                         |
| GET    | `/auth/microsoft/callback` | Microsoft callback                            |
| GET    | `/auth/facebook`           | Start Facebook OAuth                          |
| GET    | `/auth/facebook/callback`  | Facebook callback                             |
| GET    | `/auth/me`                 | Current user (`{ user }` or `{ user: null }`) |
| POST   | `/auth/logout`             | Revoke session + clear cookie                 |

CORS is locked to `FRONTEND_URL` with `credentials: true` so the storefront can call `/auth/me` with cookies.

## SonarQube (local)

Local analysis uses **SonarQube Community Build** via Docker (`sonarqube:community`). It is under Compose profile `sonar` so the app stack stays light by default.

**Storage:** embedded **H2** (image default) for local/dev trial only — no dedicated Postgres. Data persists in the `sonarqube_data` named volume. Use an external DB for anything beyond a trial.

```bash
cp .env.example .env
npm run sonar:up
# Wait until http://localhost:9000 is up (first boot can take a minute+)
# First login: admin / admin — change the password when prompted
# My Account → Security → Generate Tokens → paste into SONAR_TOKEN in .env
npm test          # optional: produce lcov for coverage import
npm run sonar:scan
```

Equivalent Compose commands:

```bash
docker compose --profile sonar up -d sonarqube
docker compose --profile sonar run --rm sonar-scanner
```

Project config: `sonar-project.properties` (`projectKey=webshop2025`, sources under `backend/src` + `frontend`, exclusions for `node_modules` / `dist` / `.next` / `coverage`).

Do **not** commit `SONAR_TOKEN` or other secrets. `.env` is gitignored.

## Environment

Root `.env.example` covers Compose (including OAuth + `SONAR_*`). App-specific samples live in `backend/.env.example` and `frontend/.env.example`. Do not commit real secrets.

| Variable              | Role                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Browser-facing API URL (baked into the web client at image build; default `http://localhost:3001`) |
| `API_URL`             | Server-side URL for Next.js RSC fetches inside Compose (default `http://api:3001`)                 |
| `FRONTEND_URL`        | Storefront origin for CORS and OAuth redirect (default `http://localhost:3000`)                    |
| `GOOGLE_*`            | Google OAuth client ID/secret/callback                                                             |
| `MICROSOFT_*`         | Microsoft identity platform client ID/secret/tenant/callback                                       |
| `FACEBOOK_*`          | Facebook Login app ID/secret/callback                                                              |
| `COOKIE_SECURE`       | Set `true` behind HTTPS                                                                            |
| `COOKIE_SAME_SITE`    | Default `lax` (works for localhost:3000 → :3001)                                                   |

## GitLab CI

Pipeline stages: lint → test → Sonar → Docker build/push → manual staging deploy.

Set these CI/CD variables when mirroring to GitLab:

| Variable              | Purpose                                                     |
| --------------------- | ----------------------------------------------------------- |
| `SONAR_HOST_URL`      | SonarQube URL (local Docker: `http://localhost:9000`)       |
| `SONAR_TOKEN`         | Analysis token (masked) — same name as local `.env.example` |
| `NEXT_PUBLIC_API_URL` | Public API URL baked into the web image                     |
| `DEPLOY_HOST`         | Staging SSH host                                            |
| `DEPLOY_USER`         | Staging SSH user                                            |
| `DEPLOY_SSH_KEY`      | Private key (masked + protected)                            |
| `STAGING_URL`         | Optional environment URL                                    |

Built-in `CI_REGISTRY_*` is used when the GitLab Container Registry is enabled. Sonar and staging deploy skip cleanly when their variables are unset.

## License

MIT — see [LICENSE](./LICENSE).
