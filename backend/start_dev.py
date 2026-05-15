"""Start the dev server with SQLite. Run: python start_dev.py

Sets environment variables at function call time (not import time)
to avoid side effects when this module is imported by other code.
"""
import os, subprocess, sys, time, urllib.request


def main():
    """Start the development server with SQLite backend."""
    os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./cerebra.db"
    os.environ["CEREBRA_API_KEY"] = ""

    port = 8000
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", str(port)],
        cwd=os.path.dirname(os.path.abspath(__file__)),
    )
    print(f"Backend starting on http://localhost:{port} ...")
    time.sleep(3)
    try:
        resp = urllib.request.urlopen(f"http://localhost:{port}/health")
        print(f"Health: {resp.read().decode()}")
        print(f"\nAPI: http://localhost:{port}")
        print(f"Docs: http://localhost:{port}/docs")
        print(f"\nPID: {proc.pid} | Kill with: taskkill /f /pid {proc.pid}")
        with open("cerebra.pid", "w") as f:
            f.write(str(proc.pid))
    except Exception as e:
        print(f"Failed: {e}")
        proc.kill()


if __name__ == "__main__":
    main()
