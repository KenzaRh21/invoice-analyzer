import re
from typing import Optional, Tuple, Dict, Any

# ISO 4217 Currency Code Registry with symbols, alternate names, and locales
CURRENCY_REGISTRY: Dict[str, Dict[str, Any]] = {
    "USD": {
        "name": "US Dollar",
        "symbol": "$",
        "aliases": ["US DOLLAR", "US DOLLARS", "UNITED STATES DOLLAR", "USD", "US$", "U.S.D.", "DOLLAR", "DOLLARS"],
        "symbols": ["$"]
    },
    "EUR": {
        "name": "Euro",
        "symbol": "€",
        "aliases": ["EURO", "EUROS", "EUR", "€"],
        "symbols": ["€"]
    },
    "GBP": {
        "name": "British Pound",
        "symbol": "£",
        "aliases": ["POUND", "POUNDS", "POUND STERLING", "BRITISH POUND", "GBP", "£"],
        "symbols": ["£"]
    },
    "MAD": {
        "name": "Moroccan Dirham",
        "symbol": "DH",
        "aliases": ["MAD", "MOROCCAN DIRHAM", "DIRHAM MAROCAIN", "DIRHAMS MAROCAINS", "DH MAROCAIN", "د.م.", "درهم مغربي"],
        "symbols": ["DH", "DHS"]
    },
    "AED": {
        "name": "UAE Dirham",
        "symbol": "AED",
        "aliases": ["AED", "UAE DIRHAM", "EMIRATI DIRHAM", "DIRHAMS EMIRATIS", "د.إ", "درهم إماراتي"],
        "symbols": ["AED"]
    },
    "CAD": {
        "name": "Canadian Dollar",
        "symbol": "C$",
        "aliases": ["CAD", "CANADIAN DOLLAR", "CAN$", "C$", "DOLLAR CANADIEN"],
        "symbols": ["C$", "CAN$"]
    },
    "CHF": {
        "name": "Swiss Franc",
        "symbol": "CHF",
        "aliases": ["CHF", "SWISS FRANC", "FRANC SUISSE", "S閒", "SFR", "FS"],
        "symbols": ["CHF", "SFr"]
    },
    "SAR": {
        "name": "Saudi Riyal",
        "symbol": "SAR",
        "aliases": ["SAR", "SAUDI RIYAL", "RIYAL", "SR", "ر.س", "ريال سعودي"],
        "symbols": ["SAR", "SR"]
    },
    "QAR": {
        "name": "Qatari Riyal",
        "symbol": "QAR",
        "aliases": ["QAR", "QATARI RIYAL", "QR", "ر.ق", "ريال قطري"],
        "symbols": ["QAR", "QR"]
    },
    "KWD": {
        "name": "Kuwaiti Dinar",
        "symbol": "KWD",
        "aliases": ["KWD", "KUWAITI DINAR", "KD", "د.ك", "دينار كويتي"],
        "symbols": ["KWD", "KD"]
    },
    "JPY": {
        "name": "Japanese Yen",
        "symbol": "¥",
        "aliases": ["JPY", "JAPANESE YEN", "YEN", "円", "¥"],
        "symbols": ["¥"]
    },
    "CNY": {
        "name": "Chinese Yuan",
        "symbol": "¥",
        "aliases": ["CNY", "RMB", "CHINESE YUAN", "RENMINBI", "YUAN", "元"],
        "symbols": ["CNY", "RMB"]
    },
    "INR": {
        "name": "Indian Rupee",
        "symbol": "₹",
        "aliases": ["INR", "INDIAN RUPEE", "RUPEE", "RUPEES", "RS", "₹"],
        "symbols": ["₹", "Rs"]
    },
    "AUD": {
        "name": "Australian Dollar",
        "symbol": "A$",
        "aliases": ["AUD", "AUSTRALIAN DOLLAR", "AU$", "A$"],
        "symbols": ["A$", "AU$"]
    },
    "SGD": {
        "name": "Singapore Dollar",
        "symbol": "S$",
        "aliases": ["SGD", "SINGAPORE DOLLAR", "S$"],
        "symbols": ["S$"]
    },
    "SEK": {
        "name": "Swedish Krona",
        "symbol": "kr",
        "aliases": ["SEK", "SWEDISH KRONA", "KRONA"],
        "symbols": ["kr"]
    },
    "NOK": {
        "name": "Norwegian Krone",
        "symbol": "kr",
        "aliases": ["NOK", "NORWEGIAN KRONE", "KRONE"],
        "symbols": []
    },
    "DKK": {
        "name": "Danish Krone",
        "symbol": "kr",
        "aliases": ["DKK", "DANISH KRONE"],
        "symbols": []
    },
    "BHD": {
        "name": "Bahraini Dinar",
        "symbol": "BHD",
        "aliases": ["BHD", "BAHRAINI DINAR", "BD", "د.ب"],
        "symbols": ["BHD", "BD"]
    },
    "OMR": {
        "name": "Omani Rial",
        "symbol": "OMR",
        "aliases": ["OMR", "OMANI RIAL", "RO", "ر.ع"],
        "symbols": ["OMR", "RO"]
    },
    "ZAR": {
        "name": "South African Rand",
        "symbol": "R",
        "aliases": ["ZAR", "RAND", "SOUTH AFRICAN RAND"],
        "symbols": ["R"]
    },
    "BRL": {
        "name": "Brazilian Real",
        "symbol": "R$",
        "aliases": ["BRL", "BRAZILIAN REAL", "REAL", "R$"],
        "symbols": ["R$"]
    },
    "MXN": {
        "name": "Mexican Peso",
        "symbol": "Mex$",
        "aliases": ["MXN", "MEXICAN PESO", "PESO", "MEX$"],
        "symbols": ["Mex$"]
    }
}

MOROCCO_CONTEXT_KEYWORDS = [
    "maroc", "morocco", "casablanca", "rabat", "tanger", "marrakech", "fes", "agadir",
    "kenitra", "oujda", "tetouan", "laayoune", "dakhla", "ice", "identifiant commun",
    "patente", "if", "identifiant fiscal", "cnss", "rc", "registre du commerce", "sarl", "sa au capital"
]

UAE_CONTEXT_KEYWORDS = [
    "uae", "united arab emirates", "dubai", "abu dhabi", "sharjah", "ajman", "trn", "tax registration number"
]

CANADA_CONTEXT_KEYWORDS = [
    "canada", "canadian", "toronto", "montreal", "vancouver", "quebec", "ontario", "gst", "hst", "tvq"
]

AUSTRALIA_CONTEXT_KEYWORDS = [
    "australia", "sydney", "melbourne", "brisbane", "abn", "acn"
]

def normalize_currency(raw_currency: Optional[str], text_context: Optional[str] = None) -> Optional[str]:
    """
    Normalizes any currency string, symbol, or name to an ISO 4217 3-letter code.
    Never assumes MAD.
    If currency cannot be determined: returns None (or UNKNOWN).
    Context is checked to disambiguate symbols like '$', 'DH', '¥', etc.
    """
    if not raw_currency:
        # Check text context directly if raw_currency is missing
        if text_context:
            return infer_currency_from_text(text_context)
        return None

    cleaned = str(raw_currency).strip()
    if not cleaned or cleaned.upper() in ["NONE", "NULL", "UNKNOWN", "N/A", ""]:
        if text_context:
            return infer_currency_from_text(text_context)
        return None

    upper = cleaned.upper()
    ctx_lower = (text_context or "").lower()

    # 1. Exact match against ISO codes in registry
    if upper in CURRENCY_REGISTRY:
        return upper

    # 2. Check for exact 3-letter standard uppercase code pattern
    if re.fullmatch(r"^[A-Z]{3}$", upper):
        return upper

    # 3. Disambiguate Dollar ($)
    if cleaned in ["$", "US$", "USD$", "$USD", "U.S.$"]:
        if any(kw in ctx_lower for kw in CANADA_CONTEXT_KEYWORDS) or "can$" in cleaned.lower() or "cad" in cleaned.lower():
            return "CAD"
        if any(kw in ctx_lower for kw in AUSTRALIA_CONTEXT_KEYWORDS) or "au$" in cleaned.lower() or "aud" in cleaned.lower():
            return "AUD"
        return "USD"

    # 4. Disambiguate Dirham (DH / DHS / درهم / د.م.)
    if upper in ["DH", "DHS", "DIRHAM", "DIRHAMS", "د.م.", "درهم"]:
        if any(kw in ctx_lower for kw in UAE_CONTEXT_KEYWORDS):
            return "AED"
        if any(kw in ctx_lower for kw in MOROCCO_CONTEXT_KEYWORDS):
            return "MAD"
        # If document text has French words or .ma domain or French tax terms
        if re.search(r"\b(ice|rc|cnss|tva|société|sarl|maroc)\b", ctx_lower):
            return "MAD"
        # If clearly Arabic UAE vs Moroccan
        if "د.إ" in cleaned or "emirat" in ctx_lower:
            return "AED"
        # Default to MAD only if DH / DHS found and not UAE
        return "MAD"

    # 5. Euro symbols & names
    if cleaned in ["€", "EUR", "Euro", "Euros", "EURO", "EUROS"]:
        return "EUR"

    # 6. Pound symbols & names
    if cleaned in ["£", "GBP", "Pound", "Pounds", "POUND", "POUNDS"]:
        return "GBP"

    # 7. Yen / Yuan
    if cleaned in ["¥", "YEN", "YUAN", "RMB", "円", "元"]:
        if "cny" in cleaned.lower() or "rmb" in cleaned.lower() or "yuan" in cleaned.lower() or "china" in ctx_lower:
            return "CNY"
        return "JPY"

    # 8. Check all registry aliases
    for code, info in CURRENCY_REGISTRY.items():
        for alias in info["aliases"]:
            if upper == alias:
                return code
            if len(alias) >= 3 and alias in upper:
                return code

    # 9. Fallback inference from surrounding text
    if text_context:
        inferred = infer_currency_from_text(text_context)
        if inferred:
            return inferred

    return None

def infer_currency_from_text(text: str) -> Optional[str]:
    """Scans text for explicit currency mentions or strong symbol evidence."""
    if not text:
        return None
    t = text.lower()

    # Prioritize explicit ISO codes near amounts
    if re.search(r"\b(usd|\$|u\.s\.d)\b", t):
        if not re.search(r"\b(cad|aud|nzd|hkd)\b", t):
            return "USD"
    if re.search(r"(\beur\b|€|\beuro(s)?\b)", t):
        return "EUR"
    if re.search(r"(\bgbp\b|£|\bpound(s)?\b|\bsterling\b)", t):
        return "GBP"
    if re.search(r"\b(chf|franc suisse|swiss franc)\b", t):
        return "CHF"
    if re.search(r"\b(cad|dollar canadien)\b", t):
        return "CAD"
    if re.search(r"\b(aud|australian dollar)\b", t):
        return "AUD"
    if re.search(r"\b(sar|saudi riyal|ريال سعودي)\b", t):
        return "SAR"
    if re.search(r"\b(qar|qatari riyal|ريال قطري)\b", t):
        return "QAR"
    if re.search(r"\b(aed|uae dirham|درهم إماراتي)\b", t):
        return "AED"
    if re.search(r"\b(mad|dh|dhs|dirham marocain|د\.م\.)\b", t):
        return "MAD"
    if re.search(r"\b(jpy|yen|¥)\b", t):
        return "JPY"

    return None

def parse_localized_amount(val: Any) -> Optional[float]:
    """
    Parses numeric amounts respecting international format differences:
    - 1,250.50 (US/UK: comma thousands, dot decimal)
    - 1.250,50 (European: dot thousands, comma decimal)
    - 1 250,50 (French/Moroccan: space thousands, comma decimal)
    - 10 000.00 (space thousands, dot decimal)
    - 1250 (integers)
    """
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)

    s = str(val).strip()
    if not s:
        return None

    # Remove currency symbols and non-numeric except , . - and space
    # Clean out characters like $, €, £, DH, MAD, etc.
    s = re.sub(r"[^\d,\.\-\s]", "", s).strip()
    if not s:
        return None

    # Replace non-breaking spaces with standard space
    s = s.replace("\u00a0", " ").replace("\u202f", " ")

    # Case 1: Has both dot and comma
    if "." in s and "," in s:
        dot_idx = s.rfind(".")
        comma_idx = s.rfind(",")
        if dot_idx > comma_idx:
            # 1,250.50 -> comma is thousand, dot is decimal
            clean_str = s.replace(",", "").replace(" ", "")
            try:
                return float(clean_str)
            except ValueError:
                pass
        else:
            # 1.250,50 -> dot is thousand, comma is decimal
            clean_str = s.replace(".", "").replace(" ", "").replace(",", ".")
            try:
                return float(clean_str)
            except ValueError:
                pass

    # Case 2: Only comma
    elif "," in s:
        # e.g. "1250,50" or "10,000"
        parts = s.split(",")
        if len(parts) == 2 and len(parts[1].strip()) in [1, 2]:
            # Decimal comma: 1250,50 -> 1250.50
            clean_str = parts[0].replace(" ", "") + "." + parts[1].strip()
            try:
                return float(clean_str)
            except ValueError:
                pass
        elif len(parts) == 2 and len(parts[1].strip()) == 3 and " " not in parts[0]:
            # Could be thousand separator: "10,000" -> 10000.0
            clean_str = parts[0] + parts[1].strip()
            try:
                return float(clean_str)
            except ValueError:
                pass
        else:
            # Multiple commas: 1,000,000
            clean_str = s.replace(",", "").replace(" ", "")
            try:
                return float(clean_str)
            except ValueError:
                pass

    # Case 3: Only dot
    elif "." in s:
        parts = s.split(".")
        if len(parts) == 2 and len(parts[1].strip()) in [1, 2]:
            # Standard decimal: 1250.50
            clean_str = parts[0].replace(" ", "") + "." + parts[1].strip()
            try:
                return float(clean_str)
            except ValueError:
                pass
        elif len(parts) == 2 and len(parts[1].strip()) == 3 and len(parts[0].replace(" ", "")) <= 3:
            # European thousand without decimal: 10.000 -> 10000
            clean_str = parts[0].replace(" ", "") + parts[1].strip()
            try:
                return float(clean_str)
            except ValueError:
                pass
        else:
            clean_str = s.replace(" ", "")
            try:
                return float(clean_str)
            except ValueError:
                pass

    # Case 4: Only spaces and digits
    else:
        clean_str = s.replace(" ", "")
        try:
            return float(clean_str)
        except ValueError:
            pass

    return None

def validate_financial_math(
    subtotal: Optional[float],
    tax: Optional[float],
    total: Optional[float],
    tolerance: float = 0.05
) -> Tuple[bool, Optional[str]]:
    """
    Validates arithmetic consistency in the invoice's detected currency:
    Subtotal + Tax == Total.
    """
    sub = subtotal or 0.0
    tx = tax or 0.0
    tot = total or 0.0

    if tot <= 0 and sub <= 0:
        return False, "Total amount is zero or missing."

    expected_tot = round(sub + tx, 2)
    diff = abs(expected_tot - round(tot, 2))

    if diff <= tolerance:
        return True, None

    # If subtotal is present and total is present but tax was not broken out:
    if tx == 0.0 and sub > 0 and abs(sub - tot) <= tolerance:
        return True, None

    return False, f"Arithmetic mismatch: Subtotal ({sub}) + Tax ({tx}) = {expected_tot}, but Total is {tot} (discrepancy: {round(diff, 2)})"
