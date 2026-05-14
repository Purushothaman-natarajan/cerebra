"""Start the dev server with SQLite. Run: python start_dev.py"""
import os, subprocess, sys, time, urllib.request

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./orchid.db"
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
    with open("orchid.pid", "w") as f: f.write(str(proc.pid))
except Exception as e:
    print(f"Failed: {e}")
    proc.kill()
