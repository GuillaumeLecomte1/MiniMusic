# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all source
COPY backend ./backend
COPY frontend ./frontend

# Install dependencies and build backend
RUN cd /app/backend && npm install && npx prisma generate && npm run build

# Build frontend
RUN cd /app/frontend && npm ci && npm run build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Install production dependencies only
COPY --from=builder /app/backend/package*.json /app/backend/
RUN cd /app/backend && npm ci --only=production && npx prisma generate

# Copy built artifacts
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma

ENV NODE_ENV=production

EXPOSE 3001

CMD ["sh", "-c", "cd /app/backend && node dist/index.js"]
