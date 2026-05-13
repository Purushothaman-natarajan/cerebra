"""Encryption utilities for sensitive data at rest.

Uses Fernet (symmetric encryption via cryptography) with a PBKDF2-derived key.
If ENCRYPTION_KEY is unset, values pass through unencrypted (dev mode).
"""

import base64

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from app.config import settings


def _get_fernet() -> Fernet | None:
    """Derive a Fernet cipher from the configured ENCRYPTION_KEY using PBKDF2."""
    key = settings.encryption_key
    if not key:
        return None
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=b"cerebra-key-salt", iterations=600_000)
    derived = base64.urlsafe_b64encode(kdf.derive(key.encode()))
    return Fernet(derived)


def encrypt_value(plaintext: str) -> str:
    """Encrypt a string. Returns ciphertext as a base64 string."""
    f = _get_fernet()
    if f is None:
        return plaintext
    return f.encrypt(plaintext.encode()).decode()


def decrypt_value(ciphertext: str) -> str:
    """Decrypt a string previously encrypted with encrypt_value."""
    f = _get_fernet()
    if f is None:
        return ciphertext
    return f.decrypt(ciphertext.encode()).decode()


def mask_key(key: str) -> str:
    """Return a masked version of an API key showing only first/last 4 chars."""
    if not key or len(key) < 8:
        return "********"
    return key[:4] + "..." + key[-4:]
