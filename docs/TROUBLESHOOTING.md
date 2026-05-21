# Troubleshooting Guide

Common issues organized by category. If your problem isn't listed here, search the [GitHub Issues](https://github.com/Purushothaman-natarajan/cerebra/issues) or open a new one.

---

## 🚀 Setup & Startup

### "No API key was provided"

The backend requires either a configured provider or the `GEMINI_API_KEY` environment variable.

**Fix:** Add `GEMINI_API_KEY` to your `.env` file or configure at least one provider via the UI (see [PROVIDERS.md](PROVIDERS.md)).

### "Port 8000 already in use"

Another process is using port 8000.

**Fix:**
```bash
# Find the process
netstat -ano | findstr :8000    # Windows
lsof -i :8000                    # macOS/Linux

# Kill it
taskkill /PID <pid> /F          # Windows
kill -9 <pid>                    # macOS/Linux
```

### Frontend shows blank page (localhost:5173)

**Check:**
- Vite dev server is running (`npm run dev` in `frontend/`)
- No TypeScript errors in the terminal
- Open browser console (F12) for error messages

**Fix:** Clear browser cache and reload. If that fails, restart the dev server.

### "Database connection error"

Cerebra can't reach PostgreSQL or SQLite.

**Fix:**
- **Docker**: Ensure containers are running: `docker compose ps`
- **Local**: Verify `DATABASE_URL` in `.env` is correct. For SQLite dev:
  ```
  DATABASE_URL=sqlite+aiosqlite:///./cerebra.db
  ```
- Ensure PostgreSQL is running and credentials are correct

### Docker services crash on startup

```bash
# View logs
docker compose logs backend
docker compose logs frontend
docker compose logs postgres

# Common fixes:
docker compose down -v    # Reset volumes (⚠️ deletes data)
docker compose build      # Rebuild images
docker compose up -d      # Restart
```

---

## 🧠 LLM & Agents

### "Model not found" or "No provider found"

Cerebra can't find a provider that offers the requested model.

**Fix:**
1. Go to **Providers** and verify at least one provider is configured
2. Check the available models: `curl http://localhost:8000/providers/models`
3. Ensure the model name in your agent exactly matches (case-sensitive)
4. If using Ollama, verify the model is pulled: `ollama list`

### LLM returns empty or nonsensical responses

- Check that the system prompt provides clear instructions
- Verify the model supports the features you're using (some models don't support tool calling)
- Try a different model (e.g., `gpt-4o` or `gemini-2.0-flash`)
- Check the run logs for error messages

### Tool calls fail silently

- Ensure the tool is enabled in the agent's tool list
- Verify the tool exists: `curl http://localhost:8000/tools`
- For custom tools, test them directly from the **Tools** page first
- Check backend logs for error messages

### "Rate limit exceeded" (429)

You've exceeded the API rate limit (10 req/min on `/runs`, 100/min on other endpoints).

**Fix:** Wait 60 seconds and retry. Rate limits reset on a sliding window.

---

## 🔀 Workflow Execution

### Workflow doesn't start

**Check:**
1. Does the workflow have at least one node? Empty workflows return a 400 error
2. Does each agent node have a model selected? Missing model returns a clear error
3. Are the edges properly connected? Disconnected nodes are ignored
4. Check the run logs in the UI for the exact error message

### "Maximum update depth exceeded" (Canvas)

The React Flow canvas enters a re-render loop when the parent state and internal state conflict.

**Fix:** Refresh the page. If the issue persists, clear the browser cache. This is a known edge case when rapidly editing node properties.

### Workflow hangs indefinitely

- Long-running LLM calls can block the single-threaded executor
- Check if an agent node has `max_iterations` set too high
- Verify the LLM provider is responsive (test the provider on the Providers page)
- Restart the backend if a request is truly stuck

---

## 📡 WebSocket & Live Logs

### Live logs don't update

**Check:**
1. Is Redis running? WebSocket falls back to in-memory without Redis
2. Does the WebSocket connection succeed? Check browser console for errors
3. Is the run still in progress? Completed runs show past events via REST fallback

**Fix:**
```bash
# Verify Redis is running
docker compose ps redis
redis-cli ping    # Expected: PONG
```

### WebSocket disconnects

- The server sends periodic heartbeats (every 30s). If the client doesn't respond, the connection drops
- Check for network proxies or firewalls that might close idle connections
- Browser tabs in background may throttle WebSocket activity

---

## 🔐 Authentication

### "401 Unauthorized" on API calls

**Causes:**
- Missing `Authorization: Bearer <key>` header
- Wrong API key
- `CEREBRA_API_KEY` is set but you're using the wrong value

**Fix:**
- Use the key from your `.env` file: `CEREBRA_API_KEY=your-key`
- If auth is disabled (`CEREBRA_API_KEY=no_key`), the header is not required
- Public endpoints (`/health`, `/docs`, Telegram webhook) never require auth

### 401 on WebSocket connection

Add the token as a query parameter:
```
ws://localhost:8000/ws/runs/<run-id>?token=your-api-key
```

---

## 📦 Telegram Integration

### Bot token rejected by Telegram

- Token is invalid or the bot was deleted
- Create a new bot via [@BotFather](https://t.me/BotFather) and try again

### Cannot reach Telegram API

- Network issue or Telegram is blocked by your firewall/proxy
- Check your internet connection

### Webhook URL must use HTTPS

- ngrok URLs are HTTPS by default. Ensure you're using the `https://` URL
- For local testing, ngrok provides a public HTTPS tunnel

### No channel configured

- The webhook received a message, but no bot is set up
- Complete the 3-step Telegram setup on the **Channels** page

---

## 🛠️ Development

### Alembic migration fails

```bash
cd backend
alembic upgrade head    # Apply all pending migrations
alembic history         # Show migration history
alembic current         # Show current migration state
```

If migrations conflict, you can reset:
```bash
# Backup your database first!
docker compose down -v   # ⚠️ This deletes all data
docker compose up -d
```

### Tests fail

```bash
cd backend
python -m pytest tests/ -v -x    # Stop on first failure

# Run a specific test category
python -m pytest tests/test_agent_crud.py -v
```

Tests use SQLite in-memory (no PostgreSQL needed). Tests requiring a Gemini API key auto-skip if the key is not set.

### Frontend build fails

```bash
cd frontend
npx tsc --noEmit          # TypeScript errors only
npm run build             # Full production build
```

Common fixes:
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript strict mode errors
- Verify all imports resolve correctly

---

## 🐛 Known Issues

| Issue | Status | Workaround |
|-------|--------|------------|
| Canvas re-render loop on rapid edits | Open | Refresh page |
| Single-threaded executor blocks on long LLM calls | Open | Use quick models for individual steps |
| In-memory rate limiter doesn't work across instances | Open | Add Redis for multi-instance deployments |
| Conversation memory lost on restart | Open | DB-backed persistence planned |

See [CHANGELOG.md](CHANGELOG.md) for version history and resolved issues.
