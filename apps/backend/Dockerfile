# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN npm install -g pnpm@9.0.0

WORKDIR /app

# Copy dependency manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/backend-common/package.json ./packages/backend-common/
COPY packages/db/package.json ./packages/db/
COPY packages/common/package.json ./packages/common/
COPY apps/backend/package.json ./apps/backend/

# Install all deps
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ ./packages/
COPY apps/backend/ ./apps/backend/

# Build
RUN pnpm --filter backend run build

EXPOSE 3001

CMD ["node", "apps/backend/dist/index.js"]
