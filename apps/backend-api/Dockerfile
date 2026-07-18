FROM node:22-alpine AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend-api/package.json apps/backend-api/package.json
RUN pnpm install --frozen-lockfile --filter backend-api...

COPY apps/backend-api apps/backend-api
RUN pnpm -C apps/backend-api exec prisma generate \
  && pnpm -C apps/backend-api build

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=3000
ENV STORAGE_ROOT=/data/steeltrack-storage

RUN apk add --no-cache tini \
  && mkdir -p /data/steeltrack-storage \
  && chown -R node:node /data/steeltrack-storage

WORKDIR /workspace/apps/backend-api

COPY --from=build /workspace/node_modules /workspace/node_modules
COPY --from=build /workspace/apps/backend-api/node_modules ./node_modules
COPY --from=build /workspace/apps/backend-api/package.json ./package.json
COPY --from=build /workspace/apps/backend-api/prisma ./prisma
COPY --from=build /workspace/apps/backend-api/dist ./dist

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health/live" >/dev/null || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
