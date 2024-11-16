FROM oven/bun:latest

WORKDIR /app

COPY package.json .

RUN bun install

COPY . .

# Rebuild les dépendances natives
RUN bun run rebuild sqlite3 || true

CMD ["bun", "run", "start"]