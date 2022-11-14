FROM node:19-alpine AS base
WORKDIR /server
COPY package.json yarn.lock tsconfig.json ./
COPY typings/ ./typings
COPY ./src ./src
COPY tests ./tests

FROM node:19-alpine AS test
WORKDIR /server
COPY --from=base /server .
RUN yarn install && yarn run test:unit

FROM node:19-alpine AS builder
COPY --from=base /server .
RUN yarn build

FROM node:19-alpine
WORKDIR /server
COPY package.json ./
RUN yarn install --only=production
COPY --from=builder /server/dist ./dist

EXPOSE 80

CMD [ "npm", "start" ]
