from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session, select

from ..db import get_session
from ..models import Customer, Enrollment
from ..services import payment_service, wallet_service, chain_service
from ..config import settings

router = APIRouter()


@router.post("/enroll")
async def enroll_face(
    image: UploadFile = File(...),
    alias: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    session: Session = Depends(get_session),
):
    """
    Enroll a face. Creates a new custodial wallet unless an address is supplied.
    Returns: address, commitment, tx_hash (mock registry call).
    """
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(400, "Empty image")

    # Create wallet if needed
    if not address:
        address = wallet_service.create_wallet(session)
        # Top up gas buffer (mock)
        chain_service.top_up_wallet(address, settings.gas_buffer_wbt)

    # Persist customer row
    existing_customer = session.exec(select(Customer).where(Customer.address == address)).first()
    if not existing_customer:
        session.add(Customer(address=address, alias=alias))
        session.commit()

    # Enroll embedding
    comm = payment_service.enroll(image_bytes, address, session)

    # Mock BiometricRegistry.enroll() on-chain call
    tx_hash = chain_service.mock_tx_hash()

    return {
        "address": address,
        "commitment": comm,
        "tx_hash": tx_hash,
        "explorer_url": f"https://explorer.testnet.whitechain.io/tx/{tx_hash}",
    }


@router.post("/recognize")
async def recognize_face(
    image: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    image_bytes = await image.read()
    result = payment_service.recognize(image_bytes, session)
    if not result:
        raise HTTPException(404, "Face not recognized")
    address, distance = result
    return {"address": address, "distance": round(distance, 4), "confidence": round(1 - distance, 4)}


@router.get("/status/{address}")
def enrollment_status(address: str, session: Session = Depends(get_session)):
    enr = session.exec(select(Enrollment).where(Enrollment.customer_address == address)).first()
    return {"address": address, "enrolled": enr is not None}
