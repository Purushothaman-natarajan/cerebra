# API Documentation

## Overview

Base URL: `http://localhost:8000` (development) or `https://your-domain.com` (production)

- All endpoints except `/health` and `/docs` require `Authorization: Bearer <key>` if `CEREBRA_API_KEY` is set.
- Request bodies are JSON with `Content-Type: application/json`.
- Response format is JSON.
- Errors return `{"detail": "..."}` with appropriate HTTP status codes.

## Authentication

```bash
# When CEREBRA_API_KEY is set
curl -H "Authorization: Bearer your-api-key" http://localhost:8000/agents
```

## Endpoints

### System

#### `GET /health`
Health check with dependency status.

**Response:**
```json
{
  "status": "healthy",
  "service": "cerebra-backend",
  "version": "0.2.0",
  "timestamp": "2026-05-14T12:00:00+00:00",
  "dependencies": {
    "database": "healthy"
  }
}
```

### Agents

#### `GET /agents`
List all configured agents.

**Response:** `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "ResearchAgent",
    "role": "research_assistant",
    "system_prompt": "You are a research assistant...",
    "model": "gemini-2.0-flash",
    "tools": ["web_search", "calculator"],
    "channel_id": null,
    "memory_enabled": false,
    "max_iterations": 10,
    "guardrails": {"blocked_topics": []},
    "created_at": "2026-05-13T12:00:00+00:00",
    "updated_at": "2026-05-13T12:00:00+00:00"
  }
]
```

#### `POST /agents`
Create a new agent.

**Request:**
```json
{
  "name": "ResearchAgent",
  "role": "research_assistant",
  "system_prompt": "You are a research assistant...",
  "model": "gemini-2.0-flash",
  "tools": ["web_search", "calculator"],
  "memory_enabled": false,
  "max_iterations": 10,
  "guardrails": {"blocked_topics": []}
}
```

**Response:** `201 Created`

#### `GET /agents/{id}`
Get a single agent by UUID.

**Response:** `200 OK` or `404 Not Found`

#### `PATCH /agents/{id}`
Update an existing agent. Only provided fields are changed.

**Response:** `200 OK`

#### `DELETE /agents/{id}`
Delete an agent.

**Response:** `200 OK`

#### `POST /agents/{id}/test`
Test an agent with sample input.

**Request:**
```json
{
  "input": "What are the latest trends in AI?"
}
```

**Response:**
```json
{
  "ok": true,
  "output": "Here are the latest trends in AI...",
  "prompt_tokens": 150,
  "completion_tokens": 300,
  "total_tokens": 450,
  "cost": 0.000135,
  "duration_ms": 1234
}
```

#### `GET /agents/export`
Export all agents as JSON array.

#### `POST /agents/import`
Import agents from JSON array.

### Agent Templates

#### `GET /agent-templates`
List all agent templates.

#### `POST /agent-templates`
Create a custom agent template.

#### `DELETE /agent-templates/{id}`
Delete a non-default agent template.

### Workflows

#### `GET /workflows`
List all workflow definitions.

#### `POST /workflows`
Create a new workflow.

**Request:**
```json
{
  "name": "Research & Report",
  "nodes": [{"id": "researcher", "type": "agent", "config": {"system_prompt": "...", "tools": ["web_search"]}}],
  "edges": [{"source": "researcher", "target": "writer", "condition": null}],
  "trigger": {"type": "manual", "config": {}}
}
```

#### `GET /workflows/{id}`
Get workflow by UUID.

#### `PATCH /workflows/{id}`
Update workflow.

#### `DELETE /workflows/{id}`
Delete a single workflow.

#### `DELETE /workflows`
Delete ALL workflows and associated data. Use with caution.

### Runs

#### `GET /runs`
List all runs (newest first).

#### `POST /runs`
Trigger a workflow execution.

**Request:**
```json
{
  "workflow_id": "550e8400-e29b-41d4-a716-446655440001",
  "input": "What's the latest in agentic AI frameworks?"
}
```

**Response:** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "workflow_id": "550e8400-e29b-41d4-a716-446655440001",
  "status": "running",
  "started_at": "2026-05-13T12:00:00+00:00",
  "finished_at": null,
  "prompt_tokens": 0,
  "completion_tokens": 0,
  "total_tokens": 0,
  "cost": 0.0
}
```

> **Note:** The run executes asynchronously. Poll `GET /runs/{id}` for status updates.

#### `GET /runs/{id}`
Get a single run with token usage and cost.

#### `GET /runs/{id}/events`
Get all events for a run.

#### `DELETE /runs`
Clear ALL run history. Cannot be undone.

### WebSocket

#### `ws://host/ws/runs/{run_id}`
Stream run events in real-time.

**Query params:** `?token=<api_key>` if CEREBRA_API_KEY is set.

**Message format:**
```json
{
  "type": "agent_start",
  "timestamp": "2026-05-13T12:00:01+00:00",
  "agent_id": "researcher",
  "payload": {"model": "gemini-2.0-flash"}
}
```

### Providers

#### `GET /providers`
List configured LLM providers with masked API keys.

#### `POST /providers`
Add a new LLM provider.

**Request:**
```json
{
  "name": "My OpenAI",
  "provider_type": "openai",
  "base_url": "https://api.openai.com/v1",
  "api_key": "sk-proj-3aF8kD9mN2pQ7rX5vB1wJ4cL6nM0zS8t",
  "models": ["gpt-4o", "gpt-4o-mini"]
}
```

#### `DELETE /providers/{id}`
Remove a provider.

#### `GET /providers/models`
Get all models from active providers.

**Response:**
```json
[
  {"model": "gpt-4o", "provider_name": "My OpenAI", "provider_type": "openai", "provider_id": "550e..."}
]
```

#### `POST /providers/test`
Test a provider connection by fetching available models.

**Request:**
```json
{
  "base_url": "https://api.openai.com/v1",
  "api_key": "sk-...",
  "provider_type": "openai"
}
```

**Response:**
```json
{
  "ok": true,
  "models": ["gpt-4o", "gpt-4o-mini"]
}
```

#### `GET /providers/presets`
Get preset configurations for common providers.

### Tools

#### `GET /tools`
List all tools (built-in + custom).

#### `POST /tools`
Create a custom tool.

#### `POST /tools/test`
Test a tool by name (built-in) or UUID (custom).

**Request:**
```json
{
  "tool_id": "calculator",
  "input": "2 + 2"
}
```

**Response:**
```json
{
  "ok": true,
  "output": "4",
  "duration_ms": 5
}
```

#### `DELETE /tools/{id}`
Delete a custom tool.

#### `GET /tools/export`
Export custom tools as JSON.

#### `POST /tools/import`
Import custom tools from JSON.

### Channels

#### `GET /channels`
List configured channels.

#### `POST /channels`
Create a new channel (Telegram).

#### `POST /channels/webhook/telegram`
Telegram webhook receiver (public, no auth).

### Human-in-the-Loop

#### `GET /runs/{run_id}/human-request`
Get pending human approval request.

#### `POST /runs/{run_id}/human-response`
Submit human response (approve/reject).

### Workflow Templates

#### `GET /templates`
List workflow templates loaded from disk (cached 60s).

### Logs

#### `POST /logs`
Ingest a frontend log entry.

**Request:**
```json
{
  "timestamp": "2026-05-14T12:00:00+00:00",
  "level": "info",
  "source": "frontend",
  "component": "ToolTestDialog",
  "action": "tool_test",
  "message": "Tool test started",
  "run_id": null,
  "details": {"tool": "web_search", "input": "query"}
}
```

#### `GET /logs`
Query persisted logs.

**Query params:** `run_id`, `start_ts`, `end_ts`, `limit` (default 200)

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad request (invalid input, missing fields) |
| 401 | Unauthorized (missing/invalid API key) |
| 404 | Resource not found |
| 413 | Request body too large (>5 MB) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## Rate Limiting

| Path | Limit |
|------|-------|
| `/runs` | 10 requests per 60 seconds |
| All others | 100 requests per 60 seconds |
