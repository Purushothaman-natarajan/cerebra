from app.runtime.tools.registry import register


@register("calculator")
async def calculator(expression: str) -> str:
    """Evaluate a mathematical expression. Input: a math expression string. Output: numeric result."""
    try:
        result = eval(expression, {"__builtins__": {}}, {})
        return str(result)
    except Exception as e:
        return f"Error: {e}"
