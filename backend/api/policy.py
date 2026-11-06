import secrets
import time

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from db import get_session
from models import Enrollment

router = APIRouter()

_nonce_store: dict[str, dict] = {}
NONCE_TTL = 3600


class NonceRequest(BaseModel):
    address: str


@router.post("/nonce")
def issue_nonce(req: NonceRequest, session: Session = Depends(get_session)):
    enr = session.exec(
        select(Enrollment).where(Enrollment.customer_address == req.address)
    ).first()
    if not enr:
        raise HTTPException(404, f"{req.address} is not enrolled")

    nonce = secrets.token_hex(16)
    expiry = int(time.time()) + NONCE_TTL
    _nonce_store[req.address] = {"nonce": nonce, "expiry": expiry}
    return {"nonce": nonce, "expiry": expiry, "ttl": NONCE_TTL}


@router.post("/verify-nonce")
def verify_nonce(req: NonceRequest):
    record = _nonce_store.get(req.address)
    if not record:
        raise HTTPException(404, "No active nonce for this address")
    if time.time() > record["expiry"]:
        del _nonce_store[req.address]
        raise HTTPException(401, "Nonce expired")
    del _nonce_store[req.address]
    return {"valid": True}
