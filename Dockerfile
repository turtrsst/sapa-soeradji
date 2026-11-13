# SOERA AI — image produksi (Node 22, node:sqlite bawaan, tanpa dependensi native)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV SAPA_DATA_DIR=/data
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs
RUN addgroup -S soera && adduser -S soera -G soera && mkdir -p /data && chown -R soera:soera /data /app
USER soera
EXPOSE 3000
VOLUME ["/data"]
CMD ["npm", "start"]
