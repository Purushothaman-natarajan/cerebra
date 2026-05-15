"""Add conversation_memory table for persistent agent memory.

Revision ID: 0005
Revises: 0004
Create Date: 2026-05-15
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "conversation_memory",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("agent_id", sa.String(255), nullable=False),
        sa.Column("messages", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_conversation_memory_agent_id", "conversation_memory", ["agent_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_conversation_memory_agent_id")
    op.drop_table("conversation_memory")
