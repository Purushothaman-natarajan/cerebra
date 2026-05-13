"""FastAPI application entry point.

Initializes the database schema on startup, configures CORS and auth middleware,
and registers all API routers under their respective prefixes.

Health check at /health is public (no auth).
All other routes require Authorization: Bearer if CEREBRA_API_KEY is set.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import agents, channels, providers, runs, templates, tools, workflows, ws
from app.auth import verify_api_key
from app.config import settings
from app.db import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all database tables on startup. Skip gracefully if DB is unavailable."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        import logging
        logging.warning("Database unavailable at startup (%s). Tables will be created when DB is ready.", e)
    yield


app = FastAPI(title="Cerebra", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(",") if settings.cors_origins else ["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def auth_middleware(request, call_next):
    """Validate API key on all requests except public paths."""
    response = await verify_api_key(request)
    if response:
        return response
    return await call_next(request)


app.include_router(agents.router)
app.include_router(workflows.router)
app.include_router(runs.router)
app.include_router(channels.router)
app.include_router(templates.router)
app.include_router(providers.router)
app.include_router(tools.router)
app.include_router(ws.router)


@app.get("/health")
async def health():
    """Health check endpoint. Returns {"status": "ok"} when the app is running."""
    return {"status": "ok"}
