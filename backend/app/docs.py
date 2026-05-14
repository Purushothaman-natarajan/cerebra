"""Helpers for adding explicit response examples to FastAPI route decorators.

Swagger UI uses these to show realistic "Example Value" previews for endpoints.
"""

from typing import Any


def response_example(data: Any) -> dict:
    """Returns a `responses` dict that adds a 200 response with an example body.

    Use on single-object endpoints:
        @router.get("/agent/{id}", responses=response_example({...}))
    """
    return {
        200: {
            "description": "Success",
            "content": {"application/json": {"example": data}},
        }
    }


def list_response_example(data: list[Any]) -> dict:
    """Returns a `responses` dict with an array example for list endpoints.

    Use on list endpoints:
        @router.get("/agents", responses=list_response_example([{...}]))
    """
    return {
        200: {
            "description": "Success",
            "content": {"application/json": {"example": data}},
        }
    }
