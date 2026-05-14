"""CIRCL CVE lookup tool."""

import json
import re

import httpx

from app.runtime.tools.registry import register

_CVE_RE = re.compile(r"CVE-\d{4}-\d{4,}", re.IGNORECASE)


def _extract_cve_id(payload: str) -> str:
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        data = payload

    if isinstance(data, dict):
        for key in ("cve", "cve_id", "id", "query"):
            value = data.get(key)
            if isinstance(value, str):
                match = _CVE_RE.search(value)
                if match:
                    return match.group(0).upper()
    elif isinstance(data, str):
        match = _CVE_RE.search(data)
        if match:
            return match.group(0).upper()

    return ""


@register("circl_cve")
async def circl_cve(payload: str) -> str:
    """Look up a CVE in CIRCL's public vulnerability database. Input: CVE ID or JSON {cve}. Output: summary, scores, references."""
    cve_id = _extract_cve_id(payload)
    if not cve_id:
        return "Error: Provide a CVE ID such as CVE-2024-3094"

    url = f"https://cve.circl.lu/api/cve/{cve_id}"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url)
            if resp.status_code == 404:
                return f"No CIRCL CVE record found for {cve_id}"
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        return "Error: CIRCL CVE lookup failed"

    summary = data.get("summary") or data.get("containers", {}).get("cna", {}).get("descriptions", [{}])[0].get("value", "")
    cvss = data.get("cvss") or data.get("cvss3") or data.get("cvss4")
    published = data.get("Published") or data.get("published") or data.get("cveMetadata", {}).get("datePublished")
    modified = data.get("Modified") or data.get("last-modified") or data.get("cveMetadata", {}).get("dateUpdated")
    references = data.get("references") or data.get("containers", {}).get("cna", {}).get("references", [])

    if isinstance(references, dict):
        references = references.get("reference_data", [])

    ref_urls = []
    for ref in references[:5]:
        if isinstance(ref, dict):
            ref_urls.append(ref.get("url") or ref.get("href") or "")
        elif isinstance(ref, str):
            ref_urls.append(ref)
    ref_urls = [url for url in ref_urls if url]

    lines = [f"{cve_id}"]
    if cvss:
        lines.append(f"CVSS: {cvss}")
    if published:
        lines.append(f"Published: {published}")
    if modified:
        lines.append(f"Modified: {modified}")
    if summary:
        lines.append(f"Summary: {summary}")
    if ref_urls:
        lines.append("References:\n" + "\n".join(ref_urls))

    return "\n".join(lines)[:5000]
