# ── Stage 1: Install + Build ───────────────────────────
FROM oven/bun:1.2.17 AS builder

WORKDIR /app

# Copy everything (filtered by .dockerignore at repo root)
COPY . .

# Install dependencies
RUN bun install

# Build the backoffice app
RUN cd apps/backoffice-web && bun run build

# ── Stage 2: Production image ─────────────────────────
FROM oven/bun:1.2.17-alpine AS runner

WORKDIR /app

# Copy only the Nitro server output
COPY --from=builder /app/apps/backoffice-web/.output ./.output

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["bun", ".output/server/index.mjs"]
