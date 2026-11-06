"""
Custodial EVM wallet management using eth-account.
Keys are AES-GCM encrypted before persisting to the database.
"""

from eth_account import Account
from eth_account.signers.local import LocalAccount
from sqlmodel import Session, select

from models import Wallet
from services.crypto_service import encrypt, decrypt


def create_wallet(session: Session) -> str:
    """Generate a new EVM keypair, encrypt the private key, persist, return address."""
    acct: LocalAccount = Account.create()
    enc, iv = encrypt(acct.key)
    wallet = Wallet(
        address=acct.address,
        enc_privkey_hex=enc.hex(),
        iv_hex=iv.hex(),
    )
    session.add(wallet)
    session.commit()
    session.refresh(wallet)
    return acct.address


def load_signer(address: str, session: Session) -> LocalAccount:
    """Decrypt and return a LocalAccount for signing. Never persists the plaintext key."""
    wallet = session.exec(select(Wallet).where(Wallet.address == address)).first()
    if not wallet:
        raise ValueError(f"No custodial wallet found for {address}")
    privkey = decrypt(
        bytes.fromhex(wallet.enc_privkey_hex),
        bytes.fromhex(wallet.iv_hex),
    )
    return Account.from_key(privkey)


def wallet_exists(address: str, session: Session) -> bool:
    return session.exec(select(Wallet).where(Wallet.address == address)).first() is not None
