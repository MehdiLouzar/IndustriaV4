FROM node:18-alpine

RUN apk add --no-cache openssl

WORKDIR /Back-End

# Copier package.json seulement
COPY package*.json ./

# Les dépendances seront installées par la commande dans docker-compose
# RUN npm install est fait dans le docker-compose command

# Le reste sera monté via volumes
EXPOSE 3001