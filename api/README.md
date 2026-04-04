# Tshwane Examiner - Unified API

Single server for all channels.

## Quick Start

```bash
cd tshwane-ai-system
npm install
cp .env.example .env
# Edit .env with your keys
npm start
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/analyze` | POST | Analyze building plan |
| `/api/faq` | POST | Zoning Q&A |
| `/api/triage` | POST | Route complaint |
| `/api/parse` | POST | Extract from document |

## Environment Variables

```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxxxx

# MiniMax AI
MINIMAX_API_KEY=your-key

# Bot (optional)
TELEGRAM_BOT_TOKEN=xxxxx
WHATSAPP_TOKEN=xxxxx
WHATSAPP_PHONE_NUMBER_ID=xxxxx

# Server
PORT=3000
```

## Usage

**Analyze plan:**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -F "plan=@plan.pdf" \
  -F "erf=12345" \
  -F "address=123 Main St"
```

**FAQ:**
```bash
curl -X POST http://localhost:3000/api/faq \
  -H "Content-Type: application/json" \
  -d '{"question": "can i build a pool"}'
```

**Complaint:**
```bash
curl -X POST http://localhost:3000/api/triage \
  -H "Content-Type: application/json" \
  -d '{"complaint": "pothole on Main St", "location": "Main St"}'
```

## For Bots

Set Telegram webhook:
```
https://your-domain.com/telegram
```

Set WhatsApp webhook:
```
https://your-domain.com/whatsapp
```