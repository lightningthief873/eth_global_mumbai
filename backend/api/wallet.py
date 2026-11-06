from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session

from db import get_session
from services import wallet_service, chain_service

router = APIRouter()


class BalanceRequest(BaseModel):
    address: str


@router.post("/create")
def create_wallet(session: Session = Depends(get_session)):
    address = wallet_service.create_wallet(session)
    return {"address": address}


@router.post("/balance")
def get_balance(req: BalanceRequest):
    wbt_wei = chain_service.get_wbt_balance(req.address)
    pwsr_wei = chain_service.get_pwsr_balance(req.address)
    return {
        "address": req.address,
        "wbt_wei": str(wbt_wei),
        "pwsr_wei": str(pwsr_wei),
        "wbt": str(round(wbt_wei / 1e18, 6)),
        "pwsr": str(round(pwsr_wei / 1e18, 6)),
    }
