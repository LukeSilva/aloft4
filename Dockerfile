FROM node:8-alpine

RUN npm install -g yarn

RUN mkdir -p /usr/src/app/uploads
RUN mkdir -p /usr/src/app/config

WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN yarn

COPY controllers /usr/src/app/controllers/
COPY lib /usr/src/app/lib/
COPY models /usr/src/app/models/
COPY static /usr/src/app/static/
COPY views /usr/src/app/views
COPY app.js /usr/src/app/

COPY docker-scripts /usr/src/app/docker-scripts
RUN node docker-scripts/setup.js ./ && cat config/mailer.js
COPY config-examples/passport.js /usr/src/app/config/passport.js

CMD sleep 5 && node docker-scripts/print-mailer.js && yarn start
