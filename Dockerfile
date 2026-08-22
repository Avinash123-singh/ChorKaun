# ChorKaun — single-image production build (frontend + backend + SQLite)
FROM node:22-bookworm-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:22-bookworm-slim
RUN apt-get update \
  && apt-get install -y nginx gettext-base python3 make g++ curl \
  && rm -rf /var/lib/apt/lists/* \
  && rm -f /etc/nginx/sites-enabled/default

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./

WORKDIR /app
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
COPY nginx.prod.conf /app/nginx.prod.conf
COPY start.sh /start.sh
RUN chmod +x /start.sh && mkdir -p /data

ENV NODE_ENV=production
ENV PORT=8080
ENV DATA_DIR=/data
ENV CLIENT_ORIGIN=*

EXPOSE 8080
VOLUME ["/data"]
CMD ["/start.sh"]
