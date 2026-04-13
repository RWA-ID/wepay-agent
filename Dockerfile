FROM node:24-slim AS base
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies
FROM base AS deps
COPY backend/package.json ./
RUN npm install

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ .
COPY agent/skills/wepay-bill-pay/skill.md ./src/skills/wepay-bill-pay.md
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY backend/package.json ./

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy || true; echo '=== dist ==='; ls dist/; echo '=== starting ==='; node --enable-source-maps dist/index.js"]
