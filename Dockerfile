# Stage 1: Build frontend
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production image
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built frontend and server code
COPY --from=build /app/dist ./dist
COPY server/ ./server/

# Ensure cache directory exists and is writable by non-root user
RUN mkdir -p /app/server/.runtime-cache && chown -R 1000:1000 /app

ENV SERVE_STATIC=true
EXPOSE 8787

USER 1000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD node -e "fetch('http://127.0.0.1:8787/api/btc/rates').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/index.js"]
