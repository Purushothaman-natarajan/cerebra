# ============================================================================
# Cerebra-AI Makefile — development, testing, deployment commands
# ============================================================================

.PHONY: dev dev-backend dev-frontend build clean run test test-backend test-frontend lint-backend lint-frontend pre-commit help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# === Docker ===

dev: ## Start all services with Docker Compose
	docker compose up --build

dev-detached: ## Start all services in background
	docker compose up --build -d

build: ## Build Docker images without running
	docker compose build

clean: ## Stop all services and remove volumes
	docker compose down -v

logs: ## Follow all service logs
	docker compose logs -f

# === Backend ===

dev-backend: ## Start backend locally (requires PostgreSQL + Redis)
	cd backend && uvicorn app.main:app --reload --port 8000

test-backend: ## Run all backend tests
	cd backend && python -m pytest tests/ -q

test-backend-cov: ## Run backend tests with coverage report
	cd backend && python -m pytest tests/ --cov=app --cov-report=term --cov-report=html

test-backend-v: ## Run backend tests verbosely
	cd backend && python -m pytest tests/ -v

migrate: ## Run Alembic migrations
	cd backend && alembic upgrade head

migrate-sql: ## Generate SQL for migrations (dry run)
	cd backend && alembic upgrade head --sql

# === Frontend ===

dev-frontend: ## Start frontend dev server
	cd frontend && npm run dev

test-frontend: ## Run all frontend tests
	cd frontend && npm run test -- --run

test-frontend-watch: ## Run frontend tests in watch mode
	cd frontend && npm run test:watch

build-frontend: ## Build frontend for production
	cd frontend && npm run build

# === Linting / Formatting ===

lint-backend: ## Lint backend with Ruff
	cd backend && ruff check app/ tests/

format-backend: ## Format backend with Ruff
	cd backend && ruff format app/ tests/

lint-frontend: ## TypeScript check frontend
	cd frontend && npx tsc --noEmit

pre-commit: ## Run pre-commit hooks on all files
	pre-commit run --all-files

pre-commit-install: ## Install pre-commit hooks
	pre-commit install

# === Utilities ===

run: ## Run via shell script
	./scripts/run.sh

run-win: ## Run via batch script (Windows)
	scripts\run.bat

clean-pyc: ## Remove Python cache files
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true

clean-node: ## Remove node_modules
	rm -rf frontend/node_modules
