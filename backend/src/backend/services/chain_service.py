"""
Whitechain (EVM) chain client built on web3.py.

Real:  WBT native balance reads from Whitechain Sepolia RPC.
Mock:  Transaction sending (returns fake hash until contracts are deployed).
"""

import secrets
import time

from web3 import Web3

from ..config import settings

_w3: Web3 | None = None


def w3() -> Web3:
    global _w3
    if _w3 is None:
        _w3 = Web3(Web3.HTTPProvider(settings.wc_rpc_url))
    return _w3


# ---------------------------------------------------------------------------
# Balance reads
# ---------------------------------------------------------------------------

def get_wbt_balance(address: str) -> int:
    """Returns WBT balance in wei. Live RPC call."""
    try:
        return w3().eth.get_balance(Web3.to_checksum_address(address))
    except Exception:
        return 0


def get_pwsr_balance(address: str) -> int:
    """
    MOCK: Returns PWSR ERC-20 balance.
    TODO: replace with PWSRToken.balanceOf(address) once contract is deployed.
    """
    return 0


# ---------------------------------------------------------------------------
# Transaction helpers
# ---------------------------------------------------------------------------

def mock_tx_hash() -> str:
    """Return a plausible-looking fake transaction hash for dev/demo."""
    return "0x" + secrets.token_hex(32)


def send_wbt_payment(customer_address: str, merchant_address: str, amount_wei: int) -> str:
    """
    MOCK: Simulates the customer custodial wallet calling PaymentProcessor.charge.
    TODO: replace with real signed tx once PaymentProcessor is deployed:
        signer = wallet_service.load_signer(customer_address, session)
        tx = processor_contract.functions.charge(merchant_address).build_transaction(
            {"from": signer.address, "value": amount_wei, ...}
        )
        signed = signer.sign_transaction(tx)
        tx_hash = w3().eth.send_raw_transaction(signed.raw_transaction)
        return tx_hash.hex()
    """
    time.sleep(0.3)  # simulate block time
    return mock_tx_hash()


def top_up_wallet(address: str, amount_wbt: float) -> str:
    """
    MOCK: Relayer sends a WBT gas buffer to a new custodial wallet.
    TODO: replace with real relayer-signed transfer once relayer key is set.
    """
    return mock_tx_hash()


def is_connected() -> bool:
    try:
        return w3().is_connected()
    except Exception:
        return False
