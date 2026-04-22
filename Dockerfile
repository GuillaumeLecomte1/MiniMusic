FROM node:20-alpine

WORKDIR /app

# Build: force rebuild on code change
COPY backend ./backend
COPY frontend ./frontend

# Install backend deps and build
RUN cd /app/backend && npm install && npx prisma generate && npm run build

# Build frontend
RUN cd /app/frontend && npm install && npm run build

ENV NODE_ENV=production
ENV PORT=3010

EXPOSE 3010

CMD ["sh", "-c", "cd /app/backend && node dist/index.js"]
