#!/usr/bin/env python3
"""Telegram bot token diagnostic - tests the endpoint directly and reports findings.

Usage:
    python telegram_diagnostic.py YOUR_BOT_TOKEN

Or set the TELEGRAM_BOT_TOKEN environment variable.
"""

import sys
import os
import json
import urllib.request
import urllib.error

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN") or (sys.argv[1] if len(sys.argv) > 1 else "")

if not TOKEN:
    print("=" * 60)
    print("CEREBRA TELEGRAM DIAGNOSTIC")
    print("=" * 60)
    print()
    print("ERROR: No bot token provided.")
    print()
    print("Usage:")
    print(f"  python {os.path.basename(__file__)} YOUR_BOT_TOKEN")
    print(f"  set TELEGRAM_BOT_TOKEN=YOUR_TOKEN && python {os.path.basename(__file__)}")
    print()
    sys.exit(1)

PASS = "[PASS]"
FAIL = "[FAIL]"
SKIP = "[SKIP]"

print("=" * 60)
print("CEREBRA TELEGRAM DIAGNOSTIC")
print("=" * 60)

# Step 1: Is the backend running?
print("\n[1/4] Checking if backend is running...")
try:
    req = urllib.request.Request("http://localhost:8000/health")
    resp = urllib.request.urlopen(req, timeout=5)
    data = json.loads(resp.read())
    print(f"  {PASS} Backend running: {data}")
except Exception as e:
    print(f"  {FAIL} Backend NOT running: {e}")
    print("\n  Start backend:")
    print("    cd backend")
    print("    uvicorn app.main:app --reload --port 8000")
    sys.exit(1)

# Step 2: Is the /channels/test route registered?
has_route = False
data = {}
print("\n[2/4] Checking /channels/test route in OpenAPI schema...")
try:
    req = urllib.request.Request("http://localhost:8000/openapi.json")
    resp = urllib.request.urlopen(req, timeout=5)
    spec = json.loads(resp.read())
    has_route = "/channels/test" in spec.get("paths", {})
    if has_route:
        print(f"  {PASS} /channels/test IS registered")
    else:
        print(f"  {FAIL} /channels/test NOT registered - backend has OLD code")
        print("")
        print("  HOW TO FIX:")
        print("  1. Kill old backend processes:")
        print("     taskkill /f /im uvicorn.exe 2>nul")
        print("     taskkill /f /fi WINDOWTITLE eq cerebra-backend 2>nul")
        print("")
        print("  2. Wait 3 seconds, then verify port is free:")
        print("     curl http://localhost:8000/health")
        print("     # Must say connection refused")
        print("")
        print("  3. Restart with latest code:")
        print("     cd backend")
        print("     uvicorn app.main:app --reload --port 8000")
        print("")
        print("  4. Re-run this diagnostic")
        sys.exit(1)
except Exception as e:
    print(f"  {SKIP} Could not check API schema: {e}")

# Step 3: Test the /channels/test endpoint
print(f"\n[3/4] Testing /channels/test with token: {TOKEN[:10]}...")
try:
    body = json.dumps({"bot_token": TOKEN}).encode()
    req = urllib.request.Request(
        "http://localhost:8000/channels/test",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    resp = urllib.request.urlopen(req, timeout=15)
    data = json.loads(resp.read())
    print(f"  Response: {json.dumps(data, indent=4)}")
    if data.get("ok"):
        print(f"  {PASS} Token VALID. Bot: @{data.get('username', 'unknown')}")
    else:
        print(f"  {FAIL} Token rejected: {data.get('description', 'unknown')}")
except urllib.error.HTTPError as e:
    print(f"  {FAIL} HTTP {e.code}: {e.read().decode()[:300]}")
    print("  This means the endpoint returned an error, not a token issue.")
except Exception as e:
    print(f"  {FAIL} Error: {e}")

# Step 4: Test directly against Telegram API (bypasses backend)
print("\n[4/4] Testing token DIRECTLY against Telegram API...")
try:
    req = urllib.request.Request(f"https://api.telegram.org/bot{TOKEN}/getMe")
    resp = urllib.request.urlopen(req, timeout=15)
    direct = json.loads(resp.read())
    if direct.get("ok"):
        bot = direct.get("result", {})
        print(f"  {PASS} Token VALID with Telegram directly!")
        print(f"     Bot: @{bot.get('username', 'unknown')}")
        print(f"     Name: {bot.get('first_name', 'unknown')}")
    else:
        print(f"  {FAIL} Token REJECTED by Telegram: {direct.get('description', 'unknown')}")
except Exception as e:
    print(f"  {SKIP} Could not test directly (network may be restricted): {e}")

print("\n" + "=" * 60)

if has_route and data.get("ok"):
    print("RESULT: Everything works. The frontend should show green check.")
else:
    print("RESULT: See failures above and follow the fix instructions.")
print("=" * 60)
