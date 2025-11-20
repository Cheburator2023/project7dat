# Base Image
FROM docker.repo-ci.sfera.inno.local/sumd-docker-lib/ubi8-base-data-lineage-ui:v1.0.2 as build-deps

# build react-client
COPY . ./
RUN npm run build

EXPOSE 3000

# ENV NODE_ENV=production

CMD ["npm","run","start"]