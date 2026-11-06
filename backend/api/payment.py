from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session, select

from db import get_session
from models import Enrollment, Invoice, Payment
from services import payment_service, usdt_service, invoice_service
import secrets

router = APIRouter()


def _is_out_of_funds(e: Exception) -> bool:
    s = str(e).lower()
    return "outoffunds" in s or "insufficient funds" in s or "-32003" in s

@router.post("/charge")
async def charge(
    merchant: str = Form(...),
    amount_wbt: str = Form(...),
    address: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session),
):
    if address:
        customer_address = address
    elif image:
        image_bytes = await image.read()
        result = payment_service.recognize(image_bytes, session)
        if not result:
            raise HTTPException(404, "Face not recognized — customer not enrolled")
        customer_address, _ = result
    else:
        raise HTTPException(400, "Provide 'address' or 'image'")

    enr = session.exec(
        select(Enrollment).where(Enrollment.customer_address == customer_address)
    ).first()
    if not enr:
        raise HTTPException(404, f"Address {customer_address} is not enrolled")

    try:
        amount_wei = payment_service.wbt_to_wei(amount_wbt)
    except Exception:
        raise HTTPException(422, f"Invalid amount_wbt: {amount_wbt}")

    if amount_wei <= 0:
        raise HTTPException(422, "amount_wbt must be positive")

    try:
        receipt = payment_service.charge(customer_address, merchant, amount_wei, session)
    except Exception as e:
        if _is_out_of_funds(e):
            raise HTTPException(
                402,
                f"Customer wallet {customer_address} has insufficient WBT for gas + amount. "
                f"Fund this address with test WBT and try again.",
            )
        raise HTTPException(502, f"Payment failed on-chain: {e}")
    receipt["explorer_url"] = f"https://explorer.testnet.whitechain.io/tx/{receipt['tx_hash']}"
    return receipt


@router.post("/charge-usdt")
async def charge_usdt(
    merchant: str = Form(...),
    amount_usdt: str = Form(...),
    address: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session),
):
    """Terminal USDT charge: recognize a face (or address) and settle USDT to the
    merchant via PaymentHub (gasless for the payer, relayer sponsors gas)."""
    if address:
        customer_address = address
    elif image:
        image_bytes = await image.read()
        result = payment_service.recognize(image_bytes, session)
        if not result:
            raise HTTPException(404, "Face not recognized — customer not enrolled")
        customer_address, _ = result
    else:
        raise HTTPException(400, "Provide 'address' or 'image'")

    enr = session.exec(
        select(Enrollment).where(Enrollment.customer_address == customer_address)
    ).first()
    if not enr:
        raise HTTPException(404, f"Address {customer_address} is not enrolled")

    try:
        amount_units = usdt_service.to_units(amount_usdt)
    except Exception:
        raise HTTPException(422, f"Invalid amount_usdt: {amount_usdt}")
    if amount_units <= 0:
        raise HTTPException(422, "amount_usdt must be positive")

    if usdt_service.usdt_balance(customer_address) < amount_units:
        raise HTTPException(402, "Insufficient USDT balance in customer wallet")

    # One-shot invoice bound to this terminal sale.
    inv = Invoice(
        id="pos_" + secrets.token_hex(8),
        merchant_api_key="terminal",
        merchant_address=merchant,
        amount_units=amount_units,
        description="Terminal sale",
    )
    session.add(inv)
    session.commit()
    session.refresh(inv)

    try:
        data = invoice_service.settle(inv, customer_address, session)
    except ValueError as e:
        raise HTTPException(409, str(e))
    except Exception as e:
        if _is_out_of_funds(e):
            raise HTTPException(
                402,
                "Relayer is out of WBT gas. Fund the relayer wallet "
                "0x302478941faCdb2c9Dbb412B60e35354F0AF0027 with test WBT and try again.",
            )
        raise HTTPException(502, f"USDT settlement failed on-chain: {e}")

    return {
        "asset": "USDT",
        "tx_hash": data["tx_hash"],
        "amount_units": str(amount_units),
        "amount_usdt": data["amount_usdt"],
        "customer": customer_address,
        "merchant": merchant,
        "explorer_url": data["explorer_url"],
    }


@router.get("/history/{address}")
def payment_history(address: str, session: Session = Depends(get_session)):
    payments = session.exec(
        select(Payment).where(Payment.customer_address == address)
    ).all()
    return [
        {
            "id": p.id,
            "merchant": p.merchant_address,
            "amount_wei": str(p.amount_wei),
            "amount_wbt": str(round(p.amount_wei / 1e18, 6)),
            "pwsr_wei": str(p.pwsr_wei),
            "pwsr": str(round(p.pwsr_wei / 1e18, 6)),
            "tx_hash": p.tx_hash,
            "explorer_url": f"https://explorer.testnet.whitechain.io/tx/{p.tx_hash}",
            "created_at": p.created_at.isoformat(),
        }
        for p in payments
    ]
