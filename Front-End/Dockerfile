FROM oven/bun:1

WORKDIR /app

# Copier package.json seulement
COPY package.json bun.lockb* ./

# Les dépendances seront installées par la commande dans docker-compose
# RUN bun install est fait dans le docker-compose command

EXPOSE 3000