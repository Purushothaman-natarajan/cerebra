.PHONY: dev build clean

dev:
	docker compose up --build

dev-backend:
	uvicorn backend.app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

build:
	docker compose build

clean:
	docker compose down -v
