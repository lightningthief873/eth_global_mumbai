"""
Invoice / payment-link orchestration for the USDT checkout flow.

A merchant (via SDK/API) creates an invoice; a customer pays it in USDT through the
PaymentHub; the merchant can refund it. State is tracked in the DB and mirrored on-chain
(the PaymentHub events are the customer-verifiable receipt). Merchants are notified by a
fire-and-forget webhook.
"""

import secrets
from datetime import datetime, timezone
from typing import Optional

import httpx
from sqlmodel import Session, select

from models import Invoice, Merchant
from services import usdt_service, wallet_service, chain_service

EXPLORER = "https://explorer.testnet.whitechain.io"


def create_merchant(name: str, session: Session, webhook_url: Optional[str] = None) -> Merchant:
    """Register a merchant with a custodial payout wallet and an API key."""
    address = wallet_service.create_wallet(session)
    # Give the merchant a small WBT gas buffer so it can sign refunds.
    try:
        chain_service.top_up_wallet(address, 0.02)
    except Exception:
        pass
    merchant = Merchant(
        api_key="sk_" + secrets.token_hex(16),
        name=name,
        address=address,
        webhook_url=webhook_url,
    )
    session.add(merchant)
    session.commit()
    session.refresh(merchant)
    return merchant


def get_merchant(api_key: str, session: Session) -> Optional[Merchant]:
    return session.get(Merchant, api_key)


def create_invoice(
    merchant: Merchant,
    amount_units: int,
    session: Session,
    description: Optional[str] = None,
    order_id: Optional[str] = None,
    due_date: Optional[datetime] = None,
) -> Invoice:
    inv = Invoice(
        id="inv_" + secrets.token_hex(8),
        merchant_api_key=merchant.api_key,
        merchant_address=merchant.address,
        amount_units=amount_units,
        description=description,
        order_id=order_id,
        due_date=due_date,
    )
    session.add(inv)
    session.commit()
    session.refresh(inv)
    return inv


def _serialize(inv: Invoice) -> dict:
    return {
        "id": inv.id,
        "status": inv.status,
        "amount_units": inv.amount_units,
        "amount_usdt": usdt_service.from_units(inv.amount_units),
        "refunded_units": inv.refunded_units,
        "refunded_usdt": usdt_service.from_units(inv.refunded_units),
        "currency": "USDT",
        "description": inv.description,
        "order_id": inv.order_id,
        "merchant_address": inv.merchant_address,
        "payer_address": inv.payer_address,
        "tx_hash": inv.tx_hash,
        "refund_tx_hash": inv.refund_tx_hash,
        "explorer_url": f"{EXPLORER}/tx/{inv.tx_hash}" if inv.tx_hash else None,
        "refund_explorer_url": f"{EXPLORER}/tx/{inv.refund_tx_hash}" if inv.refund_tx_hash else None,
        "due_date": inv.due_date.isoformat() if inv.due_date else None,
        "created_at": inv.created_at.isoformat(),
        "paid_at": inv.paid_at.isoformat() if inv.paid_at else None,
    }


def _fire_webhook(merchant: Optional[Merchant], event: str, inv: Invoice) -> None:
    if not merchant or not merchant.webhook_url:
        return
    try:
        httpx.post(
            merchant.webhook_url,
            json={"event": event, "invoice": _serialize(inv)},
            timeout=4.0,
        )
    except Exception:
        pass  # fire-and-forget; webhook delivery is best-effort


def settle(inv: Invoice, payer_address: str, session: Session) -> dict:
    """Settle an open invoice: relayer submits the gasless USDT payWithPermit."""
    if inv.status != "open":
        raise ValueError(f"Invoice is {inv.status}, cannot be paid")

    payer = wallet_service.load_signer(payer_address, session)
    iid = usdt_service.invoice_id_bytes(inv.id)
    tx_hash = usdt_service.pay_with_permit(payer, iid, inv.merchant_address, inv.amount_units)

    inv.status = "paid"
    inv.payer_address = payer_address
    inv.tx_hash = tx_hash
    inv.paid_at = datetime.now(timezone.utc)
    session.add(inv)
    session.commit()
    session.refresh(inv)

    _fire_webhook(get_merchant(inv.merchant_api_key, session), "invoice.paid", inv)
    return _serialize(inv)


def refund(inv: Invoice, amount_units: int, session: Session) -> dict:
    """Merchant-signed full/partial refund back to the original payer."""
    if inv.status not in ("paid", "partially_refunded"):
        raise ValueError(f"Invoice is {inv.status}, cannot be refunded")
    if amount_units <= 0 or inv.refunded_units + amount_units > inv.amount_units:
        raise ValueError("Invalid refund amount")

    merchant = get_merchant(inv.merchant_api_key, session)
    merchant_signer = wallet_service.load_signer(inv.merchant_address, session)
    iid = usdt_service.invoice_id_bytes(inv.id)
    tx_hash = usdt_service.refund(merchant_signer, iid, amount_units)

    inv.refunded_units += amount_units
    inv.refund_tx_hash = tx_hash
    inv.status = "refunded" if inv.refunded_units >= inv.amount_units else "partially_refunded"
    session.add(inv)
    session.commit()
    session.refresh(inv)

    _fire_webhook(merchant, "invoice.refunded", inv)
    return _serialize(inv)


def serialize(inv: Invoice) -> dict:
    return _serialize(inv)
