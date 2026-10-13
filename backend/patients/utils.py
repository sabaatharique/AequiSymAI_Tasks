import re

MOBILE_RE = re.compile(r"01\d{9}")


def normalize_mobile(value):
    s = re.sub(r"[\s-]", "", str(value))   
    if s.endswith(".0"):                    
        s = s[:-2]
    if len(s) == 10 and s.startswith("1"):  
        s = "0" + s
    return s if MOBILE_RE.fullmatch(s) else None