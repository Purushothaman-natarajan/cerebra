"""Pydantic schemas for API request/response serialization with input validation."""

from pydantic import BaseModel, Field


class AgentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    role: str = Field(..., min_length=1, max_length=255)
    system_prompt: str = Field(..., min_length=1, max_length=10000)
    model: str = Field(default="gemini-2.0-flash", max_length=100)
    tools: list[str] = Field(default=[], max_length=50)
    channel_id: str | None = None
    memory_enabled: bool = False
    max_iterations: int = Field(default=10, ge=1, le=100)
    guardrails: dict = Field(default={})


class AgentUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    role: str | None = Field(None, min_length=1, max_length=255)
    system_prompt: str | None = Field(None, min_length=1, max_length=10000)
    model: str | None = Field(None, max_length=100)
    tools: list[str] | None = Field(None, max_length=50)
    channel_id: str | None = None
    memory_enabled: bool | None = None
    max_iterations: int | None = Field(None, ge=1, le=100)
    guardrails: dict | None = None


class AgentResponse(BaseModel):
    id: str
    name: str
    role: str
    system_prompt: str
    model: str
    tools: list[str]
    channel_id: str | None
    memory_enabled: bool
    max_iterations: int
    guardrails: dict
    created_at: str
    updated_at: str

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


class WorkflowCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    nodes: list[dict] = Field(default=[], max_length=200)
    edges: list[dict] = Field(default=[], max_length=500)
    trigger: dict = Field(default={"type": "manual", "config": {}})


class WorkflowUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    nodes: list[dict] | None = Field(None, max_length=200)
    edges: list[dict] | None = Field(None, max_length=500)
    trigger: dict | None = None


class WorkflowResponse(BaseModel):
    id: str
    name: str
    nodes: list[dict]
    edges: list[dict]
    trigger: dict
    created_at: str
    updated_at: str

    @classmethod
    def from_orm(cls, wf) -> "WorkflowResponse":
        return cls(
            id=str(wf.id), name=wf.name, nodes=wf.nodes, edges=wf.edges,
            trigger=wf.trigger, created_at=wf.created_at.isoformat(),
            updated_at=wf.updated_at.isoformat(),
        )


class RunCreate(BaseModel):
    workflow_id: str
    input: str = Field(default="", max_length=50000)


class RunResponse(BaseModel):
    id: str
    workflow_id: str
    status: str
    started_at: str | None
    finished_at: str | None

    @classmethod
    def from_orm(cls, run) -> "RunResponse":
        return cls(
            id=str(run.id), workflow_id=str(run.workflow_id), status=run.status,
            started_at=run.started_at.isoformat() if run.started_at else None,
            finished_at=run.finished_at.isoformat() if run.finished_at else None,
        )


class RunEventResponse(BaseModel):
    id: int
    run_id: str
    timestamp: str
    type: str
    agent_id: str
    payload: dict

    @classmethod
    def from_orm(cls, event) -> "RunEventResponse":
        return cls(
            id=event.id, run_id=str(event.run_id),
            timestamp=event.timestamp.isoformat(), type=event.type,
            agent_id=event.agent_id, payload=event.payload,
        )
