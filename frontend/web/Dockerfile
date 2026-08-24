# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public runtimeConfig is overridable at runtime via NUXT_PUBLIC_API_BASE,
# but bake a sensible default for the client bundle.
ARG API_BASE=http://localhost/api
ARG LIVE_WS_BASE=ws://localhost:9090
ENV API_BASE=$API_BASE \
    LIVE_WS_BASE=$LIVE_WS_BASE \
    NODE_ENV=production

RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    NITRO_HOST=0.0.0.0 \
    PORT=3000 \
    NITRO_PORT=3000

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 pixl \
  && useradd --system --uid 1001 --gid pixl pixl

COPY --from=builder --chown=pixl:pixl /app/.output ./.output
COPY --from=builder --chown=pixl:pixl /app/package.json ./package.json

USER pixl
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/" || exit 1

CMD ["node", ".output/server/index.mjs"]
