from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field


class Customer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    address: str = Field(unique=True, index=True)
    alias: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Wallet(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    address: str = Field(unique=True, index=True)
    # AES-GCM encrypted private key stored as hex strings
    enc_privkey_hex: str
    iv_hex: str


class Enrollment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_address: str = Field(index=True)
    # AES-GCM encrypted face embedding (float32 array) stored as hex
    enc_embedding_hex: str
    iv_hex: str
    # keccak256(embedding || salt) registered on-chain in BiometricRegistry
    commitment: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Payment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_address: str = Field(index=True)
    merchant_address: str
    amount_wei: int
    pwsr_wei: int
    tx_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Merchant(SQLModel, table=True):
    # api_key is the merchant's integration credential
    api_key: str = Field(primary_key=True)
    name: str
    address: str = Field(index=True)  # custodial wallet that receives USDT
    webhook_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Invoice(SQLModel, table=True):
    # id is the public invoice/payment-link id, e.g. "inv_ab12cd34"
    id: str = Field(primary_key=True)
    merchant_api_key: str = Field(index=True)
    merchant_address: str
    amount_units: int                         # USDT base units (6 decimals)
    description: Optional[str] = None
    order_id: Optional[str] = None            # merchant's own order reference
    status: str = Field(default="open", index=True)  # open|paid|refunded|partially_refunded
    payer_address: Optional[str] = None
    refunded_units: int = 0
    tx_hash: Optional[str] = None
    refund_tx_hash: Optional[str] = None
    due_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    paid_at: Optional[datetime] = None
