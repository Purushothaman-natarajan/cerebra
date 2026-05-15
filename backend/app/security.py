"""Encryption utilities for sensitive data at rest.

Uses Fernet (symmetric encryption via cryptography) with a PBKDF2-derived key.
If ENCRYPTION_KEY is unset, values pass through unencrypted (dev mode only).

Security notes:
- Salt and iteration count should be tuned for production deployment.
- The salt is derived from the encryption key itself + a domain separator
  rather than being hardcoded, preventing rainbow table attacks on the KDF.
- Minimum recommended iteration count for PBKDF2-SHA256: 1_000_000 (OWASP 2024).
"""

import base64
import hashlib

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from app.config import settings

# Domain separator used to derive KDF salt from the encryption key.
# Changing this will invalidate all existing encrypted values.
_SALT_SEPARATOR = b"cerebra-encryption-v1"
# PBKDF2 iterations (OWASP 2024 minimum: 1_000_000 for SHA256)
_PBKDF2_ITERATIONS = 1_000_000


def _get_fernet() -> Fernet | None:
    """Derive a Fernet cipher from the configured ENCRYPTION_KEY using PBKDF2.
    
    The salt is a SHA256 hash of the encryption key combined with a domain
    separator, ensuring each key produces a unique salt without hardcoding it.
    """
    key = settings.encryption_key
    if not key:
        return None
    # Derive a deterministic salt from the key itself + domain separator
    # This avoids storing a static salt while still being deterministic
    salt = hashlib.sha256(key.encode() + _SALT_SEPARATOR).digest()
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=_PBKDF2_ITERATIONS,
    )
    derived = base64.urlsafe_b64encode(kdf.derive(key.encode()))
    return Fernet(derived)


def encrypt_value(plaintext: str) -> str:
    """Encrypt a string. Returns ciphertext as a base64 string.
    
    Falls back to plaintext passthrough when ENCRYPTION_KEY is not configured.
    Emits a warning when operating without encryption so operators are aware.
    """
    f = _get_fernet()
    if f is None:
        import logging
        logging.getLogger(__name__).warning(
            "ENCRYPTION_KEY not set — provider API keys will be stored in PLAINTEXT. "
            "Set a strong ENCRYPTION_KEY in production."
        )
        return plaintext
    return f.encrypt(plaintext.encode()).decode()


def decrypt_value(ciphertext: str) -> str:
    """Decrypt a string previously encrypted with encrypt_value.
    
    Falls back to plaintext passthrough when ENCRYPTION_KEY is not configured.
    """
    f = _get_fernet()
    if f is None:
        return ciphertext
    return f.decrypt(ciphertext.encode()).decode()


def mask_key(key: str) -> str:
    """Return a masked version of an API key showing only first/last 4 chars.
    
    Examples:
        "sk-proj-abc123def456" -> "sk-p...d456"
        "abc" -> "********"
    """
    if not key or len(key) < 8:
        return "********"
    return key[:4] + "..." + key[-4:]
