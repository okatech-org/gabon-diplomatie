# ── Stage 1: Install dependencies ──────────────────────
FROM oven/bun:1.2.17 AS deps

WORKDIR /app

# Copy workspace root files
COPY package.json bun.lock turbo.json ./

# Copy all package.json files for workspace resolution
COPY apps/backoffice-web/package.json ./apps/backoffice-web/
COPY packages/api/package.json ./packages/api/
COPY packages/i18n/package.json ./packages/i18n/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
COPY packages/tsconfig/package.json ./packages/tsconfig/

# Install all dependencies
RUN bun install --frozen-lockfile

# ── Stage 2: Build ────────────────────────────────────
FROM oven/bun:1.2.17 AS builder

WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backoffice-web/node_modules ./apps/backoffice-web/node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules 2>/dev/null || true
COPY --from=deps /app/packages/i18n/node_modules ./packages/i18n/node_modules 2>/dev/null || true
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules 2>/dev/null || true
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules 2>/dev/null || true

# Copy source code
COPY . .

# Build the backoffice app
RUN cd apps/backoffice-web && bun run build

# ── Stage 3: Production image ─────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Copy the Nitro output
COPY --from=builder /app/apps/backoffice-web/.output ./.output

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", ".output/server/index.mjs"]
