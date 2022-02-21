FROM node:17 as build
WORKDIR /app
COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json ./
RUN yarn install
COPY . ./
RUN yarn build
RUN useradd -u 10001 scratchuser

FROM node:17-alpine as lean
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/yarn.lock ./
RUN yarn install --production
COPY --from=build /app/build/ ./build/

FROM gcr.io/distroless/nodejs:16
WORKDIR /app
COPY --from=lean /app/ ./
COPY --from=build /etc/passwd /etc/passwd
USER scratchuser
CMD ["./build/app.js"]
