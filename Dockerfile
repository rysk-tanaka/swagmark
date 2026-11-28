# The base image is pinned by digest, so it changes only through a Renovate PR.
# docker-publish.yml rebuilds the published image every week to pick up those updates.
FROM node:24-slim@sha256:873f586f3794f52281bd039bf02c048a0be08fde619338f9941bad1eb6b34530 AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile --prod
COPY bin/ bin/
COPY src/ src/
COPY templates/ templates/

FROM node:24-slim@sha256:873f586f3794f52281bd039bf02c048a0be08fde619338f9941bad1eb6b34530
COPY --from=build /app /app
# Relative paths, including the default ./output, resolve in the mounted directory,
# which the node user can write to while /app stays owned by root.
WORKDIR /work
USER node
ENTRYPOINT ["node", "/app/bin/cli.js"]
