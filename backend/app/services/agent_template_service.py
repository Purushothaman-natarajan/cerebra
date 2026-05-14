"""Agent template CRUD + seeding default presets."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent_template import AgentTemplate

DEFAULT_TEMPLATES = [
    {
        "name": "Research Assistant",
        "role": "research",
        "system_prompt": "You are a research assistant. Search the web, fetch URL metadata, and synthesize findings into clear summaries. Use calculator for numerical analysis.",
        "tools": ["web_search", "calculator", "url_info"],
        "model": "gemini-2.0-flash", "memory_enabled": False, "max_iterations": 10,
        "guardrails": {"blocked_topics": [], "max_tokens": 4096},
    },
    {
        "name": "Content Writer",
        "role": "writer",
        "system_prompt": "You are a creative content writer. Research topics via web search, analyze text structure, and produce well-formatted articles, blog posts, or documentation.",
        "tools": ["web_search", "text_analyzer"],
        "model": "gemini-2.0-flash", "memory_enabled": False, "max_iterations": 10,
        "guardrails": {"blocked_topics": [], "max_tokens": 8192},
    },
    {
        "name": "Data Analyst",
        "role": "analyst",
        "system_prompt": "You are a data analyst. Analyze text statistics, perform calculations, manipulate JSON data, and present findings with clear numbers and insights.",
        "tools": ["calculator", "text_analyzer", "json_tool"],
        "model": "gemini-2.0-flash", "memory_enabled": False, "max_iterations": 15,
        "guardrails": {"blocked_topics": [], "max_tokens": 4096},
    },
    {
        "name": "Code Reviewer",
        "role": "coder",
        "system_prompt": "You are a senior code reviewer. Search for best practices, fetch documentation URLs, analyze code quality, and provide constructive feedback.",
        "tools": ["web_search", "url_info"],
        "model": "gemini-2.0-flash", "memory_enabled": False, "max_iterations": 10,
        "guardrails": {"blocked_topics": [], "max_tokens": 8192},
    },
    {
        "name": "Customer Support",
        "role": "support",
        "system_prompt": "You are a helpful customer support agent. Answer questions, check current time for availability, and search the knowledge base via web search.",
        "tools": ["web_search", "current_time"],
        "model": "gemini-2.0-flash", "memory_enabled": True, "max_iterations": 8,
        "guardrails": {"blocked_topics": ["politics", "nsfw"], "max_tokens": 4096},
    },
    {
        "name": "Research Analyst",
        "role": "research",
        "system_prompt": "You are a research analyst. Gather information from multiple web sources, fetch detailed URL metadata, and analyze text to produce comprehensive research reports.",
        "tools": ["web_search", "url_info", "text_analyzer"],
        "model": "gemini-2.0-flash", "memory_enabled": False, "max_iterations": 15,
        "guardrails": {"blocked_topics": [], "max_tokens": 8192},
    },
    {
        "name": "JSON Transformer",
        "role": "coder",
        "system_prompt": "You are a JSON transformation specialist. Validate, format, extract, and manipulate JSON data. Use calculator for any numerical transformations.",
        "tools": ["json_tool", "calculator"],
        "model": "gemini-2.0-flash", "memory_enabled": False, "max_iterations": 10,
        "guardrails": {"blocked_topics": [], "max_tokens": 4096},
    },
    {
        "name": "Multi-Searcher",
        "role": "research",
        "system_prompt": "You search multiple sources, cross-reference URL metadata, and crawl web pages to gather comprehensive information. Great for competitive research and fact-checking.",
        "tools": ["web_search", "url_info", "web_crawler"],
        "model": "gemini-2.0-flash", "memory_enabled": False, "max_iterations": 15,
        "guardrails": {"blocked_topics": [], "max_tokens": 8192},
    },
]


async def list_templates(db: AsyncSession) -> list[AgentTemplate]:
    result = await db.execute(select(AgentTemplate).order_by(AgentTemplate.created_at))
    return list(result.scalars().all())


async def create_template(db: AsyncSession, data: dict) -> AgentTemplate:
    tmpl = AgentTemplate(**data)
    db.add(tmpl)
    await db.flush()
    return tmpl


async def delete_template(db: AsyncSession, template_id: str) -> bool:
    result = await db.execute(select(AgentTemplate).where(AgentTemplate.id == uuid.UUID(template_id)))
    tmpl = result.scalar_one_or_none()
    if not tmpl:
        return False
    await db.delete(tmpl)
    await db.flush()
    return True


async def seed_defaults(db: AsyncSession) -> int:
    """Seed default templates if none exist. Returns count seeded."""
    result = await db.execute(select(AgentTemplate).limit(1))
    if result.scalar_one_or_none():
        return 0
    count = 0
    for data in DEFAULT_TEMPLATES:
        data["is_default"] = True
        db.add(AgentTemplate(**data))
        count += 1
    await db.flush()
    return count
