import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workflow import WorkflowDef


async def list_workflows(db: AsyncSession) -> list[WorkflowDef]:
    result = await db.execute(select(WorkflowDef).order_by(WorkflowDef.created_at.desc()))
    return list(result.scalars().all())


async def get_workflow(db: AsyncSession, workflow_id: str) -> WorkflowDef | None:
    result = await db.execute(select(WorkflowDef).where(WorkflowDef.id == uuid.UUID(workflow_id)))
    return result.scalar_one_or_none()


async def create_workflow(db: AsyncSession, data: dict) -> WorkflowDef:
    wf = WorkflowDef(**data)
    db.add(wf)
    await db.flush()
    return wf


async def update_workflow(db: AsyncSession, workflow_id: str, data: dict) -> WorkflowDef | None:
    wf = await get_workflow(db, workflow_id)
    if not wf:
        return None
    for key, value in data.items():
        if value is not None:
            setattr(wf, key, value)
    await db.flush()
    return wf


async def delete_workflow(db: AsyncSession, workflow_id: str) -> bool:
    wf = await get_workflow(db, workflow_id)
    if not wf:
        return False
    await db.delete(wf)
    await db.flush()
    return True
