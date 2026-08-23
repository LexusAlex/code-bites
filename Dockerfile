FROM node:24-alpine

ARG UID=1000
ARG GID=1000

RUN apk add --no-cache git \
    && deluser node \
    && (delgroup node || true) \
    && addgroup -g ${GID} node \
    && adduser -D -h /home/node -s /bin/sh -u ${UID} -G node node

ENV GIT_CONFIG_COUNT=1 \
    GIT_CONFIG_KEY_0=safe.directory \
    GIT_CONFIG_VALUE_0=/workspace

WORKDIR /workspace

RUN chown node:node /workspace

ENV NODE_ENV=development \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_CACHE=/home/node/.npm \
    CHOKIDAR_USEPOLLING=true

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node . .

USER node

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
