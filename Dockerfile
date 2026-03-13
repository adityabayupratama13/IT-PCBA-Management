FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Install build tools needed for better-sqlite3 native module
RUN apk add --no-cache python3 make g++ \
    && npm install

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN apk add --no-cache python3 make g++ \
    && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DB_PATH=/data

# Create data directory for SQLite database
RUN mkdir -p /data && chmod 755 /data

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Copy better-sqlite3 native bindings
COPY --from=deps /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

EXPOSE 3002

# Volume for SQLite database persistence
VOLUME ["/data"]

CMD ["node", "server.js"]
