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

| Service     | URL                                            |
| ----------- | ---------------------------------------------- |
| Storefront  | http://localhost:3000                          |
| API health  | http://localhost:3001/health                   |
| Products    | http://localhost:3001/products                 |
| RabbitMQ UI | http://localhost:15672 (`webshop` / `webshop`) |

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

| Command         | Description                     |
| --------------- | ------------------------------- |
| `npm run lint`  | ESLint + Prettier check         |
| `npm test`      | Backend + frontend unit tests   |
| `npm run build` | Production builds for both apps |

## Environment

Root `.env.example` covers Compose. App-specific samples live in `backend/.env.example` and `frontend/.env.example`. Do not commit real secrets.

## GitLab CI

Pipeline stages: lint → test → Sonar → Docker build/push → manual staging deploy.

Set these CI/CD variables when mirroring to GitLab:

| Variable              | Purpose                                 |
| --------------------- | --------------------------------------- |
| `SONAR_HOST_URL`      | SonarQube / SonarCloud URL              |
| `SONAR_TOKEN`         | Analysis token (masked)                 |
| `NEXT_PUBLIC_API_URL` | Public API URL baked into the web image |
| `DEPLOY_HOST`         | Staging SSH host                        |
| `DEPLOY_USER`         | Staging SSH user                        |
| `DEPLOY_SSH_KEY`      | Private key (masked + protected)        |
| `STAGING_URL`         | Optional environment URL                |

Built-in `CI_REGISTRY_*` is used when the GitLab Container Registry is enabled. Sonar and staging deploy skip cleanly when their variables are unset.

## License

MIT — see [LICENSE](./LICENSE).
