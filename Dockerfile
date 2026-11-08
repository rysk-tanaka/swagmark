# The base image is pinned by digest, so it changes only through a Renovate PR.
# docker-publish.yml rebuilds the published image every week to pick up those updates.
FROM node:24-slim@sha256:01d566e8d94d8c619591d78652babfccd3c6992a3dffa9ed5ab39e11cf6c70e9 AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile --prod
COPY bin/ bin/
COPY src/ src/
COPY templates/ templates/

FROM node:24-slim@sha256:01d566e8d94d8c619591d78652babfccd3c6992a3dffa9ed5ab39e11cf6c70e9
COPY --from=build /app /app
# Relative paths, including the default ./output, resolve in the mounted directory,
# which the node user can write to while /app stays owned by root.
WORKDIR /work
USER node
ENTRYPOINT ["node", "/app/bin/cli.js"]
