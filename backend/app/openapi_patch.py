"""Post-process the OpenAPI schema to add singular `example` from `examples` arrays.

Swagger UI pre-populates "Try it out" request bodies from the singular `example` field.
Pydantic v2's `Field(examples=[...])` only generates the plural `examples` array.
This patch copies the first value from `examples` to `example` for every schema property,
both in request bodies and response models.
"""


def patch_openapi_schema(schema: dict) -> dict:
    """Walk the OpenAPI schema and add singular `example` from `examples` arrays."""
    _walk(schema)
    return schema


def _walk(node):
    """Recursively walk schema nodes."""
    if isinstance(node, dict):
        # If this node has both 'examples' (list) and no 'example', set example from first item
        if "examples" in node and isinstance(node["examples"], list) and node["examples"]:
            if "example" not in node:
                node["example"] = node["examples"][0]

        # Handle properties (request/response schemas)
        if "properties" in node:
            for prop_name, prop in node["properties"].items():
                if isinstance(prop, dict):
                    _add_singular_example(prop)

        # Handle array items
        if "items" in node:
            _walk(node["items"])

        # Handle oneOf / anyOf / allOf
        for key in ("oneOf", "anyOf", "allOf"):
            if key in node:
                for item in node[key]:
                    _walk(item)

        # Handle additionalProperties
        if "additionalProperties" in node and isinstance(node["additionalProperties"], dict):
            _walk(node["additionalProperties"])

        # Recurse into all sub-dicts
        for key, value in node.items():
            if isinstance(value, dict):
                _walk(value)
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        _walk(item)

    return node


def _add_singular_example(prop: dict):
    """Add singular `example` from `examples` array if missing."""
    if "examples" in prop and isinstance(prop["examples"], list) and prop["examples"]:
        if "example" not in prop:
            prop["example"] = prop["examples"][0]
