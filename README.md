# SANS Plan Examiner 🏗️

> AI-powered building plan compliance checking against SANS 10400 — upload PDF, get an audit report in minutes.

Built for South African building professionals, the examiner checks submitted building plans against 30+ SANS 10400 clauses and returns a structured audit report highlighting non-compliant areas.

## Features

- **PDF Upload** — Drag-and-drop building plan upload
- **Clause Coverage** — Checks against SANS 10400-L, M, N, J and more
- **AI Analysis** — GPT-powered audit with specific clause references
- **Structured Report** — Non-compliant items grouped by clause number
- **Reference Links** — Direct links to SANS text for each finding
- **Batch Processing** — Queue multiple plans for review

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML + CSS + Vanilla JS |
| Backend | Flask (Python) |
| AI | OpenAI GPT-4 / MiniMax |
| PDF Parsing | PyMuPDF |
| File Storage | Local + URL references |

## Getting Started

```bash
# Clone
git clone https://github.com/Kgothatso012/sans-plan-examiner.git
cd sans-plan-examiner

# Install dependencies
pip install -r requirements.txt

# Run locally
flask run --host 0.0.0.0 --port 5000

# Open browser
open http://localhost:5000
```

## Covered SANS Clauses

| Clause | Topic |
|--------|-------|
| SANS 10400-L | Site operations |
| SANS 10400-M | Structural design |
| SANS 10400-N | Fire safety |
| SANS 10400-J | Occupancy standards |
| SANS 10400-A | General requirements |
| SANS 10400-R | Plumbing |
| SANS 10400-G | Environmental sustainability |

## Example Output

```
NON-COMPLIANT FINDINGS:
├── Clause SANS 10400-L:2021 §4.2.1
│   → Setback distance insufficient (2.1m found, 3m required)
├── Clause SANS 10400-N:2019 §7.3.2
│   → Emergency exit width below minimum (800mm required)
└── Clause SANS 10400-G:2020 §3.1
    → Sustainable drainage plan not attached
```

## License

MIT
