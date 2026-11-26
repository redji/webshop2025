# Webshop 2025

Monorepo demo storefront: **Nest.js** API (Postgres / TypeORM, RabbitMQ stub) + **Next.js** App Router catalog.

## Structure

```
backend/     Nest.js API (`/health`, `/products`, seed data)
frontend/    Next.js storefront
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
| API health  | http://localhost:3001/health                    |
| Products    | http://localhost:3001/products                  |
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

Root `.env.example` covers Compose (including `SONAR_HOST_URL` / `SONAR_PORT` / `SONAR_TOKEN`). App-specific samples live in `backend/.env.example` and `frontend/.env.example`. Do not commit real secrets.

| Variable              | Role                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Browser-facing API URL (baked into the web client at image build; default `http://localhost:3001`) |
| `API_URL`             | Server-side URL for Next.js RSC fetches inside Compose (default `http://api:3001`)                 |

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
