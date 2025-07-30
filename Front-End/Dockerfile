FROM oven/bun:1

WORKDIR /app

# Installer curl pour les healthchecks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Exposer le port
EXPOSE 3000

# Commande par défaut (sera surchargée par docker-compose)
CMD ["bun", "run", "dev", "--hostname", "0.0.0.0"]