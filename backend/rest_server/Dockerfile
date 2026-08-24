# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS deps
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3001 \
    HOST=0.0.0.0

# bcrypt native module + ffmpeg for video duration/thumbnails
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates curl \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 pixl \
  && useradd --system --uid 1001 --gid pixl pixl

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY lib ./lib
COPY controller ./controller
COPY database ./database
COPY middlewares ./middlewares
COPY routes ./routes
COPY public ./public
COPY utils ./utils
COPY app.js server.js index.js liveCommentsSocket.js ./

RUN npx prisma generate \
  && chown -R pixl:pixl /app

USER pixl
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/" || exit 1

CMD ["node", "server.js"]
