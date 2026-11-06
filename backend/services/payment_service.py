"""
Payment orchestration service.
Ties together face recognition -> custodial wallet -> Whitechain -> DB persistence.
"""

from decimal import Decimal

from sqlmodel import Session, select

from models import Enrollment, Payment
from config import settings
from services import face_service, chain_service, wallet_service
from services.crypto_service import decrypt, encrypt, commitment

# PWSR minted per 1 WBT, matching PaymentProcessor.rewardRate (100e18).
REWARD_RATE = 100


def wbt_to_wei(wbt: str | float) -> int:
    return int(Decimal(str(wbt)) * Decimal(10**18))


def calc_pwsr_reward(amount_wei: int) -> int:
    """Mirror of the on-chain formula: amount * rewardRate / 1e18."""
    return amount_wei * REWARD_RATE


def _load_candidates(session: Session) -> list[tuple[str, "face_service.np.ndarray"]]:
    enrollments = session.exec(select(Enrollment)).all()
    candidates = []
    for enr in enrollments:
        try:
            raw = decrypt(bytes.fromhex(enr.enc_embedding_hex), bytes.fromhex(enr.iv_hex))
            candidates.append((enr.customer_address, face_service.hex_to_embedding(raw.hex())))
        except Exception:
            continue
    return candidates


def recognize(image_bytes: bytes, session: Session) -> tuple[str, float] | None:
    query = face_service.embed(image_bytes)
    candidates = _load_candidates(session)
    return face_service.match(query, candidates, settings.face_match_threshold)


def enroll(image_bytes: bytes, address: str, session: Session) -> tuple[str, str]:
    """
    Compute embedding, encrypt + store it, record the commitment on-chain.
    Returns (commitment_hex, registry_tx_hash).
    """
    emb = face_service.embed(image_bytes)
    emb_bytes = bytes.fromhex(face_service.embedding_to_hex(emb))
    enc, iv = encrypt(emb_bytes)
    comm = commitment(emb_bytes)

    existing = session.exec(
        select(Enrollment).where(Enrollment.customer_address == address)
    ).first()
    if existing:
        session.delete(existing)
        session.flush()

    session.add(Enrollment(
        customer_address=address,
        enc_embedding_hex=enc.hex(),
        iv_hex=iv.hex(),
        commitment=comm,
    ))
    session.commit()

    tx_hash = chain_service.enroll_on_chain(address, comm)
    return comm, tx_hash


def charge(customer_address: str, merchant_address: str, amount_wei: int, session: Session) -> dict:
    """
    Execute a real payment: the customer custodial wallet signs
    PaymentProcessor.charge{value}, forwarding WBT to the merchant and minting PWSR.
    """
    signer = wallet_service.load_signer(customer_address, session)
    tx_hash = chain_service.charge_on_chain(signer, merchant_address, amount_wei)
    pwsr_wei = calc_pwsr_reward(amount_wei)

    payment = Payment(
        customer_address=customer_address,
        merchant_address=merchant_address,
        amount_wei=amount_wei,
        pwsr_wei=pwsr_wei,
        tx_hash=tx_hash,
    )
    session.add(payment)
    session.commit()
    session.refresh(payment)

    return {
        "tx_hash": tx_hash,
        "amount_wei": amount_wei,
        "pwsr_wei": pwsr_wei,
        "customer": customer_address,
        "merchant": merchant_address,
    }
