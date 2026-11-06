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
