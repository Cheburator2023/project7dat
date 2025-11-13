FROM docker.repo-ci.sfera.inno.local/sumd-docker-lib/ubi8-python39-npm:1.2 as build-deps

ARG NPM_REGISTRY
ARG NPM_EMAIL
ARG NPM_AUTH

WORKDIR /app
COPY . /app/
RUN rm package-lock.json

RUN npm config set email ${EMAIL} && \
    npm config set //${NPM_REGISTRY}:_auth ${NPM_AUTH} && \
    npm config set audit false && \
    npm i --force --only-production --registry=https://${NPM_REGISTRY}

RUN rm ~/.npmrc && \
    rm -rf /app/apps