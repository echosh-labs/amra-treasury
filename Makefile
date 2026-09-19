# ==============================================================================
# echosh-labs / amra-treasury
# Sovereign Local & Cloud Run Automation (Port 8050)
# ==============================================================================

.PHONY: help dev build test verify clean deploy-cloudrun run docker-build docker-run clear-port free-port build-frontend build-backend lint

PORT ?= 8050
BOLT_DB_PATH ?= .data/amra-treasury-dev.db
PROJECT_ID ?= $(shell gcloud config get-value project 2>/dev/null || echo "your-gcp-project")
REGION ?= us-central1
IMAGE_TAG ?= $(REGION)-docker.pkg.dev/$(PROJECT_ID)/amra-treasury/engine:latest

help:
	@echo "echosh-labs / amra-treasury Sovereign Commands (Port $(PORT)):"
	@echo "  make dev          - Build & run single-binary engine locally on port $(PORT)"
	@echo "  make run          - Clear port $(PORT) and run compiled binary"
	@echo "  make build        - Compile Next.js export, sync embed, and build Linux binary"
	@echo "  make test         - Run Go backend tests"
	@echo "  make lint         - Run Go vet and frontend TypeScript linters"
	@echo "  make verify       - Run full unified smoke test suite (./test.sh)"
	@echo "  make clear-port   - Identify and clear contentious processes on port $(PORT)"
	@echo "  make docker-build - Build multi-stage single-binary Docker container"
	@echo "  make clean        - Remove build outputs while preserving .data/"

test:
	@echo "🧪 Running Go backend tests..."
	cd backend && go test -v ./...

lint:
	@echo "🔍 Running Go vet..."
	cd backend && go vet ./...
	@echo "🔍 Running frontend typecheck..."
	cd frontend && npm run typecheck

build-frontend:
	cd frontend && npm run build
	rm -rf backend/cmd/server/frontend_out
	cp -r frontend/out backend/cmd/server/frontend_out

build-backend:
	mkdir -p bin
	cd backend && CGO_ENABLED=0 go build -o ../bin/amra-treasury ./cmd/server/main.go

build: build-frontend build-backend
	@echo "✔ Sovereign Linux binary ready at: bin/amra-treasury"

clear-port:
	@./scripts/clear-port.sh $(PORT)

free-port: clear-port

dev: clear-port build
	mkdir -p .data
	PORT=$(PORT) BOLT_DB_PATH=$(BOLT_DB_PATH) ./bin/amra-treasury

run: clear-port
	PORT=$(PORT) BOLT_DB_PATH=$(BOLT_DB_PATH) ./bin/amra-treasury

verify:
	./test.sh

docker-build:
	docker build -t $(IMAGE_TAG) .

clean:
	rm -rf bin/ frontend/out frontend/.next backend/cmd/server/frontend_out/*
	touch backend/cmd/server/frontend_out/.gitkeep
