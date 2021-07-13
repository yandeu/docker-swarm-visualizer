FROM node:16.3-alpine3.13

WORKDIR /usr/src/app

# for the health check and other requests
RUN apk add curl

# https://stackoverflow.com/a/43594065
ENV DOCKERVERSION=20.10.7
RUN curl -fsSLO https://download.docker.com/linux/static/stable/x86_64/docker-${DOCKERVERSION}.tgz \
    && tar xzvf docker-${DOCKERVERSION}.tgz --strip 1 -C /usr/local/bin docker/docker \
    && rm docker-${DOCKERVERSION}.tgz

COPY package*.json ./
COPY dist ./dist

RUN npm install --only=prod

CMD ["npm", "start"]
