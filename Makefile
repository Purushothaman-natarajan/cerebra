.PHONY: dev dev-backend dev-frontend build clean run

dev:
	docker compose up --build

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

run:
	./scripts/run.sh

run-win:
	scripts\run.bat

build:
	docker compose build

clean:
	docker compose down -v
