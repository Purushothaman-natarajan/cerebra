"""Qdrant vector DB tools for document indexing and retrieval.

This module provides lightweight wrappers around qdrant-client. If the
qdrant-client package is not installed or a QDRANT_URL isn't configured,
the tools will return a helpful error message.
"""

import os
import json
from typing import Any

from app.runtime.tools.registry import register

try:
    from qdrant_client import QdrantClient
    from qdrant_client.http.models import PointStruct
    QDRANT_AVAILABLE = True
except Exception:
    QDRANT_AVAILABLE = False


def _get_client() -> Any:
    url = os.environ.get("QDRANT_URL")
    api_key = os.environ.get("QDRANT_API_KEY")
    if not url:
        raise RuntimeError("QDRANT_URL not configured")
    if api_key:
        return QdrantClient(url=url, api_key=api_key)
    return QdrantClient(url=url)


if QDRANT_AVAILABLE:
    @register("qdrant_index")
    async def qdrant_index(payload: str) -> str:
        """Index a JSON array of documents into qdrant. Input: JSON [{id, vector, payload}]."""
        try:
            data = json.loads(payload)
        except Exception:
            return "Error: payload must be JSON array of documents"
        client = _get_client()
        collection = os.environ.get("QDRANT_COLLECTION", "cerebra_docs")
        points = []
        for doc in data:
            pid = doc.get("id")
            vector = doc.get("vector")
            payload = doc.get("payload", {})
            if pid is None or vector is None:
                continue
            points.append(PointStruct(id=pid, vector=vector, payload=payload))
        client.upsert(collection_name=collection, points=points)
        return f"Indexed {len(points)} documents into {collection}"


    @register("qdrant_search")
    async def qdrant_search(payload: str) -> str:
        """Search qdrant for nearest neighbors. Input: JSON {vector: [...], top_k: int, filter: dict}

        Returns a JSON array of hits.
        """
        try:
            data = json.loads(payload)
        except Exception:
            return "Error: payload must be JSON with vector and optional top_k"
        vector = data.get("vector")
        top_k = int(data.get("top_k", 5))
        collection = os.environ.get("QDRANT_COLLECTION", "cerebra_docs")
        client = _get_client()
        resp = client.search(collection_name=collection, query_vector=vector, limit=top_k)
        hits = []
        for h in resp:
            hits.append({"id": h.id, "score": h.score, "payload": h.payload})
        return json.dumps(hits)
else:
    # qdrant-client not installed or not configured: do not register these tools.
    pass
