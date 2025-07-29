FROM oven/bun:1 as deps
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

FROM deps as build
COPY . .
RUN bun run build

FROM oven/bun:1 as runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app .
EXPOSE 3000
CMD ["bun","run","start"]
