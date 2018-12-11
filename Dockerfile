FROM node:10.14-alpine

RUN mkdir -p /usr/src/app

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

WORKDIR /usr/src/app

COPY package.json /usr/src/app

RUN npm install \
 && npm cache clean --force

COPY . /usr/src/app

CMD [ "npm", "start" ]
