# Provider Setup Guide

Configure LLM providers to power your agents and workflows. Cerebra supports five provider families with automatic model discovery.

---

## Supported Providers

| Provider | Type | Models Auto-Discovered | Requires API Key |
|----------|------|------------------------|------------------|
| OpenAI | `openai` | ✅ | Yes |
| Google Gemini | `gemini` | ✅ | Yes |
| Anthropic | `anthropic` | ✅ | Yes |
| Ollama | `openai` | ✅ (via `/api/tags`) | No |
| OpenRouter | `openai` | ✅ | Yes |

All OpenAI-compatible providers (OpenAI, Ollama, OpenRouter, and any custom OpenAI-format endpoint) share the same `openai` type with different base URLs.

---

## Setup by Provider

### 1. OpenAI

1. Go to **https://platform.openai.com/api-keys** and create a key
2. In Cerebra, navigate to **Providers → Add Provider**
3. Fill in:
   - **Name**: `My OpenAI`
   - **Provider Type**: `OpenAI`
   - **Base URL**: `https://api.openai.com/v1`
   - **API Key**: paste your `sk-...` key
4. Click **Test Connection** — available models appear
5. **Save** — models are stored and available in Agent/Workflow dropdowns

**Pricing**: Pay-as-you-go via OpenAI. See https://openai.com/pricing

### 2. Google Gemini

1. Go to **https://aistudio.google.com/apikey** and create a key
2. In Cerebra, navigate to **Providers → Add Provider**
3. Fill in:
   - **Name**: `My Gemini`
   - **Provider Type**: `Gemini`
   - **Base URL**: (leave default — Gemini uses a fixed endpoint)
   - **API Key**: paste your Gemini API key
4. Click **Test Connection** — models like `gemini-2.0-flash`, `gemini-2.5-pro-exp-03-25` appear
5. **Save**

**Fallback**: If no provider is configured with a matching model, Cerebra falls back to the `GEMINI_API_KEY` environment variable.

**Pricing**: Gemini 2.0 Flash is free within limits. See https://ai.google.dev/pricing

### 3. Anthropic

1. Go to **https://console.anthropic.com/settings/keys** and create a key
2. In Cerebra, navigate to **Providers → Add Provider**
3. Fill in:
   - **Name**: `My Anthropic`
   - **Provider Type**: `Anthropic`
   - **Base URL**: `https://api.anthropic.com/v1`
   - **API Key**: paste your `sk-ant-...` key
4. Click **Test Connection** — models like `claude-sonnet-4-20250514`, `claude-3-5-haiku-latest` appear
5. **Save**

**Pricing**: Anthropic API pricing at https://www.anthropic.com/pricing

### 4. Ollama (Local)

1. Install Ollama from **https://ollama.com** and pull a model:
   ```bash
   ollama pull llama3.2
   ollama pull mistral
   ```
2. In Cerebra, navigate to **Providers → Add Provider**
3. Fill in:
   - **Name**: `Local Ollama`
   - **Provider Type**: `OpenAI` (Ollama uses the OpenAI-compatible format)
   - **Base URL**: `http://host.docker.internal:11434/v1` (Docker) or `http://localhost:11434/v1` (local dev)
   - **API Key**: leave empty (Ollama doesn't require one)
4. Click **Test Connection** — local models appear
5. **Save**

**Note**: Ollama runs on your machine. Ensure it's running before testing/using.

### 5. OpenRouter

1. Go to **https://openrouter.ai/keys** and create a key
2. In Cerebra, navigate to **Providers → Add Provider**
3. Fill in:
   - **Name**: `OpenRouter`
   - **Provider Type**: `OpenAI`
   - **Base URL**: `https://openrouter.ai/api/v1`
   - **API Key**: paste your key
4. Click **Test Connection** — all accessible models appear
5. **Save**

**Pricing**: OpenRouter aggregates pricing from multiple providers. See https://openrouter.ai/models

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `GEMINI_API_KEY` | Fallback | Used when no provider matches the requested model |
| `GOOGLE_API_KEY` | No | Alternative name for Gemini key |
| `ANTHROPIC_API_KEY` | No | Fallback Anthropic key |
| `OPENAI_API_KEY` | No | Fallback OpenAI key |

Provider API keys configured via the UI are stored encrypted at rest (Fernet + PBKDF2). Fallback env vars are stored in plaintext in your environment.

---

## How Model Resolution Works

At runtime, when a workflow node calls an LLM:

1. If the node specifies a `provider_id`, that exact provider is used (fast path, no scan)
2. Otherwise, Cerebra scans all configured providers for a model matching the requested name
3. If nothing matches, falls back to `GEMINI_API_KEY` environment variable
4. If still nothing, returns an error

This means you can have multiple providers with the same model name — the first match wins.

---

## Testing Your Setup

After adding a provider:

1. Go to **Agents → Create Agent**
2. Select the model from the dropdown (grouped by provider)
3. Write a system prompt and click **Test**
4. Verify the response is from the expected provider

Or run a quick API check:

```bash
curl http://localhost:8000/providers/models
# → [{"model":"gpt-4o","provider_name":"My OpenAI",...}]
```
