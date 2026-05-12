from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import agents, channels, providers, runs, templates, workflows, ws
from app.config import settings
from app.db import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="Cerebra", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(",") if settings.cors_origins else ["http://localhost:5173", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents.router)
app.include_router(workflows.router)
app.include_router(runs.router)
app.include_router(channels.router)
app.include_router(templates.router)
app.include_router(providers.router)
app.include_router(ws.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
