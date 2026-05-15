"""Start the backend with SQLite for testing all endpoints.

Run directly: python run_test_server.py
Safe to import (no side effects at module load time).
"""
import os
import subprocess
import sys
import time


def main():
    """Start a test backend server on port 8002 with SQLite."""
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


if __name__ == "__main__":
    main()
