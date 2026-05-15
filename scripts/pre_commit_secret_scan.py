#!/usr/bin/env python3
"""Pre-commit hook to detect hardcoded secrets before they reach the repository.

Scans staged files for patterns matching API keys, tokens, passwords, etc.
Usage: Place in .git/hooks/pre-commit or run via pre-commit framework.

This is a defense-in-depth measure. The primary protection is developer awareness.
"""

import os
import re
import sys

# Patterns that indicate hardcoded secrets
# These are designed to catch real secrets while minimizing false positives
SECRET_PATTERNS = [
    # Telegram bot tokens
    (r"\b\d{8,10}:AA[a-zA-Z0-9_-]{20,40}\b", "Telegram Bot Token"),
    # OpenAI / Anthropic / generic API keys
    (r"\b(sk-proj-|sk-ant-|sk-or-|sk-)[a-zA-Z0-9_-]{20,}\b", "API Key (sk-*)"),
    # Google Gemini / generic AI keys
    (r"\bAIzaSy[a-zA-Z0-9_-]{20,}\b", "Google API Key (AIzaSy)"),
    # GitHub tokens
    (r"\bghp_[a-zA-Z0-9]{36}\b", "GitHub Personal Access Token (ghp_)"),
    (r"\bgho_[a-zA-Z0-9]{36}\b", "GitHub OAuth Token (gho_)"),
    (r"\bgithub_pat_[a-zA-Z0-9]{22,}\b", "GitHub Personal Access Token (pat)"),
    # AWS keys
    (r"\bAKIA[0-9A-Z]{16}\b", "AWS Access Key ID"),
    # Generic private keys
    (r"-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----", "Private Key"),
    # JWT tokens (generic pattern)
    (r"eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}", "JWT Token"),
]

# Files that are allowed to contain example/placeholder secrets
ALLOWED_PATHS = [
    "backend/app/api/providers.py",
    "API_DOCS.md",
    ".env.example",
    "SECURITY.md",
    "README.md",
    "DEPLOYMENT.md",
    "backend/app/security.py",
]

# Keys that are explicitly OK (example/placeholder values)
ALLOWED_VALUES = [
    "sk-proj-3aF8kD9mN2pQ7rX5vB1wJ4cL6nM0zS8t",  # Example in providers.py
    "AIzaSyCb8mN3pQ7rX5vB1wJ4cL6nM0zS8tD9fG2hK",  # Example in providers.py
    "sk-ant-auth03aF8kD9mN2pQ7rX5vB1wJ4cL6nM",     # Example in providers.py
    "YOUR_BOT_TOKEN",                                  # Placeholder in diagnostic script
    "YOUR_TOKEN",                                       # Generic placeholder
]


def is_allowed(filepath: str, line: str) -> bool:
    """Check if a match should be allowed (example/placeholder)."""
    # Check if file is in allowed list
    rel = filepath.replace("\\", "/")
    for allowed in ALLOWED_PATHS:
        if rel.endswith(allowed):
            return True
    # Check if the matched line contains an allowed value
    for val in ALLOWED_VALUES:
        if val in line:
            return True
    return False


def main():
    """Run secret scanning on all staged files."""
    # Get staged files
    result = os.popen("git diff --cached --name-only --diff-filter=ACMR").read().strip()
    if not result:
        return 0  # Nothing staged

    staged_files = [f.strip() for f in result.split("\n") if f.strip()]

    # Exclude binary/lock files
    exclude_extensions = {".lock", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".woff", ".woff2", ".eot", ".ttf"}
    exclude_files = {"package-lock.json", "uv.lock"}

    found_secrets = False

    for filepath in staged_files:
        ext = os.path.splitext(filepath)[1].lower()
        basename = os.path.basename(filepath)
        if ext in exclude_extensions or basename in exclude_files:
            continue
        if not os.path.exists(filepath):
            continue

        try:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                for lineno, line in enumerate(f, 1):
                    for pattern, name in SECRET_PATTERNS:
                        match = re.search(pattern, line)
                        if match and not is_allowed(filepath, line):
                            # Mask the secret in the output
                            secret = match.group(0)
                            masked = secret[:4] + "..." + secret[-4:] if len(secret) > 10 else "***"
                            print(f"  {filepath}:{lineno} - {name}: {masked}")
                            found_secrets = True
        except (OSError, UnicodeDecodeError):
            continue

    if found_secrets:
        print("\nERROR: Hardcoded secrets detected in staged files.")
        print("Remove them before committing, or use environment variables instead.")
        print("If this is a false positive, add the pattern to ALLOWED_VALUES in this script.")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
