FROM node:20-alpine

WORKDIR /app

# Copy source
COPY backend ./backend
COPY frontend ./frontend

# Install backend deps and build
RUN cd /app/backend && npm install && npx prisma generate && npm run build

# Build frontend
RUN cd /app/frontend && npm install && npm run build

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["sh", "-c", "cd /app/backend && node dist/index.js"]
