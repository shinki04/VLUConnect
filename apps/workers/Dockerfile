FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app
RUN pnpm install -g turbo
COPY . .
RUN turbo prune @repo/worker --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First install dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

RUN pnpm turbo build --filter=@repo/worker...

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 worker
USER worker

# Copy built artifacts from the installer stage
# Since tsup bundles everything into dist (except externals), we need node_modules for external deps
COPY --from=installer --chown=worker:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=worker:nodejs /app/apps/workers/node_modules ./apps/workers/node_modules
COPY --from=installer --chown=worker:nodejs /app/apps/workers/dist ./apps/workers/dist
COPY --from=installer --chown=worker:nodejs /app/apps/workers/package.json ./apps/workers/package.json

WORKDIR /app/apps/workers

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
