# syntax=docker/dockerfile:1
# Contexto de build: raiz do repositório (a imagem inclui database/migrations).

# ---------- dependências ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------- build ----------
FROM deps AS build
COPY backend/ ./
RUN npm run build && npm prune --omit=dev

# ---------- runtime ----------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node backend/package.json ./
COPY --chown=node:node database/migrations ./database/migrations
# Processo sem privilégios de root
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "dist/main.js"]
