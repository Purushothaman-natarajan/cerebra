"""LLM client — delegates to provider-aware router (llm_providers.py).

Maintains backward compatibility for existing imports.
The actual provider routing logic lives in llm_providers.py.
"""

from app.runtime.llm_providers import call_llm_with_tools, estimate_cost, MODEL_PRICING

__all__ = ["call_llm_with_tools", "estimate_cost", "MODEL_PRICING"]
