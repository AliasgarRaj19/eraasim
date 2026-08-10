# Eraasim

Eraasim is a platform for stories of culture, food and places. This repository currently contains the Dockerized Next.js foundation for Milestone 1.1A.

## Local validation

```sh
npm ci
npm run lint
npm run typecheck
npm run build
docker compose config
```

The application image uses a production-only standalone Next.js server. Runtime services should be started manually by the operator.

## Deployment allocation

- Future VPS root: `/opt/projects/eraasim`
- Eraasim Reserved VPS Port Range: `5200-5299`
- `5200` = Eraasim web
- `5201-5299` = Future Eraasim services (reserved and currently unallocated)

These values are host-side project allocations. A new service must not take a port from this range unless its allocation is documented here. The current Compose mapping binds the web application to `127.0.0.1:5200` on the host and container port `3000`.
