"""Channel management — Telegram messaging integration with per-channel bot tokens."""

import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.channels.telegram import TelegramChannel
from app.db import get_db
from app.docs import list_response_example, response_example
from app.models.message import Channel, ChannelMessage
from app.models.workflow import WorkflowDef
from app.runtime.executor import run_workflow
from app.schemas import ChannelCreate, ChannelResponse, DeleteResponse
from app.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/channels", tags=["channels"])

_CHANNEL_EXAMPLE = {
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "name": "My Telegram Bot",
    "type": "telegram",
    "config": {"bot_token": "123456:ABC-...", "workflow_id": None},
    "created_at": "2026-05-13T12:00:00+00:00",
}


def _get_bot_token(config: dict) -> str:
    """Extract the bot token from channel config."""
    token = config.get("bot_token") or config.get("token") or ""
    return str(token).strip()


def _get_webhook_url(config: dict) -> str | None:
    """Extract the webhook URL from channel config, or default to settings."""
    return config.get("webhook_url") or None


async def _test_bot_token(token: str) -> dict:
    """Test a Telegram bot token by calling getMe API. Returns {'ok': bool, 'description': str}."""
    import httpx
    import json
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"https://api.telegram.org/bot{token}/getMe")
            try:
                data = resp.json()
            except json.JSONDecodeError:
                return {"ok": False, "description": f"Telegram returned non-JSON (HTTP {resp.status_code}). Check your token format."}
            if data.get("ok"):
                bot = data.get("result", {})
                return {"ok": True, "username": bot.get("username", ""), "first_name": bot.get("first_name", "")}
            desc = data.get("description", "Invalid token")
            # Telegram uses "Not Found" for invalid/deleted bots — make this user-friendly
            if "not found" in desc.lower():
                desc = "Bot token rejected by Telegram. Token may be invalid or the bot was deleted. Create a new bot via @BotFather."
            return {"ok": False, "description": desc}
    except httpx.RequestError as e:
        return {"ok": False, "description": f"Cannot reach Telegram API (check your internet connection): {e}"}


@router.get("", response_model=list[ChannelResponse],
    responses=list_response_example([_CHANNEL_EXAMPLE]))
async def list_channels(db: AsyncSession = Depends(get_db)):
    """List all configured channels. No input required."""
    result = await db.execute(select(Channel).order_by(Channel.created_at.desc()))
    return [
        {"id": str(c.id), "name": c.name, "type": c.type,
         "config": c.config, "created_at": c.created_at.isoformat()}
        for c in result.scalars().all()
    ]


@router.delete("/{channel_id}", response_model=DeleteResponse,
    responses={**response_example({"ok": True}), **{404: {"description": "Channel not found"}}})
async def delete_channel(channel_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a channel by UUID. Messages associated with the channel are preserved."""
    try:
        uid = uuid.UUID(channel_id)
    except ValueError:
        raise HTTPException(400, "Invalid channel ID format (must be a UUID)")
    result = await db.execute(select(Channel).where(Channel.id == uid))
    channel = result.scalar_one_or_none()
    if not channel:
        raise HTTPException(404, "Channel not found")
    await db.delete(channel)
    await db.flush()
    return {"ok": True}


@router.post("/test", response_model=dict)
async def test_channel(body: dict):
    """Test a Telegram bot token by calling Telegram's getMe API."""
    token = _get_bot_token(body)
    if not token:
        raise HTTPException(400, "bot_token is required")
    return await _test_bot_token(token)


@router.post("", status_code=201, response_model=ChannelResponse,
    responses=response_example(_CHANNEL_EXAMPLE))
async def create_channel(body: ChannelCreate, db: AsyncSession = Depends(get_db)):
    """Register a Telegram bot channel, test the token, and set up the webhook automatically.

    The bot_token is stored in the channel config and used for all subsequent
    webhook calls and message sending.
    """
    config = dict(body.config or {})
    token = _get_bot_token(config)
    if not token:
        raise HTTPException(400, "bot_token is required in config")

    # Validate the token before storing
    test = await _test_bot_token(token)
    if not test["ok"]:
        raise HTTPException(400, f"Invalid bot token: {test.get('description', 'Unknown error')}")

    channel = Channel(name=body.name, type=body.type, config=config)
    db.add(channel)
    await db.flush()

    # Auto-register webhook with Telegram (uses the bot token from config, not global settings)
    tg = TelegramChannel(token)
    webhook_path = f"{body.type}"  # e.g., "telegram"
    ngrok_url = config.get("webhook_url") or config.get("ngrok_url", "")
    if ngrok_url:
        webhook_url = f"{ngrok_url.rstrip('/')}/api/channels/webhook/{webhook_path}"
    else:
        # Try to auto-detect from request if available — for now set to a placeholder
        webhook_url = config.get("webhook_url", "")

    if webhook_url:
        ok, desc = await tg.set_webhook(webhook_url)
        if ok:
            logger.info("Telegram webhook registered", extra={"bot": test.get("username", ""), "url": webhook_url})
        else:
            logger.warning("Telegram webhook registration failed", extra={"error": desc, "url": webhook_url})

    return {
        "id": str(channel.id), "name": channel.name, "type": channel.type,
        "config": channel.config, "created_at": channel.created_at.isoformat(),
    }


@router.post("/webhook/telegram", response_model=dict,
    responses=response_example({"ok": True}))
async def telegram_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Receive incoming Telegram messages via webhook (public, no auth).

    Telegram sends updates here. The handler:
    1. Extracts the bot username from the update to find the correct channel
    2. Stores the message in the database
    3. If a workflow is bound, triggers execution
    """
    # Parse request body — handle empty or invalid JSON gracefully
    try:
        body = await request.body()
        payload = json.loads(body) if body else {}
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JSONResponse(status_code=400, content={"ok": False, "description": "Invalid JSON body"})
    if not payload:
        return JSONResponse(status_code=400, content={"ok": False, "description": "Empty request body"})

    logger.debug("Telegram webhook received", extra={"update_id": payload.get("update_id")})

    # Find the first active Telegram channel
    try:
        result = await db.execute(select(Channel).where(Channel.type == "telegram").limit(1))
        channel = result.scalar_one_or_none()
    except Exception as exc:
        logger.error("Database error processing webhook", extra={"error": str(exc)})
        return JSONResponse(status_code=500, content={"ok": False, "description": "Database unavailable"})

    if not channel:
        logger.warning("No Telegram channel configured for webhook")
        return {"ok": False, "description": "No channel configured"}

    token = _get_bot_token(channel.config)
    if not token:
        return {"ok": False, "description": "No bot token configured"}

    tg = TelegramChannel(token)
    parsed = await tg.process_webhook(payload)
    if parsed is None:
        return {"ok": False}

    # Store the incoming message
    try:
        msg = ChannelMessage(
            channel_id=channel.id,
            direction="incoming",
            text=parsed["text"],
            msg_metadata=parsed,
        )
        db.add(msg)
        await db.flush()
    except Exception as exc:
        logger.error("Failed to store webhook message", extra={"error": str(exc)})

    # Trigger bound workflow if configured
    workflow_id = channel.config.get("workflow_id") or channel.config.get("workflow")
    if workflow_id:
        try:
            wf_result = await db.execute(select(WorkflowDef).where(WorkflowDef.id == workflow_id))
            wf = wf_result.scalar_one_or_none()
            if wf and wf.nodes:
                entry = wf.nodes[0].get("id", "")
                await run_workflow(
                    {"nodes": wf.nodes, "edges": wf.edges, "entry_node": entry},
                    parsed["text"],
                )
                await tg.send_message(parsed["chat_id"], "✅ Processing your request...")
        except Exception as exc:
            logger.error("Workflow trigger failed", extra={"error": str(exc)})
            await tg.send_message(parsed["chat_id"], "❌ Failed to process your request.")

    return {"ok": True}
