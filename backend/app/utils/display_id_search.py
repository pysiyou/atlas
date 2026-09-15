"""Resolve numeric entity ids from search terms (raw digits or prefixed display ids e.g. PAT0001)."""
import re
from typing import Optional


def parse_display_id_from_search(search_term: str, prefix: str) -> Optional[int]:
    compact = re.sub(r"[\s-]", "", search_term.strip())
    upper = compact.upper()
    pfx = prefix.upper()
    if upper.startswith(pfx) and len(upper) > len(pfx):
        suffix = upper[len(pfx) :]
        if suffix.isdigit():
            return int(suffix)
    if compact.isdigit():
        return int(compact)
    return None
