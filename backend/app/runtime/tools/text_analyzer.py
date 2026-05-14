"""Text analysis tool — word count, char count, line count, frequency analysis."""

import json
import re
from collections import Counter
from app.runtime.tools.registry import register


@register("text_analyzer")
async def text_analyzer(text: str) -> str:
    """Analyze text: count words, characters, lines, sentences, and most common words. Input: text to analyze. Output: JSON with statistics."""
    try:
        words = text.split()
        chars = len(text)
        lines = text.count("\n") + 1
        sentences = len(re.split(r"[.!?]+", text)) - 1
        non_space_chars = len(text.replace(" ", "").replace("\n", "").replace("\r", ""))
        word_freq = Counter(w.lower().strip(".,!?;:()[]\"'") for w in words if w.strip(".,!?;:()[]\"'"))
        most_common = word_freq.most_common(10)
        unique_words = len(word_freq)

        result = {
            "word_count": len(words),
            "character_count": chars,
            "non_space_characters": non_space_chars,
            "line_count": lines,
            "sentence_count": sentences,
            "unique_words": unique_words,
            "avg_word_length": round(sum(len(w) for w in words) / len(words), 2) if words else 0,
            "most_common_words": [{"word": w, "count": c} for w, c in most_common],
        }
        return json.dumps(result, indent=2)
    except Exception:
        return "Error: Text analysis failed"
