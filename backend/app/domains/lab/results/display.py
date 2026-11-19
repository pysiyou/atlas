"""Order-line display ids used on worklists and audit search."""
from app.shared.clinical import looks_like_accession, looks_like_mnemonic


def format_order_test_display(accession: str | None, test_code: str | None) -> str:
    acc = (accession or "").strip()
    code = (test_code or "").strip().upper()
    if acc and code:
        return f"{acc}/{code}"
    return acc or code or "-"


def parse_order_test_display_search(term: str) -> tuple[str, str] | None:
    trimmed = term.strip()
    slash = trimmed.find("/")
    if slash <= 0:
        return None
    accession = trimmed[:slash].strip()
    test_code = trimmed[slash + 1 :].strip().upper()
    if not looks_like_accession(accession) or not looks_like_mnemonic(test_code):
        return None
    return accession, test_code
