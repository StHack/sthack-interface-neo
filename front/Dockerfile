FROM node:alpine
ENV NODE_ENV production
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production
COPY . .
RUN npm test
EXPOSE 80
WORKDIR /app/src
CMD node server.js
