"""Pydantic schemas with per-field examples and full response examples for Swagger.

Every model has:
- Field(examples=[...]) for per-field example values (shown in request bodies)
- model_config = ConfigDict(json_schema_extra={"example": ...}) for full response objects
"""

from pydantic import BaseModel, ConfigDict, Field
from typing import Any
from datetime import datetime, timezone


def ExField(*, example: Any, **kwargs: Any) -> Any:
    """Field wrapper that sets both `examples` (plural, OpenAPI) AND `example` (singular, Swagger pre-fill).

    Swagger UI pre-populates "Try it out" request bodies from the singular `example` field.
    Pydantic v2's `Field(examples=[...])` only sets the plural form which Swagger ignores for pre-fill.
    """
    if "json_schema_extra" not in kwargs:
        kwargs["json_schema_extra"] = {}
    if isinstance(kwargs["json_schema_extra"], dict):
        kwargs["json_schema_extra"]["example"] = example
    if "examples" not in kwargs:
        kwargs["examples"] = [example]
    return Field(**kwargs)


def _example(obj):
    """Returns a ConfigDict that adds a full JSON example to the model's OpenAPI schema."""
    return ConfigDict(json_schema_extra={"example": obj})


def _iso_utc(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


# ── Agents ───────────────────────────────────────────────────────

class AgentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255,
        description="Human-readable agent name shown in UI and canvas nodes.",
        examples=["ResearchAgent"])
    role: str = Field(..., min_length=1, max_length=255,
        description="Functional role — used to assign emoji avatars and group agents.",
        examples=["research_assistant"])
    system_prompt: str = Field(..., min_length=1, max_length=10000,
        description="System instruction that defines the agent's behaviour.",
        examples=["You are a research assistant. Search the web and summarize findings."])
    model: str = Field(default="gemini-2.0-flash", max_length=100,
        description="LLM model identifier from a configured provider.",
        examples=["gemini-2.0-flash"])
    tools: list[str] = Field(default=[], max_length=50,
        description="Tool names this agent can use.",
        examples=[["web_search", "calculator"]])
    channel_id: str | None = Field(default=None,
        description="Optional channel UUID to bind this agent.",
        examples=[None])
    memory_enabled: bool = Field(default=False,
        description="When true, persists conversation history across runs.",
        examples=[False])
    max_iterations: int = Field(default=10, ge=1, le=100,
        description="Maximum LLM+tool call cycles before forced response.",
        examples=[10])
    guardrails: dict = Field(default={},
        description="Safety constraints: blocked_topics, max_tokens.",
        examples=[{"blocked_topics": ["politics"], "max_tokens": 4096}])


class AgentUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255, examples=["ResearchAgent-v2"])
    role: str | None = Field(None, min_length=1, max_length=255, examples=["senior_researcher"])
    system_prompt: str | None = Field(None, min_length=1, max_length=10000,
        examples=["You are now a senior researcher..."])
    model: str | None = Field(None, max_length=100, examples=["gpt-4o"])
    tools: list[str] | None = Field(None, max_length=50, examples=[["web_search", "http_request"]])
    channel_id: str | None = None
    memory_enabled: bool | None = None
    max_iterations: int | None = Field(None, ge=1, le=100)
    guardrails: dict | None = None


class AgentResponse(BaseModel):
    model_config = _example({
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "ResearchAgent",
        "role": "research_assistant",
        "system_prompt": "You are a research assistant. Search the web and summarize findings.",
        "model": "gemini-2.0-flash",
        "tools": ["web_search", "calculator"],
        "channel_id": None,
        "memory_enabled": False,
        "max_iterations": 10,
        "guardrails": {"blocked_topics": ["politics"], "max_tokens": 4096},
        "created_at": "2026-05-13T12:00:00+00:00",
        "updated_at": "2026-05-13T12:00:00+00:00",
    })
    id: str = Field(description="UUID.")
    name: str = Field(description="Agent name.")
    role: str = Field(description="Agent role.")
    system_prompt: str = Field(description="System prompt.")
    model: str = Field(description="Model identifier.")
    tools: list[str] = Field(description="Enabled tools.")
    channel_id: str | None = Field(description="Bound channel UUID or null.")
    memory_enabled: bool = Field(description="Memory enabled flag.")
    max_iterations: int = Field(description="Max LLM call cycles.")
    guardrails: dict = Field(description="Guardrails config.")
    created_at: str = Field(description="ISO-8601 creation timestamp.")
    updated_at: str = Field(description="ISO-8601 last-update timestamp.")

    @classmethod
    def from_orm(cls, agent) -> "AgentResponse":
        return cls(
            id=str(agent.id), name=agent.name, role=agent.role,
            system_prompt=agent.system_prompt, model=agent.model,
            tools=agent.tools, channel_id=str(agent.channel_id) if agent.channel_id else None,
            memory_enabled=agent.memory_enabled, max_iterations=agent.max_iterations,
            guardrails=agent.guardrails, created_at=agent.created_at.isoformat(),
            updated_at=agent.updated_at.isoformat(),
        )


# ── Workflows ────────────────────────────────────────────────────

class WorkflowCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255,
        description="Workflow name shown in the sidebar and canvas.",
        examples=["Research & Report"])
    nodes: list[dict] = Field(default=[], max_length=200,
        description="Node definitions: id, type (agent|router|human|output|note), config.",
        examples=[[{"id": "researcher", "type": "agent",
                     "config": {"system_prompt": "...", "tools": ["web_search"]}}]])
    edges: list[dict] = Field(default=[], max_length=500,
        description="Connections: source, target, optional condition and fallback.",
        examples=[[{"source": "researcher", "target": "writer", "condition": None}]])
    trigger: dict = Field(default={"type": "manual", "config": {}},
        description="How the workflow starts: manual | schedule | channel.",
        examples=[{"type": "manual", "config": {}}])


class WorkflowUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    nodes: list[dict] | None = Field(None, max_length=200)
    edges: list[dict] | None = Field(None, max_length=500)
    trigger: dict | None = None


class WorkflowResponse(BaseModel):
    model_config = _example({
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Research & Report",
        "nodes": [{"id": "researcher", "type": "agent", "config": {"system_prompt": "...", "tools": ["web_search"]}}],
        "edges": [{"source": "researcher", "target": "writer", "condition": None}],
        "trigger": {"type": "manual", "config": {}},
        "created_at": "2026-05-13T12:00:00+00:00",
        "updated_at": "2026-05-13T12:00:00+00:00",
    })
    id: str = Field(description="UUID.")
    name: str = Field(description="Workflow name.")
    nodes: list[dict] = Field(description="Node definitions.")
    edges: list[dict] = Field(description="Edge definitions.")
    trigger: dict = Field(description="Trigger config.")
    created_at: str = Field(description="ISO-8601 timestamp.")
    updated_at: str = Field(description="ISO-8601 timestamp.")

    @classmethod
    def from_orm(cls, wf) -> "WorkflowResponse":
        return cls(
            id=str(wf.id), name=wf.name, nodes=wf.nodes, edges=wf.edges,
            trigger=wf.trigger, created_at=wf.created_at.isoformat(),
            updated_at=wf.updated_at.isoformat(),
        )


# ── Runs ─────────────────────────────────────────────────────────

class RunCreate(BaseModel):
    workflow_id: str = Field(..., min_length=36, max_length=36,
        description="UUID of the workflow to execute.",
        examples=["550e8400-e29b-41d4-a716-446655440001"])
    input: str = Field(default="", max_length=50000,
        description="Input message to start the workflow with.",
        examples=["What's the latest in agentic AI frameworks?"])


class RunResponse(BaseModel):
    model_config = _example({
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "workflow_id": "550e8400-e29b-41d4-a716-446655440001",
        "status": "completed",
        "started_at": "2026-05-13T12:00:00+00:00",
        "finished_at": "2026-05-13T12:00:30+00:00",
        "prompt_tokens": 150,
        "completion_tokens": 300,
        "total_tokens": 450,
        "cost": 0.000135,
    })
    id: str = Field(description="Run UUID.")
    workflow_id: str = Field(description="Workflow UUID.")
    status: str = Field(description="pending | running | completed | failed.")
    started_at: str | None = Field(description="ISO-8601 start or null.")
    finished_at: str | None = Field(description="ISO-8601 end or null.")
    prompt_tokens: int = Field(default=0, description="Total prompt tokens across all LLM calls.")
    completion_tokens: int = Field(default=0, description="Total completion tokens across all LLM calls.")
    total_tokens: int = Field(default=0, description="Total tokens used.")
    cost: float = Field(default=0.0, description="Estimated USD cost.")

    @classmethod
    def from_orm(cls, run) -> "RunResponse":
        return cls(
            id=str(run.id), workflow_id=str(run.workflow_id), status=run.status,
            started_at=_iso_utc(run.started_at),
            finished_at=_iso_utc(run.finished_at),
            prompt_tokens=run.prompt_tokens, completion_tokens=run.completion_tokens,
            total_tokens=run.total_tokens, cost=run.cost,
        )


class RunEventResponse(BaseModel):
    model_config = _example({
        "id": 1, "run_id": "550e8400-e29b-41d4-a716-446655440002",
        "timestamp": "2026-05-13T12:00:01+00:00",
        "type": "agent_start",
        "agent_id": "researcher",
        "payload": {"tool": "web_search", "query": "AI frameworks 2025"},
    })
    id: int = Field(description="Sequential event ID.")
    run_id: str = Field(description="Run UUID.")
    timestamp: str = Field(description="ISO-8601 timestamp.")
    type: str = Field(description="run_start | agent_start | tool_call | message | agent_end | run_end | run_error.")
    agent_id: str = Field(description="Agent or system identifier.")
    payload: dict = Field(description="Event payload (varies by type).")

    @classmethod
    def from_orm(cls, event) -> "RunEventResponse":
        return cls(
            id=event.id,
            run_id=str(event.run_id),
            timestamp=_iso_utc(event.timestamp) or "",
            type=event.type,
            agent_id=event.agent_id,
            payload=event.payload,
        )


# ── Providers ────────────────────────────────────────────────────

class ProviderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255,
        description="Display name.", examples=["My OpenAI"])
    provider_type: str = Field(default="custom", max_length=50,
        description="openai | gemini | anthropic | ollama | openrouter | custom.",
        examples=["openai"])
    base_url: str = Field(..., max_length=500,
        description="Base URL for the provider API.",
        examples=["https://api.openai.com/v1"])
    api_key: str = Field(default="", max_length=500,
        description="API key (encrypted at rest).",
        examples=["sk-proj-3aF8kD9mN2pQ7rX5vB1wJ4cL6nM0zS8t"])
    models: list[str] = Field(default=[], max_length=200,
        description="Pre-fetched model list from POST /providers/test.",
        examples=[["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"]])
    is_active: bool = Field(default=True,
        description="When false, models won't appear in the selector.")


class ProviderUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255,
        description="Updated display name.", examples=["My OpenAI v2"])
    base_url: str | None = Field(None, max_length=500,
        description="Updated base URL.", examples=["https://api.openai.com/v1"])
    api_key: str | None = Field(None, max_length=500,
        description="New API key (replaces existing).", examples=["sk-...new-key"])
    models: list[str] | None = Field(None, max_length=200,
        description="Updated model list.", examples=[["gpt-4o", "gpt-4o-mini"]])
    is_active: bool | None = Field(None,
        description="Toggle active state.")


class ProviderModelResponse(BaseModel):
    model_config = _example({
        "model": "gpt-4o",
        "provider_name": "My OpenAI",
        "provider_type": "openai",
        "provider_id": "550e8400-e29b-41d4-a716-446655440003",
    })
    model: str = Field(description="Model identifier.")
    provider_name: str = Field(description="Provider display name.")
    provider_type: str = Field(description="Provider type.")
    provider_id: str = Field(description="Provider UUID.")


class ProviderPresetResponse(BaseModel):
    model_config = _example({
        "type": "openai",
        "label": "OpenAI",
        "base_url": "https://api.openai.com/v1",
        "key_hint": "sk-...",
        "key_example": "sk-proj-3aF8kD9mN2pQ7rX5vB1wJ4cL6nM0zS8t",
    })
    type: str = Field(description="Preset type identifier.")
    label: str = Field(description="Display name.")
    base_url: str = Field(description="Default base URL.")
    key_hint: str = Field(description="Key format hint.")
    key_example: str = Field(description="Example API key.")


class ProviderTest(BaseModel):
    base_url: str = Field(..., max_length=500,
        description="Provider API base URL to test.",
        examples=["https://generativelanguage.googleapis.com/v1beta"])
    api_key: str = Field(default="", max_length=500,
        description="API key (not required for Ollama).",
        examples=["AIzaSyCb8mN3pQ7rX5vB1wJ4cL6nM0zS8tD9fG2hK"])
    provider_type: str = Field(default="custom", max_length=50,
        description="Provider type: openai | gemini | anthropic | ollama | custom.",
        examples=["gemini"])


class ProviderResponse(BaseModel):
    model_config = _example({
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "name": "My OpenAI",
        "provider_type": "openai",
        "base_url": "https://api.openai.com/v1",
        "models": ["gpt-4o", "gpt-4o-mini"],
        "is_active": True,
        "api_key": "sk-p...S8t",
        "created_at": "2026-05-13T12:00:00+00:00",
    })
    id: str = Field(description="UUID.")
    name: str = Field(description="Display name.")
    provider_type: str = Field(description="Provider type.")
    base_url: str = Field(description="Base URL.")
    models: list[str] = Field(description="Discovered models.")
    is_active: bool = Field(description="Active flag.")
    api_key: str = Field(description="Masked key (first 4 + last 4 chars).")
    created_at: str = Field(description="ISO-8601 timestamp.")


class ProviderTestResponse(BaseModel):
    model_config = _example({
        "ok": True,
        "models": ["gemini-2.0-flash", "gemini-2.0-pro", "gemini-1.5-pro"],
    })
    ok: bool = Field(description="Whether the connection succeeded.")
    models: list[str] = Field(description="Available model IDs.")


# ── Tools ────────────────────────────────────────────────────────

class ToolCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255,
        description="Unique tool name.", examples=["slack_notifier"])
    description: str = Field(default="", max_length=500,
        description="Description shown to the LLM.",
        examples=["Sends a message to a Slack channel via webhook."])
    tool_type: str = Field(default="http", max_length=50,
        description="http | python | webhook.", examples=["http"])
    config: dict = Field(default={},
        description="Tool configuration.",
        examples=[{"url": "https://hooks.slack.com/services/xxx", "method": "POST",
                    "parameters": [{"name": "message", "type": "string"}]}])


class ToolResponse(BaseModel):
    model_config = _example({
        "id": "550e8400-e29b-41d4-a716-446655440004",
        "name": "slack_notifier",
        "description": "Sends a message to Slack via webhook.",
        "tool_type": "http",
        "config": {"url": "https://hooks.slack.com/xxx", "method": "POST"},
        "is_builtin": False,
        "created_at": "2026-05-13T12:00:00+00:00",
    })
    id: str = Field(description="UUID (null for built-in tools).")
    name: str = Field(description="Tool name.")
    description: str = Field(description="Tool description.")
    tool_type: str = Field(description="Tool type.")
    config: dict = Field(description="Tool configuration.")
    is_builtin: bool = Field(description="True for system tools.")
    created_at: str = Field(description="ISO-8601 timestamp.")


# ── Channels ─────────────────────────────────────────────────────

class ChannelCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255,
        description="Display name.", examples=["My Telegram Bot"])
    type: str = Field(default="telegram", max_length=50,
        description="Channel type (currently only telegram).", examples=["telegram"])
    config: dict = Field(default={},
        description="Channel-specific config.",
        examples=[{"bot_token": "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
                    "workflow_id": "550e8400-e29b-41d4-a716-446655440001"}])


class ChannelResponse(BaseModel):
    model_config = _example({
        "id": "550e8400-e29b-41d4-a716-446655440005",
        "name": "My Telegram Bot",
        "type": "telegram",
        "config": {"bot_token": "123456:ABC-...", "workflow_id": None},
        "created_at": "2026-05-13T12:00:00+00:00",
    })
    id: str = Field(description="UUID.")
    name: str = Field(description="Display name.")
    type: str = Field(description="Channel type.")
    config: dict = Field(description="Channel config.")
    created_at: str = Field(description="ISO-8601 timestamp.")


class ToolTest(BaseModel):
    """Request to test a tool with sample input."""
    tool_id: str = Field(..., description="UUID of the tool to test.",
        examples=["550e8400-e29b-41d4-a716-446655440004"])
    input: str = Field(default="", description="Sample input to pass to the tool.",
        examples=["Hello from Cerebra!"])


class ToolTestResult(BaseModel):
    model_config = _example({
        "ok": True,
        "output": "HTTP 200: OK",
        "duration_ms": 1234,
    })
    ok: bool = Field(description="Whether the tool execution succeeded.")
    output: str = Field(description="Tool output text.")
    duration_ms: int = Field(description="Execution time in milliseconds.")


# ── Agent Test ──────────────────────────────────────────────────────

class AgentTestCreate(BaseModel):
    input: str = Field(default="", max_length=50000,
        description="Input message to send to the agent.",
        examples=["What are the latest trends in AI?"])


class AgentTestResult(BaseModel):
    model_config = _example({
        "ok": True,
        "output": "Here are the latest trends in AI...",
        "prompt_tokens": 150,
        "completion_tokens": 300,
        "total_tokens": 450,
        "cost": 0.000135,
        "duration_ms": 1234,
    })
    ok: bool = Field(description="Whether the test succeeded.")
    output: str = Field(description="Agent's response text.")
    prompt_tokens: int = Field(default=0, description="Prompt tokens used.")
    completion_tokens: int = Field(default=0, description="Completion tokens used.")
    total_tokens: int = Field(default=0, description="Total tokens used.")
    cost: float = Field(default=0.0, description="Estimated USD cost.")
    duration_ms: int = Field(description="Execution time in milliseconds.")


# ── Generic ──────────────────────────────────────────────────────

class DeleteResponse(BaseModel):
    model_config = _example({"ok": True})
    ok: bool = Field(description="Always true on success.", examples=[True])


# Logs
class LogResponse(BaseModel):
    model_config = _example({
        "id": 1,
        "run_id": "550e8400-e29b-41d4-a716-446655440002",
        "timestamp": "2026-05-13T12:00:01+00:00",
        "level": "info",
        "source": "frontend",
        "component": "ToolTestDialog",
        "action": "tool_test",
        "message": "Tool test started",
        "details": {"tool": "web_search", "input": "Cerebra"},
    })
    id: int = Field(description="Log ID.")
    run_id: str | None = Field(description="Optional run UUID.")
    timestamp: str = Field(description="ISO-8601 timestamp")
    level: str = Field(description="Log level")
    source: str = Field(description="Origin")
    component: str | None = Field(description="Component name")
    action: str | None = Field(description="Semantic action")
    message: str | None = Field(description="Human message")
    details: dict = Field(description="Opaque details JSON")
