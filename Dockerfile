# node version
FROM node:23-alpine as build

# workdir
WORKDIR /usr/app
COPY package.json package-lock.json .
RUN NODE_ENV=production npm ci
COPY . .