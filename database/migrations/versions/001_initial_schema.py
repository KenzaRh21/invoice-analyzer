"""Initial schema for users, invoices, and invoice_items

Revision ID: 001_initial
Revises: 
Create Date: 2026-09-21 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False)
    )
    op.create_index('ix_users_email', 'users', ['email'])

    # Invoices table
    op.create_table(
        'invoices',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=512), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='UPLOADED'),
        sa.Column('invoice_number', sa.String(length=100), nullable=True),
        sa.Column('invoice_date', sa.String(length=50), nullable=True),
        sa.Column('due_date', sa.String(length=50), nullable=True),
        sa.Column('supplier_name', sa.String(length=255), nullable=True),
        sa.Column('supplier_tax_id', sa.String(length=100), nullable=True),
        sa.Column('supplier_address', sa.Text(), nullable=True),
        sa.Column('customer_name', sa.String(length=255), nullable=True),
        sa.Column('customer_tax_id', sa.String(length=100), nullable=True),
        sa.Column('currency', sa.String(length=10), server_default='MAD'),
        sa.Column('subtotal', sa.Float(), server_default='0.0'),
        sa.Column('tax_amount', sa.Float(), server_default='0.0'),
        sa.Column('total_amount', sa.Float(), server_default='0.0'),
        sa.Column('payment_status', sa.String(length=32), server_default='UNPAID'),
        sa.Column('raw_text', sa.Text(), nullable=True),
        sa.Column('confidence_score', sa.Float(), server_default='0.0'),
        sa.Column('processing_time_ms', sa.Integer(), server_default='0'),
        sa.Column('provider_used', sa.String(length=50), server_default='mock'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False)
    )
    op.create_index('ix_invoices_user_id', 'invoices', ['user_id'])
    op.create_index('ix_invoices_invoice_number', 'invoices', ['invoice_number'])
    op.create_index('ix_invoices_supplier_name', 'invoices', ['supplier_name'])

    # Invoice Items table
    op.create_table(
        'invoice_items',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('invoice_id', sa.String(length=36), sa.ForeignKey('invoices.id', ondelete='CASCADE'), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=False),
        sa.Column('quantity', sa.Float(), server_default='1.0', nullable=False),
        sa.Column('unit_price', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('tax_rate', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('total', sa.Float(), server_default='0.0', nullable=False)
    )
    op.create_index('ix_invoice_items_invoice_id', 'invoice_items', ['invoice_id'])

def downgrade() -> None:
    op.drop_table('invoice_items')
    op.drop_table('invoices')
    op.drop_table('users')
