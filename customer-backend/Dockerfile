# Chat Flow AI — customer backend (single container: API + embedded worker)
FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src ./src
COPY migrations ./migrations

ENV NODE_ENV=production
EXPOSE 3000

# Migrations run automatically at boot (src/index.js), then API + worker start.
CMD ["node", "src/index.js"]
