import ast
import operator

from app.runtime.tools.registry import register

_ALLOWED_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Pow: operator.pow,
    ast.Mod: operator.mod,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def _safe_eval(expr: str) -> float | int:
    tree = ast.parse(expr.strip(), mode="eval")
    return _eval_node(tree.body)


def _eval_node(node: ast.AST) -> float | int:
    if isinstance(node, ast.Expression):
        return _eval_node(node.body)
    if isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)):
            return node.value
        raise ValueError(f"Unsupported constant: {node.value}")
    if isinstance(node, ast.UnaryOp):
        op = _ALLOWED_OPS.get(type(node.op))
        if op is None:
            raise ValueError(f"Unsupported operator: {type(node.op).__name__}")
        return op(_eval_node(node.operand))
    if isinstance(node, ast.BinOp):
        op = _ALLOWED_OPS.get(type(node.op))
        if op is None:
            raise ValueError(f"Unsupported operator: {type(node.op).__name__}")
        return op(_eval_node(node.left), _eval_node(node.right))
    raise ValueError(f"Unsupported expression: {type(node).__name__}")


@register("calculator")
async def calculator(expression: str) -> str:
    """Evaluate a mathematical expression. Input: a math expression string (numbers, +, -, *, /, //, %, **). Output: numeric result."""
    try:
        result = _safe_eval(expression)
        return str(result)
    except Exception as e:
        return f"Error: {e}"
