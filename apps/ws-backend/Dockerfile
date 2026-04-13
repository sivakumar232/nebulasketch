# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN npm install -g pnpm@9.0.0

WORKDIR /app

# Copy dependency manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/backend-common/package.json ./packages/backend-common/
COPY packages/db/package.json ./packages/db/
COPY packages/common/package.json ./packages/common/
COPY apps/ws-backend/package.json ./apps/ws-backend/

# Install all deps
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ ./packages/
COPY apps/ws-backend/ ./apps/ws-backend/

# Build
RUN pnpm --filter ws-backend run build

EXPOSE 8080

CMD ["node", "apps/ws-backend/dist/index.js"]
