
FROM node:19-alpine AS base
WORKDIR /server
RUN apk add bash openjdk11

FROM base as test
COPY . .
RUN yarn install
CMD ["yarn", "test"]

FROM base AS builder
COPY . .
RUN yarn install && yarn build

FROM base 
COPY package.json yarn.lock ./
COPY --from=builder /server/dist ./dist
RUN apk add bash openjdk11 &&\
    yarn install --only=production

EXPOSE 80

CMD [ "yarn", "start"]
