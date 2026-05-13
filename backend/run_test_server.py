"""Start the backend with SQLite for testing all endpoints."""
import os
import subprocess
import sys
import time

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_backend.db"

proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8002"],
    cwd=os.path.dirname(os.path.abspath(__file__)),
)

print(f"Backend starting (PID: {proc.pid}) on port 8002...")
time.sleep(3)

import urllib.request
try:
    resp = urllib.request.urlopen("http://localhost:8002/health")
    print(f"Health: {resp.read().decode()}")
    print("Backend is ready!")
except Exception as e:
    print(f"Backend failed to start: {e}")
    proc.kill()
    sys.exit(1)

# Keep running
print("Press Ctrl+C to stop")
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    proc.kill()
    print("Stopped")
