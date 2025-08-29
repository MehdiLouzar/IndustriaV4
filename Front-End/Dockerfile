FROM oven/bun:1

WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
RUN bun install

# Copy source
COPY . .

# Build the Next.js app
RUN bun run build

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

EXPOSE 3000

# Use bun to run the production server
CMD ["bun", "run", "start"]