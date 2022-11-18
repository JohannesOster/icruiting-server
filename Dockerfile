
FROM node:19-alpine AS base
WORKDIR /server
COPY . .

RUN apk add bash openjdk11 &&\
    yarn install

FROM base as test
CMD ["yarn", "test"]

FROM base AS builder
RUN yarn build

FROM node:19-alpine
WORKDIR /server
COPY package.json ./
COPY --from=builder /server/dist ./dist
RUN yarn install --only=production

EXPOSE 80

CMD [ "yarn", "db-migrate && yarn start"]
