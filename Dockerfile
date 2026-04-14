# ── Stage 1: Build frontend ─────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: Production ────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server/ ./server/
COPY --from=builder /app/dist ./dist/
COPY docker-entrypoint.mjs ./

EXPOSE 8787

CMD ["node", "docker-entrypoint.mjs"]
