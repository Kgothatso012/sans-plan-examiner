# SANS-PLAN-EXAMINOR
## Tshwane Building Plan Examiner

Web-based building plan compliance checker for Tshwane Municipality. Analyzes PDF building plans against SANS 10400 building regulations.

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **PDF Upload** — Drag & drop building plans
- **AI Analysis** — MiniMax API checks plans against SANS 10400 clauses
- **Pin Comments** — Admin marks violations directly on PDF with red pins
- **Applicant Portal** — Clients track applications, view pinned comments, submit revisions
- **Email Notifications** — Automatic status updates to applicants
- **Real Authentication** — JWT-based login for clients

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (no framework)
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **AI**: MiniMax API
- **Email**: Nodemailer (SMTP)

## Quick Start

```bash
# Clone and install
git clone https://github.com/Kgothatso012/SANS-PLAN-EXAMINOR.git
cd SANS-PLAN-EXAMINOR
npm install

# Start server
npm start
```

Server runs at `http://localhost:3000`

## Project Structure

```
SANS-PLAN-EXAMINOR/
├── admin/          # Admin panel HTML
│   └── admin.html  # Review apps, add pin comments, run AI analysis
├── client/         # Applicant-facing pages
│   ├── apply.html  # Submit new application
│   ├── portal.html # Track applications, view pins, submit revisions
│   └── track.html  # Simple tracking page
├── src/
│   └── server.js   # Express API server
├── package.json
└── README.md
```

## Environment Variables

Create a `.env` file (or set via system):

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `SUPABASE_URL` | Supabase project URL | (embedded) |
| `SUPABASE_KEY` | Supabase anon key | (embedded) |
| `MINIMAX_API_KEY` | MiniMax API key for AI analysis | (embedded) |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASS` | SMTP password/app password | - |
| `SMTP_FROM` | From email address | `noreply@tshwane-examiner.gov.za` |
| `JWT_SECRET` | Secret for JWT tokens | (embedded) |
| `PORTAL_URL` | Public URL for email links | `http://localhost:3000` |

## Database Schema

Tables in Supabase:
- `applications` — Main application records
- `application_documents` — Uploaded PDF files
- `application_analysis` — AI analysis results
- `application_comments` — Pin comments with x/y coordinates
- `comment_replies` — Applicant replies to comments
- `application_revisions` — Revision history
- `applicants` — Client accounts

## Admin API Key

Default: `joe-examiner-secret-2024`

Pass via header: `x-api-key: joe-examiner-secret-2024`

## API Endpoints

### Applications
- `POST /api/applications/submit` — Submit new application
- `GET /api/applications?email=` — List applicant's applications
- `GET /api/applications/:id` — Get single application (admin)
- `GET /api/applications` — List all (admin)
- `PUT /api/applications/:id/status` — Update status (admin)

### Comments (with pins)
- `POST /api/applications/:id/comments` — Add comment with x/y position
- `GET /api/applications/:id/comments` — Get all comments
- `POST /api/comments/:id/reply` — Reply to comment

### Revisions
- `POST /api/applications/:id/revisions` — Submit revision
- `GET /api/applications/:id/revisions` — Get revisions

### AI Analysis
- `POST /api/applications/:id/analyze` — Run AI analysis (admin)

### Authentication
- `POST /api/auth/register` — Register new applicant
- `POST /api/auth/login` — Login applicant
- `GET /api/auth/me` — Get current user

## SANS 10400 Clauses Covered

- **Energy Efficiency**: XA1–XA10 (SANS 10400-XA:2010)
- **Building Standards**: B1 (Occupancy), B3 (Means of Egress)
- **Tshwane Checklists**: Site, Floor, Roof, Elevations, Sections, Structural

## Email Notifications

Emails sent automatically when:
- Application status changes (SUBMITTED → IN_REVIEW → APPROVED/REJECTED)
- New comment/pin added by examiner
- Revision submitted by applicant

Configure SMTP in environment variables for emails to work.

## License

MIT