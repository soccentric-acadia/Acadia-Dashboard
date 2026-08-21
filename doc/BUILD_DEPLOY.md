# Acadia-Dashboard Build and Deployment

## Scope

Acadia-Dashboard is the Next.js operator web UI in `webui/`. The root Makefile wraps npm
installation, development, production build, Vitest, ESLint, and Docker image/container
operations.

## 1. Prerequisites

- Node.js/npm compatible with the `webui/package.json` toolchain: Next.js 16.2.6, React 19.2.4,
TypeScript 5, and Vitest 2.
- Docker for container targets.
- Access to the API/auth services used by the UI for meaningful end-to-end verification. No
cloud credentials are supplied by the Makefile.

## 2. Setup

```sh
make install
make help
```

`make install` runs `npm install` in `webui/`. The package is private and does not publish an
npm package.

## 3. Build and compile

```sh
make dev
make build
```

`make dev` starts Next.js with hot reload. `make build` runs `npm run build` and emits the
production bundle in `webui/.next/`. The Makefile does not provide a root `start` target; to
serve the built bundle directly, use `cd webui && npm run start` after `make build`.

## 4. Test and lint

```sh
make test
make lint
cd webui && npm run type-check
```

`make test` runs `vitest run`; `make lint` runs the package ESLint script. Type checking exists
in `package.json` as `npm run type-check` but is not wrapped by the root Makefile, so the direct
command is conditional on the installed npm dependencies.

## 5. Packaging and artifacts

```sh
make docker-build IMAGE=acadia-dashboard TAG=latest
```

The local artifact is `webui/.next/`. `docker-build` delegates to `docker/Makefile` and builds
the image named by `IMAGE` and `TAG`; it is conditional on Docker and the Dockerfile context. No
npm publish or standalone archive target exists.

## 6. Deployment, install, and run

```sh
make docker-run IMAGE=acadia-dashboard TAG=latest PORT=3010
make docker-logs IMAGE=acadia-dashboard
make docker-shell IMAGE=acadia-dashboard
make docker-stop IMAGE=acadia-dashboard
```

The container is run detached and exposed on port `3010` by default; override `PORT` when
needed. `docker-shell` requires a running container. Backend URL, authentication, TLS, reverse
proxy, and cloud deployment are external configuration concerns and are not provisioned by this
repository.

For local development, run `make dev` and use the port printed by Next.js. Use the same origin
expected by the API/auth configuration during manual login testing.

## 7. Cleanup

```sh
make clean
make docker-clean IMAGE=acadia-dashboard TAG=latest
```

`clean` removes `webui/.next`; `docker-clean` delegates to the Docker Makefile to remove the
image. `node_modules` is preserved by `make clean`; remove it manually only when reinstalling
dependencies from scratch.

## 8. Hardware, cloud, and manual verification caveats

The UI has no direct hardware build step. Automated unit tests do not prove API compatibility,
OIDC redirects, SSE/live-run behavior, browser layout, production headers, or deployment
networking. Manually verify the dashboard against a running Acadia-HQ/API environment, including
login, device/run views, live logs, settings, and the configured production base URL.
Credentials and cloud deployment configuration must come from the deployment environment.
