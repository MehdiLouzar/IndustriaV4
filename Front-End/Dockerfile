# ---------- Stage 1: Build ----------
FROM oven/bun:1 AS builder
WORKDIR /app

# Install deps first (cache friendly)
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy the entire source
COPY . .

# Build Next.js for production
ENV NODE_ENV=production
RUN bun run build

# ---------- Stage 2: Run ----------
FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copy only what's needed to run
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["bun", "run", "start"]
