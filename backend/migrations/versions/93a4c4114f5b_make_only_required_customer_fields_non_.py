"""make only required customer fields non-nullable

Revision ID: 93a4c4114f5b
Revises: 4f7db6876245
Create Date: 2025-07-03 15:39:46.415831

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '93a4c4114f5b'
down_revision: Union[str, Sequence[str], None] = '4f7db6876245'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('customers', 'contract_type',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.alter_column('customers', 'license_type',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.alter_column('customers', 'license_start',
               existing_type=sa.DATE(),
               nullable=False)
    op.alter_column('customers', 'license_end',
               existing_type=sa.DATE(),
               nullable=False)
    op.alter_column('customers', 'solution',
               existing_type=sa.VARCHAR(),
               nullable=True)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('customers', 'solution',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.alter_column('customers', 'license_end',
               existing_type=sa.DATE(),
               nullable=True)
    op.alter_column('customers', 'license_start',
               existing_type=sa.DATE(),
               nullable=True)
    op.alter_column('customers', 'license_type',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.alter_column('customers', 'contract_type',
               existing_type=sa.VARCHAR(),
               nullable=True)
    # ### end Alembic commands ###
