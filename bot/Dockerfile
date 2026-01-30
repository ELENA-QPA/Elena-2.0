
FROM node:21-alpine3.18 AS builder
WORKDIR /app


RUN corepack enable && corepack prepare pnpm@latest --activate
ENV PNPM_HOME=/usr/local/bin

COPY package.json pnpm-lock.yaml ./


RUN apk add --no-cache --virtual .gyp \
        python3 \
        make \
        g++ \
    && apk add --no-cache git \
    && pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build && apk del .gyp

FROM node:21-alpine3.18 AS deploy
WORKDIR /app

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    DOCKER=true

ARG PORT
ENV PORT=$PORT
EXPOSE $PORT

COPY --from=builder /app/assets ./assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/templates ./templates
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./

RUN corepack enable && corepack prepare pnpm@latest --activate
ENV PNPM_HOME=/usr/local/bin

RUN mkdir -p /app/tmp

RUN pnpm install --production --frozen-lockfile --ignore-scripts

RUN addgroup -g 1001 -S nodejs && adduser -S -u 1001 nodejs \
    && chown -R nodejs:nodejs /app

USER nodejs

CMD ["npm", "start"]