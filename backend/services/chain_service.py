"""
Whitechain (EVM) chain client built on web3.py.

Real:  WBT native balance reads from Whitechain Sepolia RPC.
Mock:  Transaction sending (returns fake hash until contracts are deployed).
"""

import secrets
import time

from web3 import Web3

from config import settings

_w3: Web3 | None = None


def w3() -> Web3:
    global _w3
    if _w3 is None:
        _w3 = Web3(Web3.HTTPProvider(settings.wc_rpc_url))
    return _w3


def get_wbt_balance(address: str) -> int:
    """Returns WBT balance in wei. Live RPC call."""
    try:
        return w3().eth.get_balance(Web3.to_checksum_address(address))
    except Exception:
        return 0


def get_pwsr_balance(address: str) -> int:
    """MOCK: Returns PWSR ERC-20 balance.
    TODO: replace with PWSRToken.balanceOf(address) once contract is deployed."""
    return 0


def mock_tx_hash() -> str:
    return "0x" + secrets.token_hex(32)


def send_wbt_payment(customer_address: str, merchant_address: str, amount_wei: int) -> str:
    """MOCK: Simulates PaymentProcessor.charge call.
    TODO: replace with real signed tx once contracts are deployed."""
    time.sleep(0.3)
    return mock_tx_hash()


def top_up_wallet(address: str, amount_wbt: float) -> str:
    """MOCK: Relayer sends WBT gas buffer to a new custodial wallet."""
    return mock_tx_hash()


def is_connected() -> bool:
    try:
        return w3().is_connected()
    except Exception:
        return False
