from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session, select

from db import get_session
from models import Enrollment, Payment
from services import payment_service

router = APIRouter()


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

    receipt = payment_service.charge(customer_address, merchant, amount_wei, session)
    receipt["explorer_url"] = f"https://explorer.testnet.whitechain.io/tx/{receipt['tx_hash']}"
    return receipt


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
