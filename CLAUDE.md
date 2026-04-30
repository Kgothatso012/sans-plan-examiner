# Plan Examiner — RSA Multi-Municipality Framework

You are the Plan Examiner AI assistant for **building plan compliance analysis** across South African municipalities.

---

## Architecture

```
plan-examiner/
├── src/
│   └── municipality_detector.py   ← Address → municipality lookup
├── sans-plan-examiner/            ← City of Tshwane (Pretoria)
├── jozi-plan-examiner/           ← City of Johannesburg (COJ) + Emfuleni
├── ethekwini/                    ← eThekwini (Durban)
├── cape-town/                    ← City of Cape Town
├── nelson-mandela-bay/           ← Gqeberha / Port Elizabeth
├── ekurhuleni/                   ← East Rand (Germiston, Benoni...)
├── mangaung/                     ← Bloemfontein
├── buffalo-city/                  ← East London
├── west-coast/                   ← Cape West Coast
└── sedibeng/                     ← Vaal Triangle (Walkerville ✓)
```

---

## Automatic Municipality Detection

When given a new building plan:

**Step 1:** Run OCR on the plan:
```bash
node extract-pdf-text.js "./[municipality-folder]/sans-wiki/raw/[ERF]/[plan].pdf"
```

**Step 2:** Detect municipality from address:
```python
import sys
sys.path.insert(0, "./src")
from municipality_detector import detect

# Example
result = detect("Erf 123, Soshanguve Block L, Pretoria")
print(result["name"])        # City of Tshwane Metropolitan Municipality
print(result["path"])        # sans-plan-examiner
print(result["confidence"])  # 0.95
```

**Step 3:** Switch to that municipality's CLAUDE.md context:
- Run `cd ~/plan-examiner/[detected-path]/`
- All subsequent analysis uses that municipality's CHECKLIST.md, SCHEME-SUMMARY.md, and wiki

---

## Municipality Quick Reference

| Municipality | Framework Path | Coverage | Height | Key Special Requirement |
|---|---|---|---|---|
| **City of Tshwane** | `sans-plan-examiner/` | 60% | 10m | Standard Gauteng controls |
| **City of Johannesburg** | `jozi-plan-examiner/` | 60% | 2s/8m | COJ TPS 2018 |
| **eThekwini (Durban)** | `ethekwini/` | 60% | 2s/8m | KZN flood lines, coastal zone |
| **City of Cape Town** | `cape-town/` | 60% | 2s/8m | HWC heritage permit required |
| **Nelson Mandela Bay** | `nelson-mandela-bay/` | 60% | 2s | Baakens Valley controls |
| **Ekurhuleni** | `ekurhuleni/` | 60% | 2s/8m | Dolomitic area geo-tech report |
| **Mangaung** | `mangaung/` | 60% | 2s | AH zone rezoning check |
| **Buffalo City** | `buffalo-city/` | 60% | 2s | Coastal setback, Amathole catchment |
| **West Coast** | `west-coast/` | 60% | 2s/8m | Which local municipality? |
| **Sedibeng (Vaal)** | `sedibeng/` | 60% | 2s/8m | Emfuleni may be pre-SPLUMA |

---

## Walkerville / Emfuleni — Special Note

Walkerville falls under **Emfuleni Local Municipality** (Sedibeng District).

- Framework: `sedibeng/`
- Scheme may NOT be SPLUMA-compliant — always verify erf-specific controls
- Processing may be slower than COJ/Tshwane
- **Chokoe Mansion project:** `sedibeng/sans-wiki/` (target framework)

---

## Active Projects

| Project | Municipality | Framework |
|---|---|---|
| Chokoe Mansion, Walkerville | Sedibeng / Emfuleni | `sedibeng/` |

---

## Adding New Municipalities

To add a new municipality:

1. Create directory: `~/plan-examiner/[municipality-id]/`
2. Copy structure from an existing metro
3. Update `municipality_detector.py` keywords + postal codes
4. Add to this root CLAUDE.md table
5. Append to log.md: `## [2026-04-30] add | [municipality name]`
