FROM node:alpine
ENV NODE_ENV production
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
RUN bower install
COPY . .
EXPOSE 80
WORKDIR /usr/src/app/src
CMD node server.js
