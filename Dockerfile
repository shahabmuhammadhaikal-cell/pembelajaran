# Satu container: Express API + hasil build React (client/dist).
# Dipakai host gratis berbasis container seperti Northflank Sandbox, Koyeb,
# Railway, atau Render (Docker). Build dari root repo:
#   docker build -t pembelajaran .
#   docker run -p 8080:8080 -e STORAGE=firestore pembelajaran

FROM node:22-alpine AS client
WORKDIR /app
COPY assets/ ./assets/
COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm ci --no-audit --no-fund
COPY client/ ./client/
RUN cd client && npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev --no-audit --no-fund
COPY server/ ./server/
COPY assets/ ./assets/
COPY --from=client /app/client/dist ./client/dist
EXPOSE 8080
CMD ["node", "server/index.js"]
