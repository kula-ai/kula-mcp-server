# syntax=docker/dockerfile:1
# ponytail: base pinned by tag here; pin by DIGEST in the ECS task def / release build
# (a mutable tag defeats the supply-chain control — enforce the digest where it deploys).
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig*.json ./
RUN npm ci
COPY src/ ./src/
RUN npm run build

FROM node:22-alpine
WORKDIR /app
# 2560 MB heap + ~1.5 GB non-heap/TLS/external/OS fits a 4 GB task with headroom;
# 3072 risked OOM-137 (no drain) during a 50s request.
ENV NODE_OPTIONS=--max-old-space-size=2560
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/build ./build/
USER node
EXPOSE 8080
# --http runs the stateless remote connector; the deployed container always sets it.
CMD ["node", "build/index.js", "--http"]
