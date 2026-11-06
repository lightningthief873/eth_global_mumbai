"""
USDT checkout settlement on Whitechain via the PaymentHub contract.

Flow (gasless for the payer):
  1. The payer's wallet signs an EIP-2612 permit off-chain (no gas).
  2. The relayer submits PaymentHub.payWithPermit (relayer pays WBT gas).
  3. USDT moves payer -> merchant; the invoice is recorded on-chain.

Refunds: the merchant wallet approves the hub once, then calls PaymentHub.refund
(full or partial) back to the original payer.
"""

import time

from eth_account import Account
from eth_account.signers.local import LocalAccount
from web3 import Web3

from config import settings
from services.chain_service import w3, relayer, _load_abi, _checksum, _send

USDT_DECIMALS = 6


def usdt():
    return w3().eth.contract(address=_checksum(settings.usdt_address), abi=_load_abi("USDT"))


def hub():
    return w3().eth.contract(address=_checksum(settings.payment_hub_address), abi=_load_abi("PaymentHub"))


def to_units(amount: str | float) -> int:
    from decimal import Decimal
    return int(Decimal(str(amount)) * (10 ** USDT_DECIMALS))


def from_units(units: int) -> str:
    return str(round(units / (10 ** USDT_DECIMALS), 6))


def usdt_balance(address: str) -> int:
    try:
        return usdt().functions.balanceOf(_checksum(address)).call()
    except Exception:
        return 0


# ---------------------------------------------------------------------------
# EIP-2612 permit signing
# ---------------------------------------------------------------------------

def sign_permit(owner: LocalAccount, spender: str, value: int, deadline: int) -> dict:
    """Sign an EIP-2612 permit from `owner` authorising `spender` to pull `value` USDT."""
    owner_addr = _checksum(owner.address)
    nonce = usdt().functions.nonces(owner_addr).call()
    typed = {
        "types": {
            "EIP712Domain": [
                {"name": "name", "type": "string"},
                {"name": "version", "type": "string"},
                {"name": "chainId", "type": "uint256"},
                {"name": "verifyingContract", "type": "address"},
            ],
            "Permit": [
                {"name": "owner", "type": "address"},
                {"name": "spender", "type": "address"},
                {"name": "value", "type": "uint256"},
                {"name": "nonce", "type": "uint256"},
                {"name": "deadline", "type": "uint256"},
            ],
        },
        "primaryType": "Permit",
        "domain": {
            "name": settings.usdt_permit_name,
            "version": settings.usdt_permit_version,
            "chainId": settings.wc_chain_id,
            "verifyingContract": _checksum(settings.usdt_address),
        },
        "message": {
            "owner": owner_addr,
            "spender": _checksum(spender),
            "value": value,
            "nonce": nonce,
            "deadline": deadline,
        },
    }
    signed = Account.sign_typed_data(owner.key, full_message=typed)
    return {"v": signed.v, "r": signed.r.to_bytes(32, "big"), "s": signed.s.to_bytes(32, "big")}


# ---------------------------------------------------------------------------
# Payment + refund
# ---------------------------------------------------------------------------

def pay_with_permit(payer: LocalAccount, invoice_id: bytes, merchant: str, amount_units: int) -> str:
    """Relayer-submitted gasless USDT payment for the given invoice id."""
    deadline = int(time.time()) + 3600
    sig = sign_permit(payer, settings.payment_hub_address, amount_units, deadline)
    tx = hub().functions.payWithPermit(
        invoice_id,
        _checksum(payer.address),
        _checksum(merchant),
        amount_units,
        deadline,
        sig["v"],
        sig["r"],
        sig["s"],
    ).build_transaction({"from": relayer().address})
    return _send(relayer(), tx)


def refund(merchant: LocalAccount, invoice_id: bytes, amount_units: int) -> str:
    """Merchant-signed refund. Ensures the hub is approved to pull the refund amount."""
    hub_addr = _checksum(settings.payment_hub_address)
    allowance = usdt().functions.allowance(_checksum(merchant.address), hub_addr).call()
    if allowance < amount_units:
        approve_tx = usdt().functions.approve(hub_addr, 2**256 - 1).build_transaction(
            {"from": merchant.address}
        )
        _send(merchant, approve_tx)
    tx = hub().functions.refund(invoice_id, amount_units).build_transaction({"from": merchant.address})
    return _send(merchant, tx)


def fund_usdt(to_address: str, amount_units: int) -> str:
    """Relayer transfers USDT to a wallet (demo seeding of customer/merchant wallets)."""
    tx = usdt().functions.transfer(_checksum(to_address), amount_units).build_transaction(
        {"from": relayer().address}
    )
    return _send(relayer(), tx)


def invoice_id_bytes(invoice_id: str) -> bytes:
    """Deterministic bytes32 id from an invoice string (keccak of the id)."""
    return Web3.keccak(text=invoice_id)
