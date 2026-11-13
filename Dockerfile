# The base image is pinned by digest, so it changes only through a Renovate PR.
# docker-publish.yml rebuilds the published image every week to pick up those updates.
FROM node:24-slim@sha256:dc26ae92c9fb15cf6b1d63e20f0944b2efe0f115b20e00be48fb23fceb061c54 AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile --prod
COPY bin/ bin/
COPY src/ src/
COPY templates/ templates/

FROM node:24-slim@sha256:dc26ae92c9fb15cf6b1d63e20f0944b2efe0f115b20e00be48fb23fceb061c54
COPY --from=build /app /app
# Relative paths, including the default ./output, resolve in the mounted directory,
# which the node user can write to while /app stays owned by root.
WORKDIR /work
USER node
ENTRYPOINT ["node", "/app/bin/cli.js"]
