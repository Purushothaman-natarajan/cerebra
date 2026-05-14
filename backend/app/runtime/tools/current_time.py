"""Current time tool — returns current date/time in specified timezone."""

from datetime import datetime, timezone, timedelta
from app.runtime.tools.registry import register

_TIMEZONE_OFFSETS: dict[str, timedelta] = {
    "utc": timedelta(0),
    "est": timedelta(hours=-5),
    "edt": timedelta(hours=-4),
    "cst": timedelta(hours=-6),
    "cdt": timedelta(hours=-5),
    "mst": timedelta(hours=-7),
    "mdt": timedelta(hours=-6),
    "pst": timedelta(hours=-8),
    "pdt": timedelta(hours=-7),
    "cet": timedelta(hours=1),
    "eet": timedelta(hours=2),
    "ist": timedelta(hours=5, minutes=30),
    "jst": timedelta(hours=9),
    "aest": timedelta(hours=10),
    "nzst": timedelta(hours=12),
}


def _parse_timezone(tz_str: str) -> timedelta:
    key = tz_str.strip().lower().replace(" ", "_")
    if key in _TIMEZONE_OFFSETS:
        return _TIMEZONE_OFFSETS[key]
    try:
        sign = 1 if tz_str.strip()[0] != "-" else -1
        num = tz_str.strip().lstrip("+-")
        parts = num.split(":")
        hours = int(parts[0])
        minutes = int(parts[1]) if len(parts) > 1 else 0
        return timedelta(hours=sign * hours, minutes=sign * minutes)
    except (ValueError, IndexError):
        return timedelta(0)


@register("current_time")
async def current_time(timezone_str: str = "UTC") -> str:
    """Get the current date and time. Input: optional timezone (UTC, EST, PST, IST, +05:30, etc.). Output: formatted datetime string."""
    try:
        offset = _parse_timezone(timezone_str)
        now = datetime.now(timezone.utc) + offset
        return now.strftime("%Y-%m-%d %H:%M:%S %Z").replace(" %Z", f" (UTC{offset.total_seconds()/3600:+.0f})" if offset.total_seconds() else " UTC")
    except Exception:
        return f"Error: Could not parse timezone '{timezone_str}'"
