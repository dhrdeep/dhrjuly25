# Stage 1: Build the client
FROM node:20-alpine AS client-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY client/ ./client/
COPY vite.config.ts postcss.config.js tailwind.config.ts tsconfig.json ./
RUN npm run build

# Stage 2: Build the server
FROM node:20-alpine AS server-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY server/ ./server/
COPY tsconfig.server.json ./
RUN npm run build:server

# Stage 3: Production image
FROM node:20-alpine
WORKDIR /app
COPY --from=server-builder /app/dist ./dist
COPY --from=client-builder /app/client/dist ./client/dist
COPY package*.json ./
RUN npm ci --only=production

EXPOSE 5000
CMD ["node", "dist/server/index.js"]
