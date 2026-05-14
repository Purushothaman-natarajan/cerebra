"""Channel management — Telegram messaging integration."""

from sqlalchemy import select

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.channels.telegram import TelegramChannel
from app.config import settings
from app.db import get_db
from app.docs import list_response_example, response_example
from app.models.message import Channel, ChannelMessage
from app.models.workflow import WorkflowDef
from app.runtime.executor import run_workflow
from app.schemas import ChannelCreate, ChannelResponse, DeleteResponse

router = APIRouter(prefix="/channels", tags=["channels"])

_CHANNEL_EXAMPLE = {
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "name": "My Telegram Bot",
    "type": "telegram",
    "config": {"bot_token": "123456:ABC-...", "workflow_id": None},
    "created_at": "2026-05-13T12:00:00+00:00",
}


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


@router.post("", status_code=201, response_model=ChannelResponse,
    responses=response_example(_CHANNEL_EXAMPLE))
async def create_channel(body: ChannelCreate, db: AsyncSession = Depends(get_db)):
    """Create a new messaging channel (Telegram bot connection)."""
    channel = Channel(name=body.name, type=body.type, config=body.config)
    db.add(channel)
    await db.flush()
    if channel.type == "telegram" and settings.telegram_bot_token:
        tg = TelegramChannel(settings.telegram_bot_token, settings.telegram_webhook_url)
        await tg.set_webhook()
    return {"id": str(channel.id), "name": channel.name, "type": channel.type,
            "config": channel.config, "created_at": channel.created_at.isoformat()}


@router.post("/webhook/telegram", response_model=dict,
    responses=response_example({"ok": True}))
async def telegram_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Receive incoming Telegram messages via webhook (public, no auth)."""
    payload = await request.json()
    tg = TelegramChannel(settings.telegram_bot_token)
    result = await tg.process_webhook(payload)
    if result is None:
        return {"ok": False}
    channel_row = await db.execute(select(Channel).where(Channel.type == "telegram").limit(1))
    channel = channel_row.scalar_one_or_none()
    msg = ChannelMessage(channel_id=channel.id if channel else None, direction="incoming", text=result["text"], msg_metadata=result)
    db.add(msg)
    await db.flush()
    workflow_id = channel.config.get("workflow_id") if channel else None
    if workflow_id:
        wf_def_result = await db.execute(select(WorkflowDef).where(WorkflowDef.id == workflow_id))
        wf_def = wf_def_result.scalar_one_or_none()
        if wf_def:
            await run_workflow({"nodes": wf_def.nodes, "edges": wf_def.edges, "entry_node": wf_def.nodes[0]["id"] if wf_def.nodes else ""}, result["text"])
            await tg.send_message(result["chat_id"], "Processing your request...")
    return {"ok": True}
