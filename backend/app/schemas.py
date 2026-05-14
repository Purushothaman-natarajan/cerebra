"""Pydantic schemas with examples for every field — Swagger UI shows playable defaults."""

from pydantic import BaseModel, Field


class AgentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255,
        description="Human-readable agent name shown in UI and workflow canvas nodes.",
        examples=["ResearchAgent"])
    role: str = Field(..., min_length=1, max_length=255,
        description="Functional role — used to assign emoji avatars and group agents.",
        examples=["research_assistant"])
    system_prompt: str = Field(..., min_length=1, max_length=10000,
        description="System instruction that defines the agent's behaviour, knowledge, and constraints.",
        examples=["You are a research assistant. Search the web and summarize findings."])
    model: str = Field(default="gemini-2.0-flash", max_length=100,
        description="LLM model identifier from a configured provider (e.g. gpt-4o, gemini-2.0-flash, claude-sonnet-4).",
        examples=["gemini-2.0-flash"])
    tools: list[str] = Field(default=[], max_length=50,
        description="Tool names this agent can use. Built-in: web_search, calculator, http_request, web_crawler.",
        examples=[["web_search", "calculator"]])
    channel_id: str | None = Field(default=None,
        description="Optional channel ID to bind this agent to a messaging channel (Telegram).")
    memory_enabled: bool = Field(default=False,
        description="When true, the agent persists conversation history across runs.")
    max_iterations: int = Field(default=10, ge=1, le=100,
        description="Maximum LLM+tool call cycles before the agent is forced to respond.")
    guardrails: dict = Field(default={},
        description="Safety constraints: blocked_topics (list[str]) and max_tokens (int).",
        examples=[{"blocked_topics": ["politics"], "max_tokens": 4096}])


class AgentUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255,
        description="Updated agent name.", examples=["ResearchAgent-v2"])
    role: str | None = Field(None, min_length=1, max_length=255,
        description="Updated role.", examples=["senior_researcher"])
    system_prompt: str | None = Field(None, min_length=1, max_length=10000,
        description="Updated system prompt.", examples=["You are now a senior researcher..."])
    model: str | None = Field(None, max_length=100,
        description="Updated model.", examples=["gpt-4o"])
    tools: list[str] | None = Field(None, max_length=50,
        description="Replaces the tool list.", examples=[["web_search", "http_request"]])
    channel_id: str | None = Field(None,
        description="Bind to a different channel or null to unbind.")
    memory_enabled: bool | None = Field(None,
        description="Toggle memory.")
    max_iterations: int | None = Field(None, ge=1, le=100,
        description="Update max iterations.")
    guardrails: dict | None = Field(None,
        description="Update guardrails.")


class AgentResponse(BaseModel):
    """Full agent object returned by the API."""
    id: str = Field(description="UUID.", examples=["550e8400-e29b-41d4-a716-446655440000"])
    name: str = Field(description="Agent name.", examples=["ResearchAgent"])
    role: str = Field(description="Agent role.", examples=["research_assistant"])
    system_prompt: str = Field(description="System prompt.", examples=["You are a research assistant..."])
    model: str = Field(description="Model identifier.", examples=["gemini-2.0-flash"])
    tools: list[str] = Field(description="Enabled tools.", examples=[["web_search", "calculator"]])
    channel_id: str | None = Field(description="Bound channel UUID or null.")
    memory_enabled: bool = Field(description="Memory enabled flag.")
    max_iterations: int = Field(description="Max LLM call cycles.")
    guardrails: dict = Field(description="Guardrails config.")
    created_at: str = Field(description="ISO-8601 creation timestamp.", examples=["2026-05-13T12:00:00+00:00"])
    updated_at: str = Field(description="ISO-8601 last-update timestamp.", examples=["2026-05-13T12:00:00+00:00"])

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


# ── Workflows ─────────────────────────────────────────────────────

class WorkflowCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255,
        description="Workflow name shown in the sidebar and canvas.",
        examples=["Research & Report"])
    nodes: list[dict] = Field(default=[], max_length=200,
        description="List of workflow node definitions. Each node has id, type (agent|router|human|output|note), and config.",
        examples=[[{"id": "researcher", "type": "agent", "config": {"system_prompt": "...", "tools": ["web_search"]}}]])
    edges: list[dict] = Field(default=[], max_length=500,
        description="Directed connections between nodes. Each edge has source, target, optional condition and fallback.",
        examples=[[{"source": "researcher", "target": "writer", "condition": None}]])
    trigger: dict = Field(default={"type": "manual", "config": {}},
        description="How the workflow starts. Options: manual, schedule, channel.",
        examples=[{"type": "manual", "config": {}}])


class WorkflowUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    nodes: list[dict] | None = Field(None, max_length=200)
    edges: list[dict] | None = Field(None, max_length=500)
    trigger: dict | None = None


class WorkflowResponse(BaseModel):
    """Full workflow object."""
    id: str = Field(description="UUID.", examples=["550e8400-e29b-41d4-a716-446655440001"])
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
        description="Input message to start the workflow with. Passed to the entry node as the first user message.",
        examples=["What's the latest in agentic AI frameworks?"])


class RunResponse(BaseModel):
    id: str = Field(description="Run UUID.", examples=["550e8400-e29b-41d4-a716-446655440002"])
    workflow_id: str = Field(description="Workflow UUID.")
    status: str = Field(description="Run status: pending | running | completed | failed.",
        examples=["pending"])
    started_at: str | None = Field(description="ISO-8601 start timestamp or null.")
    finished_at: str | None = Field(description="ISO-8601 end timestamp or null.")

    @classmethod
    def from_orm(cls, run) -> "RunResponse":
        return cls(
            id=str(run.id), workflow_id=str(run.workflow_id), status=run.status,
            started_at=run.started_at.isoformat() if run.started_at else None,
            finished_at=run.finished_at.isoformat() if run.finished_at else None,
        )


class RunEventResponse(BaseModel):
    """An event emitted during a workflow run (agent_start, tool_call, message, error, etc.)."""
    id: int = Field(description="Sequential event ID.")
    run_id: str = Field(description="Run UUID.")
    timestamp: str = Field(description="ISO-8601 timestamp.")
    type: str = Field(description="Event type: run_start, agent_start, tool_call, message, agent_end, run_end, run_error.",
        examples=["agent_start"])
    agent_id: str = Field(description="Agent or system identifier.", examples=["researcher"])
    payload: dict = Field(description="Event payload varies by type — tool results, messages, errors.",
        examples=[{"tool": "web_search", "query": "AI frameworks 2025"}])


# ── Providers ────────────────────────────────────────────────────

class ProviderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255,
        description="Display name for this provider configuration.",
        examples=["My OpenAI"])
    provider_type: str = Field(default="custom", max_length=50,
        description="Provider type: openai | gemini | anthropic | ollama | openrouter | custom.",
        examples=["openai"])
    base_url: str = Field(..., max_length=500,
        description="Base URL for the provider API. Presets auto-fill this.",
        examples=["https://api.openai.com/v1"])
    api_key: str = Field(default="", max_length=500,
        description="API key. Encrypted at rest using Fernet (PBKDF2-SHA256). Never returned in responses.",
        examples=["sk-proj-3aF8kD9mN2pQ7rX5vB1wJ4cL6nM0zS8t"])
    models: list[str] = Field(default=[], max_length=200,
        description="Pre-fetched model list. Use POST /providers/test to discover available models.",
        examples=[["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"]])
    is_active: bool = Field(default=True,
        description="When false, the provider's models won't appear in the model selector.")


class ProviderTest(BaseModel):
    base_url: str = Field(..., max_length=500,
        description="Provider API base URL to test.",
        examples=["https://generativelanguage.googleapis.com/v1beta"])
    api_key: str = Field(default="", max_length=500,
        description="API key for auth. Not required for Ollama (local).",
        examples=["AIzaSyCb8mN3pQ7rX5vB1wJ4cL6nM0zS8tD9fG2hK"])
    provider_type: str = Field(default="custom", max_length=50,
        description="Provider type — determines the auth header format.",
        examples=["gemini"])


class ProviderResponse(BaseModel):
    """Provider configuration (API key is masked)."""
    id: str = Field(description="UUID.")
    name: str = Field(description="Display name.")
    provider_type: str = Field(description="Provider type.")
    base_url: str = Field(description="Base URL.")
    models: list[str] = Field(description="Discovered models.")
    is_active: bool = Field(description="Active flag.")
    api_key: str = Field(description="Masked API key (first 4 + last 4 chars shown).",
        examples=["sk-p...S8t"])
    created_at: str = Field(description="ISO-8601 timestamp.")


class ProviderTestResponse(BaseModel):
    """Result of testing a provider connection."""
    ok: bool = Field(description="Whether the connection succeeded.")
    models: list[str] = Field(description="List of available model IDs.",
        examples=[["gemini-2.0-flash", "gemini-2.0-pro", "gemini-1.5-pro"]])


# ── Tools ────────────────────────────────────────────────────────

class ToolCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255,
        description="Unique tool name used in agent tool selectors.",
        examples=["slack_notifier"])
    description: str = Field(default="", max_length=500,
        description="Description shown to the LLM when deciding whether to call this tool.",
        examples=["Sends a message to a Slack channel via webhook."])
    tool_type: str = Field(default="http", max_length=50,
        description="Tool implementation type: http | python | webhook.",
        examples=["http"])
    config: dict = Field(default={},
        description="Tool configuration. For HTTP: url, method, headers, parameters. For Python: code.",
        examples=[{"url": "https://hooks.slack.com/services/T00/B00/xxx", "method": "POST",
                    "parameters": [{"name": "message", "type": "string", "description": "Text to send"}]}])


class ToolResponse(BaseModel):
    """Tool definition — built-in or custom."""
    id: str = Field(description="UUID (null for built-in tools).")
    name: str = Field(description="Tool name.")
    description: str = Field(description="Tool description.")
    tool_type: str = Field(description="Tool type.")
    config: dict = Field(description="Tool configuration.")
    is_builtin: bool = Field(description="True for system tools (web_search, calculator, etc.).")
    created_at: str = Field(description="ISO-8601 timestamp.")


# ── Channels ─────────────────────────────────────────────────────

class ChannelCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255,
        description="Display name for this channel.",
        examples=["My Telegram Bot"])
    type: str = Field(default="telegram", max_length=50,
        description="Channel type (currently only telegram).",
        examples=["telegram"])
    config: dict = Field(default={},
        description="Channel-specific config. For Telegram: bot_token, webhook_url, workflow_id.",
        examples=[{"bot_token": "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
                    "workflow_id": "550e8400-e29b-41d4-a716-446655440001"}])


class ChannelResponse(BaseModel):
    """Messaging channel configuration."""
    id: str = Field(description="UUID.")
    name: str = Field(description="Display name.")
    type: str = Field(description="Channel type.")
    config: dict = Field(description="Channel config.")
    created_at: str = Field(description="ISO-8601 timestamp.")


# ── Generic ──────────────────────────────────────────────────────

class DeleteResponse(BaseModel):
    """Standard delete confirmation."""
    ok: bool = Field(description="Always true on success.", examples=[True])
