# Backend
FROM node:22-bookworm-slim AS backend
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/ ./
RUN mkdir -p /data
ENV DATA_DIR=/data
ENV PORT=4000
ENV CLIENT_ORIGIN=*
EXPOSE 4000
CMD ["node", "src/index.js"]
