# Build stage
# FROM node:20-alpine AS base
# FROM base AS deps
# RUN apk add --no-cache libc6-compat


# WORKDIR /app

# # Install pnpm
# RUN npm install -g pnpm

# # Copy package files
# COPY package.json yarn.lock* pnpm-workspace.yaml pnpm-lock.yaml* ./

# # Install dependencies
# RUN pnpm install --frozen-lockfile

# # Copy source code
# COPY . .

# # Build Next.js
# RUN pnpm build

# # Production stage
# FROM node:18-alpine

# WORKDIR /app

# # Install pnpm
# RUN npm install -g pnpm

# # Copy package files
# COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# # Install production dependencies only
# RUN pnpm install --prod --frozen-lockfile

# # Copy built app from builder
# COPY --from=builder /app/.next ./.next
# COPY --from=builder /app/public ./public
# COPY --from=builder /app/node_modules ./node_modules

# EXPOSE 3000

# CMD ["pnpm", "start"]



# syntax=docker.io/docker/dockerfile:1

# FROM node:20-alpine AS base

# # Install dependencies only when needed
# FROM base AS deps
# # Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# RUN apk add --no-cache libc6-compat
# WORKDIR /app


# # # Install pnpm
# RUN npm install -g pnpm

# # Install dependencies based on the preferred package manager
# COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
# # COPY package.json ./
# # COPY pnpm-lock.yaml ./
# # COPY pnpm-workspace.yaml ./

# RUN pnpm install --prod --frozen-lockfile



# # Rebuild the source code only when needed
# FROM base AS builder
# WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules
# COPY . .

# # Next.js collects completely anonymous telemetry data about general usage.
# # Learn more here: https://nextjs.org/telemetry
# # Uncomment the following line in case you want to disable telemetry during the build.
# # ENV NEXT_TELEMETRY_DISABLED=1

# # # Install pnpm
# RUN npm install -g pnpm

# # # Build Next.js
# RUN pnpm build

# # Production image, copy all the files and run next
# FROM base AS runner
# WORKDIR /app

# ENV NODE_ENV=production
# # Uncomment the following line in case you want to disable telemetry during runtime.
# # ENV NEXT_TELEMETRY_DISABLED=1

# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nextjs

# COPY --from=builder /app/public ./public

# # Automatically leverage output traces to reduce image size
# # https://nextjs.org/docs/advanced-features/output-file-tracing
# COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# USER nextjs

# EXPOSE 3000

# ENV PORT=3000

# # server.js is created by next build from the standalone output
# # https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
# ENV HOSTNAME="0.0.0.0"
# CMD ["node", "server.js"]







# -----# Install deps
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Build
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm

# Chỉ copy source (KHÔNG copy node_modules local)
COPY . .

# Copy node_modules từ deps (đúng Alpine env)
COPY --from=deps /app/node_modules ./node_modules

RUN pnpm build

# Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]

