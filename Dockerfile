FROM node:carbon-alpine

# Install tini binary
RUN apk add --no-cache tini

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY src/package.json /usr/src/app/
RUN cd /usr/src/app/ && npm install

# Bundle app source
COPY src /usr/src/app

EXPOSE 8089

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "server.js"]
