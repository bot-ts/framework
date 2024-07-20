FROM node:lts

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

# Rebuild les dépendances natives
RUN npm rebuild sqlite3 || true

CMD ["npm", "run", "start"]