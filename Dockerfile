FROM node:24-slim AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile --prod
COPY bin/ bin/
COPY src/ src/
COPY templates/ templates/

FROM node:24-slim
WORKDIR /app
COPY --from=build /app .
ENTRYPOINT ["node", "bin/cli.js"]
