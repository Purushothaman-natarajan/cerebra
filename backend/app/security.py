import base64
import os

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from app.config import settings


def _get_fernet() -> Fernet | None:
    key = settings.encryption_key
    if not key:
        return None
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=b"cerebra-key-salt", iterations=600_000)
    derived = base64.urlsafe_b64encode(kdf.derive(key.encode()))
    return Fernet(derived)


def encrypt_value(plaintext: str) -> str:
    f = _get_fernet()
    if f is None:
        return plaintext
    return f.encrypt(plaintext.encode()).decode()


def decrypt_value(ciphertext: str) -> str:
    f = _get_fernet()
    if f is None:
        return ciphertext
    return f.decrypt(ciphertext.encode()).decode()


def mask_key(key: str) -> str:
    if not key or len(key) < 8:
        return "********"
    return key[:4] + "..." + key[-4:]
