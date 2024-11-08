FROM node:lts

WORKDIR /usr/src

COPY package.json yarn.lock ./

RUN yarn install --production

COPY . .

RUN yarn run build

ENTRYPOINT [ "node", "build/index.js" ]