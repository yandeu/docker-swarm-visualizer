FROM node:14-alpine


WORKDIR /usr/src/app


COPY package*.json ./
COPY dist ./dist

# for the health check and other requests
RUN apk add curl


RUN npm install --only=prod

# nodemon (DEV ONLY!!)
# CMD ["npm", "run", "start-dev"]
# node
CMD ["npm", "start"]
