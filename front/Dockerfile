FROM node:alpine AS build
WORKDIR /src
COPY ["package.json", "package-lock.json", "./"]
RUN npm install
COPY . .
RUN npm run build
RUN npm test

FROM node:alpine AS prod
ENV NODE_ENV production
WORKDIR /app
EXPOSE 3000
COPY --from=build /src /app
RUN npm prune --production
CMD [ "npm", "start" ]
