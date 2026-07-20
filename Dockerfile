FROM node:22-slim AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS build
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json prisma.config.ts tsoa.json ./
COPY prisma ./prisma
COPY src ./src
RUN npm run build

FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

FROM base AS runtime
ENV PORT=3000
ENV UPLOADS_DIR=/data/uploads
RUN mkdir -p /data/uploads && chown -R node:node /data
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]
