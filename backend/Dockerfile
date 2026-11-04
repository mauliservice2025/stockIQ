# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/openapi.json ./openapi.json
COPY src/database/migrations ./src/database/migrations
COPY src/database/seeds ./src/database/seeds

EXPOSE 3001
CMD ["node", "dist/server.js"]

