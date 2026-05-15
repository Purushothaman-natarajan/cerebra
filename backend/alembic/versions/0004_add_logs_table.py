"""Add logs table for persisted structured logging.

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-15
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("run_id", sa.Uuid(), nullable=True),
        sa.Column("timestamp", sa.DateTime(), nullable=False),
        sa.Column("level", sa.String(20), nullable=False, server_default="info"),
        sa.Column("source", sa.String(100), nullable=False, server_default="frontend"),
        sa.Column("component", sa.String(255), nullable=True),
        sa.Column("action", sa.String(255), nullable=True),
        sa.Column("message", sa.String(2000), nullable=True),
        sa.Column("details", sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_logs_run_id", "logs", ["run_id"])
    op.create_index("ix_logs_timestamp", "logs", ["timestamp"])


def downgrade() -> None:
    op.drop_index("ix_logs_timestamp")
    op.drop_index("ix_logs_run_id")
    op.drop_table("logs")
