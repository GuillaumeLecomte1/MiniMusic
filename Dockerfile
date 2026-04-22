# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all source
COPY backend ./backend
COPY frontend ./frontend

# Install dependencies and build backend
RUN cd /app/backend && npm install && npx prisma generate && npm run build

# Build frontend
RUN cd /app/frontend && npm install && npm run build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Copy prisma schema first
COPY --from=builder /app/backend/prisma ./backend/prisma

# Install production dependencies only
COPY --from=builder /app/backend/package*.json /app/backend/
RUN cd /app/backend && npm install --only=production && npx prisma generate --schema ./prisma/schema.prisma

# Copy built artifacts
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production

EXPOSE 3001

CMD ["sh", "-c", "cd /app/backend && node dist/index.js"]
