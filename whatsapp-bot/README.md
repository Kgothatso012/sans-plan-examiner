# Tshwane Plan Examiner Bot

WhatsApp bot for building plan compliance checking. Ratepayer sends building plan photo → AI analyzes → returns compliance status.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your WhatsApp/MiniMax/Supabase credentials

# 3. Run locally
npm start
```

## WhatsApp Setup

1. Go to [Meta Developers](https://developers.facebook.com/)
2. Create WhatsApp App → WhatsApp
3. Get credentials:
   - `WHATSAPP_TOKEN` (temporary access token from "API Setup")
   - `WHATSTTAPP_PHONE_NUMBER_ID` from "Phone Number" section
4. Configure webhook URL to your deployed URL + `/webhook`
5. Verify token: `WHATSAPP_VERIFY_TOKEN`

## Supabase Setup (Optional)

1. Create Supabase project
2. Run `supabase-schema.sql` in SQL Editor
3. Add credentials to `.env`

## Usage

| User types/sends | Bot responds |
|-----------------|-------------|
| "hi" / "hello" | Welcome message |
| "help" | Commands list |
| "demo" | Sample analysis |
| Plan photo | Compliance check |

## Compliance Checks

The bot checks:
- **Coverage**: Max 60% for residential
- **Zoning**: Residential/Commercial/Industrial
- **Setbacks**: 3m front, 1.5m sides
- **Height**: Max 3 storeys

## Deployment

```bash
# Deploy to Render/Railway/etc.
# Environment variables required:
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_VERIFY_TOKEN=...
MINIMAX_API_KEY=...
```

## Demo Output

```
🏠 TSHWANE PLAN CHECK

━━━━━━━━━━━━━━━━━━━━

✅ Building Coverage
   Max 60% coverage for residential
   Status: PASS

✅ Zoning
   Residential/Commercial/Industrial indicated
   Status: PASS

✅ Setbacks
   Minimum 3m front, 1.5m sides
   Status: PASS

✅ Building Height
   Max 3 storeys or per zoning
   Status: PASS

━━━━━━━━━━━━━━━━━━━━

Summary: LIKELY_COMPLIANT
Passed: 4/4

✨ Plan appears compliant.
Submit to Building Control for final approval.

---
_Powered by AI for Tshwane_
```

## Files

```
tshwane-whatsapp-bot/
├── index.js           # Main bot code
├── package.json      # Dependencies
├── .env.example     # Environment template
├── supabase-schema.sql  # Database schema
└── README.md       # This file
```