# Eraasim

Eraasim currently contains two separately deployable Next.js applications and an internal PostgreSQL database foundation.

## Repository structure

```text
app/                         Public Next.js application
apps/admin/                  Separate admin Next.js application
  app/                       Admin App Router routes
  src/auth/                  Password and validation helpers
  src/db/                    Drizzle database schema and connection
  drizzle/                   Version-controlled SQL migrations
  scripts/                   Secure Master Admin bootstrap
Dockerfile                   Public application image
compose.yaml                 Eraasim-only service topology
```

The public application remains at the repository root to preserve its existing build and deployment behavior. Administrative identity data is intentionally separate from any future subscriber/customer domain.

## Deployment allocation

- VPS project root: `/opt/projects/eraasim`
- Public: https://eraasim.signalgrowth.in — `127.0.0.1:5200` → `eraasim-web:3000`
- Admin: https://admin.eraasim.signalgrowth.in — `127.0.0.1:5201` → `eraasim-admin:3000`
- `5202-5299` — reserved and currently unallocated

These are host-side Eraasim allocations. New services must not use a reserved port without documenting the allocation. PostgreSQL has no host port mapping and is reachable only as `eraasim-postgres:5432` on `eraasim-network`.

## Required environment variables

Copy `.env.example` to a deployment-only `.env`, replace every placeholder, restrict its filesystem permissions, and never commit it.

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `AUTH_SECRET`
- `MASTER_ADMIN_EMAIL`
- `MASTER_ADMIN_NAME`
- `MASTER_ADMIN_BOOTSTRAP_PASSWORD` (temporary bootstrap only)

Generate `AUTH_SECRET` and the database password independently with a cryptographically secure random generator. Production secrets must never be committed.

## Validate and build

```sh
npm ci
npm run lint
npm run typecheck
npm run build

cd apps/admin
npm ci
npm run lint
npm run typecheck
npm run build
npm run db:check

cd ../..
docker compose config
docker compose build eraasim-web eraasim-admin
```

All commands above terminate. Do not use development servers for production.

## Database migration

The Drizzle SQL migrations in `apps/admin/drizzle/` are the production schema source of truth. Do not use destructive schema push as a deployment strategy.

### Future Blog deletion rule

Blog deletion is not implemented yet. When that module is built, ordinary deletion must be a soft delete: deleted posts must disappear from the public website, Draft Posts, and All Posts, and appear in Deleted Posts. Deleted Posts must support restoration, while permanent deletion must be restricted to the Master Admin.

After PostgreSQL is healthy and before starting or updating the admin application:

```sh
docker compose --profile tools run --rm eraasim-admin-tools npm run db:migrate
```

This finite one-off command connects over the internal Eraasim network and records applied migrations.

## Secure Master Admin bootstrap

The protected initial identity is `unveiledjourney.asim@gmail.com`. The bootstrap is idempotent and refuses to replace an existing Master Admin or silently promote an existing ordinary account.

1. Apply database migrations.
2. Temporarily supply `MASTER_ADMIN_BOOTSTRAP_PASSWORD` in the shell/environment. It must be at least 16 characters and contain uppercase, lowercase, numeric, and symbol characters.
3. Ensure `MASTER_ADMIN_EMAIL` is `unveiledjourney.asim@gmail.com` and optionally set `MASTER_ADMIN_NAME`.
4. Run the finite bootstrap command:

   ```sh
   docker compose --profile tools run --rm -e MASTER_ADMIN_BOOTSTRAP_PASSWORD eraasim-admin-tools npm run bootstrap:master-admin
   ```

5. Immediately remove/unset `MASTER_ADMIN_BOOTSTRAP_PASSWORD` from the shell and any deployment environment. Never place the real password in Compose, Git, shell history, logs, or `.env.example`.

The command hashes the password with bcrypt cost 12 and never prints or stores plaintext.

`eraasim-admin-tools` exists only in the opt-in `tools` profile for finite migration and bootstrap commands. It is not started by ordinary `docker compose up -d`, publishes no ports, and is not an application service.

## Start, verify, and stop Eraasim

After migration and bootstrap, the human operator may manage only this project from `/opt/projects/eraasim`:

```sh
docker compose up -d
docker compose ps
docker compose logs --tail=100 eraasim-admin
docker compose stop
docker compose start
docker compose down
```

Do not add `--volumes` to `docker compose down`; the named `eraasim-postgres-data` volume contains persistent data.

Authentication verification:

1. Visit `https://admin.eraasim.signalgrowth.in/login`.
2. Confirm invalid credentials produce a generic error.
3. Sign in with the bootstrapped Master Admin and confirm `/dashboard` identifies the account as Master Admin.
4. Confirm a private/incognito request to `/dashboard` redirects to `/login`.
5. Logout and confirm `/dashboard` is protected again.

Nginx, DNS, TLS, production deployment, backups, and runtime verification remain operator responsibilities.
