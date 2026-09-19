# ==============================================================================
# echosh-labs / amra-treasury
# Multi-stage single-binary build: Next.js static export + Go Engine + bbolt
# Port 8050
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Next.js Static Export Bundle
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Compile High-Performance Static Go Binary
# ------------------------------------------------------------------------------
FROM golang:1.23-alpine AS backend-builder
WORKDIR /app/backend

RUN apk add --no-cache git ca-certificates

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./
# Inject compiled Next.js export bundle directly into Go embed target
COPY --from=frontend-builder /app/frontend/out ./cmd/server/frontend_out

# Compile static binary with optimizations (-s -w strips debug symbols)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w -extldflags '-static'" \
    -o /app/amra-treasury ./cmd/server/main.go

# ------------------------------------------------------------------------------
# Stage 3: Ultra-Minimal Production Container
# ------------------------------------------------------------------------------
FROM alpine:3.20

RUN apk --no-cache add ca-certificates tzdata

RUN addgroup -S amra && adduser -S amra -G amra \
    && mkdir -p /var/data \
    && chown -R amra:amra /var/data

WORKDIR /app
COPY --from=backend-builder /app/amra-treasury /app/amra-treasury

ENV PORT=8050 \
    BOLT_DB_PATH=/var/data/amra-treasury.db \
    SERVICE_NAME=amra-treasury \
    ENV=production

USER amra
EXPOSE 8050

ENTRYPOINT ["/app/amra-treasury"]
