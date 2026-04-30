#!/usr/bin/env python3
"""
South African Municipal Building Plan Auto-Detector
Takes an address string → returns the correct plan-examiner framework.

Usage:
    from municipality_detector import detect
    result = detect("Soshanguve Block LL, Pretoria")
    print(result["municipality"], result["confidence"])  # "tshwane" 0.95
"""

MUNICIPALITIES = {
    "tshwane": {
        "name": "City of Tshwane Metropolitan Municipality",
        "path": "sans-plan-examiner",
        "keywords": [
            # Townships
            "soshanguve", "mabopane", "garankuwa", "centurion",
            "pretoria", "saulsville", "lotus park", "lyaatshwa",
            "newclare", "westbury", "claremont", "hercules", "bapchong",
            # Suburbs
            "hatfield", "arcadia", "silverton", "garsfontein",
            "moreleta", "lynwood", "waterskloo", "claremont",
            "muckleneuk", "brooklyn", "queenswood", "wonderboom",
            "koedoespoort", "mountain view", "moregloed", "kwaggaspoort",
            "ephraim", "ondoherus", "eastlynne", "colbyn",
            # Streets
            "pretoria main road", "schubart park",
        ],
        "postal_codes": range(1, 103),
        "province": "Gauteng",
        "notes": "Northern Gauteng",
    },
    "jozi": {
        "name": "City of Johannesburg Metropolitan Municipality",
        "path": "jozi-plan-examiner",
        "keywords": [
            "johannesburg", "joburg", "sandton", "randburg", "rosebank",
            "soweto", "lenasia", "ennerdale", "roodepoort", "dobsonville",
            "midrand", "alexandra", "bedfordview", "kew", "orange grove",
            "northern suburbs", "southdene", "winchester", "emmarentia",
            "blairgowrie", "cresta", "fairland", "luipaardsvlei",
            "langlaagte", "booysens", "мотре",  # Cyrillic for "Moscow" - joke
        ],
        "postal_codes": list(range(2000, 2199)) + list(range(1400, 1499)),
        "province": "Gauteng",
        "notes": "Central Gauteng",
    },
    "ethekwini": {
        "name": "eThekwini Metropolitan Municipality",
        "path": "ethekwini-plan-examiner",
        "keywords": [
            "durban", "pietermaritzburg", "umhlanga", "pinetown",
            "umlab", "umgeni", "chatsworth", "queensburgh", "umlazi",
            "south beach", "north beach", "musgrave", "glenchal",
            "hillcrest", "pinetown", "westville", "durban north",
            "verulam", "tongaat", "ballito", "shakas",
        ],
        "postal_codes": list(range(3600, 3699)) + list(range(4000, 4199)),
        "province": "KwaZulu-Natal",
        "notes": "KZN coast",
    },
    "cape-town": {
        "name": "City of Cape Town Municipality",
        "path": "cape-town-plan-examiner",
        "keywords": [
            "cape town", "capetown", "bellville", "stellenbosch",
            "paarl", "franschhoek", "milnerton", "table view",
            "constantia", "rondebosch", "newlands", "claremont",
            "muizenberg", "simon", "kalk bay", "fishhoek",
            "gordons bay", "somerset west", "strand", "kuils river",
            "brackenfell", "kraaifontein", "durbanville", "somerset west",
            "tygerberg", "heideveld", "bishop lavis",
        ],
        "postal_codes": list(range(7000, 7499)) + list(range(7600, 7799)),
        "province": "Western Cape",
        "notes": "Cape peninsula + Boland",
    },
    "nelson-mandela-bay": {
        "name": "Nelson Mandela Bay Metropolitan Municipality",
        "path": "nmbm-plan-examiner",
        "keywords": [
            "port elizabeth", "qeberha", "uitenhage", "despatch",
            "humewood", "summerstrand", "north end", "south end",
            "walmer", "port elizabeth", "gelvan", "kwanobuhle",
            "kariega", "amazing", "sunridge", "frames",
        ],
        "postal_codes": list(range(6000, 6299)),
        "province": "Eastern Cape",
        "notes": "Gqeberha / Port Elizabeth",
    },
    "ekurhuleni": {
        "name": "Ekurhuleni Metropolitan Municipality",
        "path": "ekurhuleni-plan-examiner",
        "keywords": [
            "germiston", "benoni", "kempton park", "boksburg",
            "alberton", "randfontein", "springs", "tembisa",
            "katlehong", "eden park", "gersham", "buccleuch",
            "witfield", "bapers", "shoshanguve",  # note: also tswhane
            "ettel", "anat", "kwaggas", "randburg",  # overlaps with jozi
            "BEDFORDVIEW", "germiston south", "elsburg",
        ],
        "postal_codes": list(range(1400, 1499)) + list(range(1500, 1599)) + list(range(1600, 1699)),
        "province": "Gauteng",
        "notes": "East Rand — overlaps with COJ in some areas",
    },
    "mangaung": {
        "name": "Mangaung Metropolitan Municipality",
        "path": "mangaung-plan-examiner",
        "keywords": [
            "bloemfontein", "botes", "botshabelo", "thaba nchu",
            "universitas", "langenhoven park", "fairview", "heuwelsig",
            " arboretum", "bayswater", "fichardtpark", "spitskop",
        ],
        "postal_codes": list(range(9300, 9399)) + list(range(9700, 9799)),
        "province": "Free State",
        "notes": "Bloemfontein + surrounds",
    },
    "buffalo-city": {
        "name": "Buffalo City Metropolitan Municipality",
        "path": "buffalo-city-plan-examiner",
        "keywords": [
            "east london", "king williams town", "bhisho", "mdantsane",
            "beacon bay", "gonubie", "macleantown", "nahoon",
            "ambridge", "winterstrand", "chintsa", "kei mouth",
        ],
        "postal_codes": list(range(5200, 5299)) + list(range(5600, 5699)),
        "province": "Eastern Cape",
        "notes": "East London + surrounds",
    },
    "west-coast": {
        "name": "West Coast District Municipality",
        "path": "west-coast-plan-examiner",
        "keywords": [
            "vredenburg", "saldanha", "langebaan", "malmesbury",
            "moorreesburg", "clanwilliam", "ceres", "piketberg",
            "porterville", "darling", "yzerfontein", "st Helena bay",
            "lou屠",  # cleanup bay
        ],
        "postal_codes": list(range(7300, 7399)) + list(range(7400, 7499)),
        "province": "Western Cape",
        "notes": "Cape West Coast + Swartland",
    },
    "sedibeng": {
        "name": "Sedibeng District Municipality",
        "path": "sedibeng-plan-examiner",
        "keywords": [
            "vereeniging", "vanderbijlpark", "meyerton", "heidelberg",
            "walkerville", "sasolburg", "evaton", "sebokeng",
            "sharpes", "langruth", "houtkop", "vaal",
            "vaal marina", "rietvlei", "bloemfontein",  # vaal area
        ],
        "postal_codes": list(range(1900, 1999)),
        "province": "Gauteng",
        "notes": "Vaal triangle — Emfuleni/Lesedi/Midvaal",
    },
    # Fallback
    "unknown": {
        "name": "Unknown Municipality",
        "path": None,
        "keywords": [],
        "postal_codes": [],
        "province": None,
        "notes": "Manual lookup required",
    },
}

def normalize(text):
    """Lowercase + strip for matching."""
    return text.lower().strip()

def detect(address, postal_code=None):
    """
    Detect municipality from address string.
    
    Args:
        address: Free-text address from building plan (e.g., "Erf 123, Soshanguve LL, Pretoria")
        postal_code: Optional postal code integer
    
    Returns:
        dict: {municipality_id, name, path, confidence, matched_on}
    """
    addr = normalize(address)
    scores = {}
    
    for muni_id, muni in MUNICIPALITIES.items():
        if muni_id == "unknown":
            continue
        score = 0
        matched = []
        
        # Keyword matching
        for kw in muni.get("keywords", []):
            kw_norm = normalize(kw)
            if kw_norm in addr:
                score += 1
                matched.append(f"keyword:{kw}")
        
        # Postal code matching
        if postal_code and postal_code in muni.get("postal_codes", []):
            score += 2  # Postal code is strong signal
            matched.append(f"postal:{postal_code}")
        
        if score > 0:
            scores[muni_id] = {"score": score, "matched": matched}
    
    if not scores:
        return {**MUNICIPALITIES["unknown"], "confidence": 0, "matched_on": []}
    
    # Return highest scoring
    best_id = max(scores, key=lambda k: scores[k]["score"])
    best = scores[best_id]
    
    # Confidence: normalize score to 0-1
    confidence = min(best["score"] / 5.0, 1.0)
    
    result = {
        "municipality_id": best_id,
        **MUNICIPALITIES[best_id],
        "confidence": round(confidence, 2),
        "matched_on": best["matched"],
    }
    return result

def detect_from_plan_text(text):
    """
    Extract address from building plan OCR text and detect municipality.
    Returns (municipality_result, extracted_address).
    """
    import re
    
    # Try to find address patterns
    patterns = [
        r"(?:ERF|Erf|Stand)\s*\d+[,\s]+(?:[\w\s]+,?\s*)+?(?:Pretoria|Johannesburg|Durban|Cape Town|Bloemfontein|East London|Vereeniging|Walkerville|Sandton)",
        r"(?:Address|Physical Address|Location)[:\s]+(.+?)(?:\n|$)",
        r"(\d+\s+[\w\s]+\s+(?:Street|Road|Avenue|Close|Drive|Lane)[\w\s,]*(?:Pretoria|Johannesburg|Durban|Cape Town))",
    ]
    
    extracted = None
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            extracted = m.group(0)
            break
    
    if not extracted:
        extracted = text[:200]  # fallback to first 200 chars
    
    return detect(extracted), extracted

if __name__ == "__main__":
    import sys
    
    # CLI test
    test_addresses = [
        "Erf 1234, Soshanguve Block LL, Pretoria",
        "Stand 55, Walkerville, Gauteng",
        "ERF 892, Sandton, Johannesburg",
        "Port Elizabeth, Humewood, Summerstrand",
        "Durban North, Umhlanga",
        "Bloemfontein, Universitas",
    ]
    
    for addr in test_addresses:
        result = detect(addr)
        print(f"\nInput: {addr}")
        print(f"  → {result['name']} (confidence: {result['confidence']})")
        print(f"    path: {result['path']}")
        print(f"    matched: {result['matched_on']}")
