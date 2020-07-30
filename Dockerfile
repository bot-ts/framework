FROM node:12-alpine

WORKDIR /home/node/app

COPY . .

RUN npm i -y

CMD ["node", "index.js"]
