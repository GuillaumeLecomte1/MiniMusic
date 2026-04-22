# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci

# Install dependencies for frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

# Copy source code
COPY backend ./backend
COPY frontend ./frontend

# Build backend
RUN cd backend && npm run build

# Build frontend
RUN cd frontend && npm run build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Install production dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy built artifacts
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/frontend/dist ./frontend/dist

# Expose ports
EXPOSE 3001 5173

# Start backend (frontend served by backend in production or separate)
CMD ["sh", "-c", "cd backend && node dist/index.js"]
