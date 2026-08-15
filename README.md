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

Subscriber notifications use the existing Gmail SMTP configuration plus `PUBLIC_SITE_URL` and a deployment-generated `SUBSCRIBER_TOKEN_SECRET` of at least 32 characters. The scheduled publisher container runs finite publication and subscriber-delivery commands every minute; it does not expose a port. It also runs the finite activity-log retention cleanup daily at 03:17 UTC, using the Admin-configured 3, 6, or 12 calendar-month policy and deleting only expired rows from `activity_logs`. Public signup throttling is bounded and process-local, so multi-instance deployments should replace it with a shared rate limiter before scaling horizontally.

## Deployment allocation

- VPS project root: `/opt/projects/eraasim`
- Public: https://eraasim.signalgrowth.in â€” `127.0.0.1:5200` â†’ `eraasim-web:3000`
- Admin: https://admin.eraasim.signalgrowth.in â€” `127.0.0.1:5201` â†’ `eraasim-admin:3000`
- `5202-5299` â€” reserved and currently unallocated

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

### Blog publishing and media foundation

Post content is stored as validated TipTap JSON, not arbitrary HTML. Formatting is restricted to the editor's supported nodes and marks; links, Eraasim-uploaded image references, and canonical YouTube URLs are validated again on the server before storage. YouTube media remains hosted by YouTube.

Admin image uploads are written beneath `/app/storage/uploads` in the `eraasim-uploads` Docker volume and referenced from posts by generated UUID filenames. The volume is mounted only into `eraasim-admin` for this milestone, survives container replacement, and can later be shared with a dedicated public media service or migrated behind an object-storage adapter. Uploaded binaries are not stored in PostgreSQL. JPEG, PNG, WebP, and GIF are accepted up to 5 MB; original filenames are never used.

Scheduling inputs are interpreted as `Asia/Kolkata` and stored as timezone-aware UTC timestamps. Milestone 1.4A stores the scheduling state only; automatic scheduled publication requires a future worker or cron process and is not simulated by the web application.

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

Nginx, DNS, TLS, production deployment, backups, and runtime verification remain operator responsibilities. The Eraasim Admin site configuration is version-controlled at `deployment/nginx/admin.eraasim.signalgrowth.in.conf`. It proxies to `127.0.0.1:5201` and permits a 6 MB request body so multipart overhead can reach the application's authoritative 5 MB image limit.

After reviewing the tracked file on the VPS, apply only this site with:

```sh
sudo deployment/nginx/install-admin-site.sh
```

The installer backs up an existing `/etc/nginx/sites-available/admin.eraasim.signalgrowth.in`, installs the tracked replacement, runs `nginx -t`, restores the backup if validation fails, and reloads Nginx only after successful validation. It neither restarts other services nor modifies certificates. Certificate material remains owned by Certbot under `/etc/letsencrypt`; the tracked Nginx file only references the standard live certificate, options, and DH-parameter paths.
# Contact form email notifications

Contact enquiries are stored in PostgreSQL before notification is attempted. Production delivery uses Gmail SMTP through Nodemailer and requires runtime-only `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_APP_PASSWORD`, and `CONTACT_EMAIL_FROM` values on `eraasim-web`. For Gmail, enable 2-Step Verification and use a dedicated Google App Passwordâ€”not the normal account password. The Published Contact Us CMS remains the only source of the recipient. Builds do not require SMTP values. Missing/invalid configuration or SMTP rejection preserves the enquiry with **Not sent** status and writes only a sanitized error to the public-service log.

## Comment reply email notifications

Admin comment replies reuse the same Gmail SMTP variables on `eraasim-admin`. Set `PUBLIC_SITE_URL` to the trusted public origin used for `/blog/{slug}#comments` links. Replies are committed before notification is attempted; delivery failure leaves the reply intact and records **Not sent** without storing provider errors.
