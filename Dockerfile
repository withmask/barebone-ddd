FROM node:lts

WORKDIR /usr/src

COPY package*.json .

RUN npm install --production

COPY . .

RUN npm run build

ENTRYPOINT [ "node", "build/index.js" ]