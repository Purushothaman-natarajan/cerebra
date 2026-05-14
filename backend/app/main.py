"""FastAPI application entry point.

Initializes the database schema on startup, configures CORS and auth middleware,
and registers all API routers under their respective prefixes.

Health check at /health is public (no auth).
All other routes require Authorization: Bearer if CEREBRA_API_KEY is set.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import agent_templates, agents, channels, human, providers, runs, templates, tools, workflows, ws
from app.auth import verify_api_key
from app.config import settings
from app.db import Base, engine
from app.openapi_patch import patch_openapi_schema
from app.ratelimit import limit_middleware
from app.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all database tables on startup. Seed default agent templates if none exist."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        import logging
        logging.warning("Database unavailable at startup (%s). Tables will be created when DB is ready.", e)

    # Seed default agent templates
    try:
        from sqlalchemy.ext.asyncio import AsyncSession
        async with AsyncSession(engine) as session:
            from app.services.agent_template_service import seed_defaults
            seeded = await seed_defaults(session)
            if seeded:
                import logging
                logging.info("Seeded %d default agent templates", seeded)
    except Exception as e:
        import logging
        logging.warning("Could not seed agent templates: %s", e)

    # Start the APScheduler for scheduled workflows
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(title="Cerebra-AI", version="0.2.0", lifespan=lifespan)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    """Catch unhandled exceptions and return clean JSON instead of HTML 500."""
    import logging
    import traceback
    logging.error("Unhandled exception: %s\n%s", exc, traceback.format_exc())
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {exc}"},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(",") if settings.cors_origins else ["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def auth_middleware(request, call_next):
    """Validate API key and rate limit on all requests except public paths."""
    response = await verify_api_key(request)
    if response:
        return response
    return await limit_middleware(request, call_next)


app.include_router(agents.router)
app.include_router(agent_templates.router)
app.include_router(workflows.router)
app.include_router(runs.router)
app.include_router(channels.router)
app.include_router(templates.router)
app.include_router(providers.router)
app.include_router(tools.router)
app.include_router(human.router)
app.include_router(ws.router)


@app.get("/health")
async def health():
    """Health check endpoint. Returns {"status": "ok"} when the app is running."""
    return {"status": "ok"}


# Patch OpenAPI schema to add singular `example` from `examples` arrays.
# Swagger pre-populates "Try it out" from `example`, but Pydantic v2's
# Field(examples=[...]) only generates the plural form.
_original_openapi = app.openapi


def _patched_openapi():
    schema = _original_openapi()
    if schema:
        patch_openapi_schema(schema)
    return schema


app.openapi = _patched_openapi
