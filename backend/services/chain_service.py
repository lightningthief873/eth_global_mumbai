"""
Whitechain (EVM) chain client built on web3.py.

Real on-chain operations against Whitechain Sepolia:
  - WBT native balance reads
  - PWSR ERC-20 balance reads
  - Relayer-signed WBT top-ups to custodial wallets
  - Custodial-wallet-signed PaymentProcessor.charge (WBT -> merchant + PWSR mint)
  - Relayer-signed BiometricRegistry.enroll
"""

import json
import os
from pathlib import Path

from eth_account import Account
from eth_account.signers.local import LocalAccount
from web3 import Web3
from web3.contract import Contract

from config import settings

_ABI_DIR = Path(__file__).resolve().parent.parent / "abi"


def _load_abi(name: str) -> list:
    return json.loads((_ABI_DIR / f"{name}.json").read_text())


_w3: Web3 | None = None


def w3() -> Web3:
    global _w3
    if _w3 is None:
        _w3 = Web3(Web3.HTTPProvider(settings.wc_rpc_url))
    return _w3


def relayer() -> LocalAccount:
    return Account.from_key(settings.relayer_private_key)


def _checksum(addr: str) -> str:
    return Web3.to_checksum_address(addr)


# ---------------------------------------------------------------------------
# Contract handles
# ---------------------------------------------------------------------------

def pwsr() -> Contract:
    return w3().eth.contract(address=_checksum(settings.pwsr_token_address), abi=_load_abi("PWSRToken"))


def processor() -> Contract:
    return w3().eth.contract(
        address=_checksum(settings.payment_processor_address), abi=_load_abi("PaymentProcessor")
    )


def registry() -> Contract:
    return w3().eth.contract(
        address=_checksum(settings.biometric_registry_address), abi=_load_abi("BiometricRegistry")
    )


# ---------------------------------------------------------------------------
# Balance reads
# ---------------------------------------------------------------------------

def get_wbt_balance(address: str) -> int:
    try:
        return w3().eth.get_balance(_checksum(address))
    except Exception:
        return 0


def get_pwsr_balance(address: str) -> int:
    try:
        return pwsr().functions.balanceOf(_checksum(address)).call()
    except Exception:
        return 0


# ---------------------------------------------------------------------------
# Transaction helpers
# ---------------------------------------------------------------------------

def _fees() -> dict:
    """EIP-1559 fees respecting Whitechain's 5 gwei minimum base fee."""
    client = w3()
    base = client.eth.get_block("latest").get("baseFeePerGas", client.to_wei(5, "gwei"))
    priority = client.to_wei(1, "gwei")
    return {
        "maxPriorityFeePerGas": priority,
        "maxFeePerGas": base * 2 + priority,
    }


def _send(signer: LocalAccount, tx: dict) -> str:
    """Sign and broadcast a transaction, wait for the receipt, return the tx hash."""
    client = w3()
    tx.setdefault("from", signer.address)
    tx.setdefault("nonce", client.eth.get_transaction_count(signer.address))
    tx.setdefault("chainId", settings.wc_chain_id)
    tx.update(_fees())
    if "gas" not in tx:
        tx["gas"] = int(client.eth.estimate_gas(tx) * 1.25)
    signed = signer.sign_transaction(tx)
    tx_hash = client.eth.send_raw_transaction(signed.raw_transaction)
    client.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    return client.to_hex(tx_hash)


def top_up_wallet(address: str, amount_wbt: float) -> str:
    """Relayer sends a WBT gas buffer to a custodial wallet."""
    value = w3().to_wei(amount_wbt, "ether")
    return _send(relayer(), {"to": _checksum(address), "value": value})


def enroll_on_chain(user_address: str, commitment_hex: str) -> str:
    """Relayer (verifier) records the enrollment commitment in BiometricRegistry."""
    commitment = bytes.fromhex(commitment_hex[2:] if commitment_hex.startswith("0x") else commitment_hex)
    tx = registry().functions.enroll(_checksum(user_address), commitment).build_transaction(
        {"from": relayer().address}
    )
    return _send(relayer(), tx)


def charge_on_chain(customer_signer: LocalAccount, merchant_address: str, amount_wei: int) -> str:
    """
    Customer custodial wallet calls PaymentProcessor.charge{value}, sending WBT to the
    merchant and minting PWSR to itself. The wallet pays its own gas from the relayer-
    funded buffer.
    """
    tx = processor().functions.charge(_checksum(merchant_address)).build_transaction(
        {"from": customer_signer.address, "value": amount_wei}
    )
    return _send(customer_signer, tx)


def is_enrolled_on_chain(address: str) -> bool:
    try:
        return registry().functions.isEnrolled(_checksum(address)).call()
    except Exception:
        return False


def is_connected() -> bool:
    try:
        return w3().is_connected()
    except Exception:
        return False
