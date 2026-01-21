# Base Image
ARG BASE_IMG="docker.repo-ci.sfera.inno.local/sumd-docker-lib/ubi8-base-data-lineage-ui:v1.0.3"
FROM ${BASE_IMG} as build-deps
# build react-client
## WORKDIR /app
COPY . ./
RUN npm run build:nest

EXPOSE 3000

# ENV NODE_ENV=production

CMD ["npm","run","start:server"]