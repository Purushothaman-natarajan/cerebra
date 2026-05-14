"""Add token and cost tracking columns to runs table.

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-14
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("runs", sa.Column("prompt_tokens", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("runs", sa.Column("completion_tokens", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("runs", sa.Column("total_tokens", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("runs", sa.Column("cost", sa.Float(), nullable=False, server_default="0.0"))


def downgrade() -> None:
    op.drop_column("runs", "cost")
    op.drop_column("runs", "total_tokens")
    op.drop_column("runs", "completion_tokens")
    op.drop_column("runs", "prompt_tokens")
