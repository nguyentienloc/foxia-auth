FROM node:20-alpine AS base
ENV NODE_ENV=production
RUN apk update
RUN apk add --no-cache git openssh

FROM base AS builder
WORKDIR /app
RUN yarn global add @nestjs/cli
COPY package.json package.json
COPY yarn.lock yarn.lock
COPY bin bin
COPY .solidarity .solidarity
RUN yarn install
COPY . .
RUN yarn build identity-service

FROM base AS production
WORKDIR /app
COPY package.json package.json
COPY yarn.lock yarn.lock
COPY bin bin
COPY .solidarity .solidarity
RUN yarn install --production=true && yarn cache clean
COPY . .
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/apps/identity-service/src/main"]
