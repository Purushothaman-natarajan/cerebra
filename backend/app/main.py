"""FastAPI application entry point.

Configures structured logging, CORS, auth middleware, rate limiting,
request-id tracing, and registers all API routers.

Health check at /health is public (no auth).
All other routes require Authorization: Bearer if CEREBRA_API_KEY is set.
"""

import asyncio
import logging
import subprocess
import sys
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import agent_templates, agents, channels, human, providers, runs, templates, tools, workflows, ws, logs
from app.auth import verify_api_key
from app.config import settings
from app.db import Base, engine, check_db_connection
from app.logging_config import configure_logging, set_request_id, get_logger
from app.openapi_patch import patch_openapi_schema
from app.ratelimit import limit_middleware
from app.scheduler import start_scheduler, stop_scheduler

logger = get_logger(__name__)


async def _run_migrations():
    """Apply pending Alembic migrations via subprocess.

    Falls back to create_all if Alembic is not available or fails
    (e.g., during first-time setup with SQLite).
    """
    try:
        proc = await asyncio.create_subprocess_exec(
            sys.executable, "-m", "alembic", "upgrade", "head",
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()
        if proc.returncode == 0:
            logger.info("Alembic migrations applied successfully")
            return True
        else:
            stderr_text = stderr.decode().strip()
            logger.warning("Alembic migration failed (falling back to create_all): %s", stderr_text)
    except Exception as exc:
        msg = str(exc) or "unknown error"
        logger.warning("Alembic migration skipped (%s) — using create_all", msg[:100])
    return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown.
    
    On startup:
    1. Configure structured logging
    2. Run Alembic migrations (fall back to create_all)
    3. Seed default agent templates
    4. Start scheduled workflow scheduler
    
    On shutdown:
    1. Stop scheduler
    2. Close DB connections
    3. Clean up resources
    """
    configure_logging()
    logger.info("Starting Cerebra-AI backend", extra={"version": "0.2.0", "service": settings.service_name})

    # Run Alembic migrations, fall back to create_all on failure
    migrated = await _run_migrations()
    if not migrated:
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created via metadata.create_all")
        except Exception as e:
            logger.warning("Database unavailable at startup", extra={"error": str(e)})

    # Seed default agent templates
    try:
        from sqlalchemy.ext.asyncio import AsyncSession
        async with AsyncSession(engine) as session:
            from app.services.agent_template_service import seed_defaults
            seeded = await seed_defaults(session)
            if seeded:
                logger.info("Default agent templates seeded", extra={"count": seeded})
    except Exception as e:
        logger.warning("Could not seed agent templates", extra={"error": str(e)})

    # Start the APScheduler for scheduled workflows
    start_scheduler()
    logger.info("Workflow scheduler started")

    yield

    # Shutdown
    stop_scheduler()
    if engine:
        await engine.dispose()
    logger.info("Cerebra-AI backend shut down")


app = FastAPI(
    title="Cerebra-AI",
    version="0.2.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global unhandled exception handler returning structured JSON errors.
    
    Logs the full traceback server-side and returns a sanitized 500 response.
    """
    logger.error("Unhandled exception", extra={
        "path": str(request.url.path),
        "method": request.method,
        "error": str(exc),
    }, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "request_id": getattr(request.state, "request_id", "")},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Return user-friendly validation errors instead of the default raw list format.
    
    Transforms FastAPI's default validation error list into a structured response
    with field-level error messages.
    """
    errors = []
    for err in exc.errors():
        field = " → ".join(str(loc) for loc in err.get("loc", []) if loc not in ("body", "query", "path"))
        msg = err.get("msg", "Invalid value")
        errors.append({"field": field, "message": msg})

    logger.warning("Validation error", extra={
        "path": str(request.url.path), "method": request.method,
        "errors": errors, "request_id": getattr(request.state, "request_id", ""),
    })
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation failed", "errors": errors, "request_id": getattr(request.state, "request_id", "")},
    )


# --- Middleware ---

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list() or ["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    """Validate API key and apply rate limiting on all requests except public paths."""
    response = await verify_api_key(request)
    if response:
        return response
    return await limit_middleware(request, call_next)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """Assign a unique request ID and log every request.
    
    Accepts an optional X-Request-Id header from the client; generates one otherwise.
    Logs method, path, status, duration. Health/docs are logged at DEBUG level.
    """
    rid = set_request_id(request.headers.get("X-Request-Id", None))
    request.state.request_id = rid
    start = time.monotonic()
    response = await call_next(request)
    elapsed_ms = int((time.monotonic() - start) * 1000)
    response.headers["X-Request-Id"] = rid
    path = str(request.url.path)
    level = logger.debug if path in ("/health", "/docs", "/redoc", "/openapi.json") else logger.info
    level("%s %s %s %dms", request.method, path, response.status_code, elapsed_ms)
    return response


# --- Routers ---

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
app.include_router(logs.router)


@app.get("/health", tags=["system"])
async def health():
    """Health check endpoint with dependency status.
    
    Returns the service status and upstream dependency health.
    This endpoint is public (no auth required).
    """
    db_ok = await check_db_connection()
    deps = {
        "database": "healthy" if db_ok else "degraded",
    }
    overall = "healthy" if db_ok else "degraded"
    status_code = 200 if db_ok else 503
    return JSONResponse(
        status_code=status_code,
        content={
            "status": overall,
            "service": settings.service_name,
            "version": "0.2.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "dependencies": deps,
        },
    )


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
