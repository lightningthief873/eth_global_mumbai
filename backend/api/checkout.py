from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from pydantic import BaseModel
from sqlmodel import Session, select

from db import get_session
from models import Invoice, Merchant
from services import invoice_service, usdt_service, payment_service

router = APIRouter()


# ---------------------------------------------------------------------------
# Merchant onboarding
# ---------------------------------------------------------------------------

class MerchantCreate(BaseModel):
    name: str
    webhook_url: Optional[str] = None


@router.post("/merchants")
def create_merchant(req: MerchantCreate, session: Session = Depends(get_session)):
    m = invoice_service.create_merchant(req.name, session, webhook_url=req.webhook_url)
    return {"api_key": m.api_key, "name": m.name, "address": m.address, "webhook_url": m.webhook_url}


def _auth(x_api_key: Optional[str], session: Session) -> Merchant:
    if not x_api_key:
        raise HTTPException(401, "Missing X-API-Key")
    m = invoice_service.get_merchant(x_api_key, session)
    if not m:
        raise HTTPException(401, "Invalid API key")
    return m


# ---------------------------------------------------------------------------
# Invoices
# ---------------------------------------------------------------------------

class InvoiceCreate(BaseModel):
    amount_usdt: str
    description: Optional[str] = None
    order_id: Optional[str] = None
    due_date: Optional[datetime] = None


@router.post("/invoices")
def create_invoice(
    req: InvoiceCreate,
    x_api_key: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
):
    merchant = _auth(x_api_key, session)
    try:
        amount_units = usdt_service.to_units(req.amount_usdt)
    except Exception:
        raise HTTPException(422, "Invalid amount_usdt")
    if amount_units <= 0:
        raise HTTPException(422, "amount_usdt must be positive")

    inv = invoice_service.create_invoice(
        merchant, amount_units, session,
        description=req.description, order_id=req.order_id, due_date=req.due_date,
    )
    data = invoice_service.serialize(inv)
    data["pay_url"] = f"/pay/{inv.id}"
    return data


@router.get("/invoices/{invoice_id}")
def get_invoice(invoice_id: str, session: Session = Depends(get_session)):
    inv = session.get(Invoice, invoice_id)
    if not inv:
        raise HTTPException(404, "Invoice not found")
    return invoice_service.serialize(inv)


@router.get("/merchants/invoices")
def list_invoices(
    x_api_key: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
):
    merchant = _auth(x_api_key, session)
    rows = session.exec(
        select(Invoice).where(Invoice.merchant_api_key == merchant.api_key)
    ).all()
    rows.sort(key=lambda i: i.created_at, reverse=True)
    return [invoice_service.serialize(i) for i in rows]


# ---------------------------------------------------------------------------
# Payment — face-express (custodial) or explicit payer address
# ---------------------------------------------------------------------------

@router.post("/invoices/{invoice_id}/pay")
async def pay_invoice(
    invoice_id: str,
    payer_address: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session),
):
    inv = session.get(Invoice, invoice_id)
    if not inv:
        raise HTTPException(404, "Invoice not found")
    if inv.status != "open":
        raise HTTPException(409, f"Invoice already {inv.status}")

    # Resolve payer: face recognition (express) or explicit custodial address.
    if image is not None:
        image_bytes = await image.read()
        result = payment_service.recognize(image_bytes, session)
        if not result:
            raise HTTPException(404, "Face not recognized \u2014 enroll first")
        payer = result[0]
    elif payer_address:
        payer = payer_address
    else:
        raise HTTPException(400, "Provide a face image or payer_address")

    # Ensure the payer custodial wallet can cover the amount.
    if usdt_service.usdt_balance(payer) < inv.amount_units:
        raise HTTPException(402, "Insufficient USDT balance in payer wallet")

    try:
        return invoice_service.settle(inv, payer, session)
    except ValueError as e:
        raise HTTPException(409, str(e))


# ---------------------------------------------------------------------------
# Refund (merchant, one click, full or partial)
# ---------------------------------------------------------------------------

class RefundRequest(BaseModel):
    amount_usdt: Optional[str] = None  # omit for full refund of remaining


@router.post("/invoices/{invoice_id}/refund")
def refund_invoice(
    invoice_id: str,
    req: RefundRequest,
    x_api_key: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
):
    merchant = _auth(x_api_key, session)
    inv = session.get(Invoice, invoice_id)
    if not inv:
        raise HTTPException(404, "Invoice not found")
    if inv.merchant_api_key != merchant.api_key:
        raise HTTPException(403, "Not your invoice")

    remaining = inv.amount_units - inv.refunded_units
    amount_units = usdt_service.to_units(req.amount_usdt) if req.amount_usdt else remaining
    try:
        return invoice_service.refund(inv, amount_units, session)
    except ValueError as e:
        raise HTTPException(409, str(e))
