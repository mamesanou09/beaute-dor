# Image unique : build du frontend puis serveur Express qui sert l'API + le site
FROM node:22-alpine AS build
WORKDIR /app
COPY client/package*.json client/
RUN npm ci --prefix client
COPY client client
RUN npm run build --prefix client

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY server/package*.json server/
RUN npm ci --omit=dev --prefix server
COPY server server
COPY --from=build /app/client/dist client/dist
EXPOSE 4000
CMD ["sh", "-c", "node server/src/db/seed.js && node server/src/index.js"]
