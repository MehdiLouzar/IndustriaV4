FROM oven/bun:1

WORKDIR /app

# Étape 1 : copier les fichiers de dépendances
COPY package.json bun.lockb* ./

# Étape 2 : installer les dépendances AVANT de copier le reste (cache layer)
RUN bun install

# Étape 3 : copier tout le code (sauf node_modules si ignoré dans .dockerignore)
COPY . .

# Pas de CMD ici : tout est géré par docker-compose (entrypoint)

EXPOSE 3000
