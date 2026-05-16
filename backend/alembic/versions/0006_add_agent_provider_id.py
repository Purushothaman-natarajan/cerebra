"""Add provider_id column to agents table.

Revision ID: 0006
Revises: 0005
Create Date: 2026-05-16
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("agents", sa.Column("provider_id", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("agents", "provider_id")
