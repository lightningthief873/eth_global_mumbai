"""
AES-GCM envelope encryption for private keys and biometric embeddings.
"""

import hashlib
import secrets

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from config import settings


def _key() -> bytes:
    raw = settings.wallet_encryption_key
    if not raw or len(raw) < 64:
        return bytes(32)  # dev-only zero key — override in .env
    return bytes.fromhex(raw[:64])


def encrypt(plaintext: bytes) -> tuple[bytes, bytes]:
    """Return (ciphertext, iv). Both are raw bytes."""
    iv = secrets.token_bytes(12)
    ct = AESGCM(_key()).encrypt(iv, plaintext, None)
    return ct, iv


def decrypt(ciphertext: bytes, iv: bytes) -> bytes:
    return AESGCM(_key()).decrypt(iv, ciphertext, None)


def commitment(data: bytes) -> str:
    """SHA-256 commitment for on-chain BiometricRegistry. Returns 0x-prefixed hex bytes32."""
    salt = secrets.token_bytes(32)
    return "0x" + hashlib.sha256(data + salt).hexdigest()
