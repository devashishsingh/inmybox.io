# InMyBox — DMARC Aggregation & Reporting Platform

A multi-tenant B2B SaaS platform that collects, parses, and visualizes DMARC aggregate reports. Reports are ingested automatically from a centralized Gmail mailbox via IMAP and routed to the correct tenant based on email alias mappings.

## Tech Stack

- **Framework:** Next.js 14 (App Router), React 18, TypeScript
- **Database:** PostgreSQL (Supabase) via Prisma ORM
- **Auth:** NextAuth v4 (Credentials + JWT sessions)
- **Email:** imapflow (IMAP), mailparser (parsing)
- **DMARC Parsing:** fast-xml-parser, jszip, 7zip-bin
- **UI:** Tailwind CSS, Recharts, Lucide React, Framer Motion
- **Export:** jsPDF + jspdf-autotable (PDF), CSV

## Features

### Admin Panel (`/admin`)
- Tenant provisioning and management
- User and invitation management
- Domain and email alias configuration
- Ingestion monitoring and report inspection

### Client Dashboard (`/dashboard`)
- DMARC report viewer (read-only, auto-populated via email)
- Sender intelligence with pass/fail breakdown
- Actions Required — auto-generated from ingestion analysis
- Analytics overview with trust scores and delivery metrics
- PDF/CSV export

### Email Ingestion Pipeline
1. Connects to Gmail IMAP → opens `dmarc_report` folder
2. Fetches unread emails → extracts attachments (.xml, .zip, .gz, .7z)
3. Routes to tenant by matching recipient address to alias mapping
4. Parses DMARC XML → normalizes records → stores in database
5. Updates sender stats → generates action items → logs ingestion
6. Marks email as read

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project (or any PostgreSQL database)
- A Gmail account with IMAP enabled and an App Password

### Installation

```bash
git clone <repo-url>
cd Dmarc
npm install
```

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

See `.env.example` for all required variables. Key entries:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:<PASSWORD>@db.<PROJECT>.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:<PASSWORD>@db.<PROJECT>.supabase.co:5432/postgres"

# Auth
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL="http://localhost:3000"

# Gmail IMAP
EMAIL_IMAP_HOST="imap.gmail.com"
EMAIL_IMAP_PORT="993"
EMAIL_IMAP_USER=<your-gmail@gmail.com>
EMAIL_IMAP_PASS=<your-app-password>
EMAIL_FOLDER="dmarc_report"

# Cron endpoint security
CRON_SECRET=<generate with: openssl rand -base64 32>
```

### Database Setup

```bash
npx prisma db push       # Create tables in Supabase
npx prisma generate      # Generate Prisma client
npx tsx prisma/seed.ts    # Seed demo data (optional)
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Default Credentials (after seeding)

| Role         | Email              | Password   |
|--------------|--------------------|------------|
| Super Admin  | admin@inmybox.io   | admin1234  |
| Demo Client  | demo@inmybox.io    | demo1234   |

## Gmail Setup for DMARC Ingestion

1. **Enable IMAP** — Gmail Settings → Forwarding and POP/IMAP → Enable IMAP
2. **Create App Password** — [Google App Passwords](https://myaccount.google.com/apppasswords) (requires 2-Step Verification)
3. **Create label** — Create a Gmail label called `dmarc_report`
4. **Set up filter** — Auto-move incoming DMARC aggregate report emails to the `dmarc_report` label

## API Endpoints

### Email Fetch (Cron)

```
GET  /api/cron/fetch-emails?action=test   — Test IMAP connection
POST /api/cron/fetch-emails               — Fetch and process emails
```

Both require either a super_admin session or `Authorization: Bearer <CRON_SECRET>` header.

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin panel pages
│   ├── dashboard/      # Client dashboard pages
│   ├── api/            # API routes
│   │   ├── cron/       # Email fetch cron endpoint
│   │   ├── admin/      # Admin API routes
│   │   └── ...         # Reports, senders, analytics, etc.
│   └── auth/           # Auth pages (signin, signup, forgot-password)
├── components/         # Shared UI components
├── lib/
│   ├── dmarc-parser.ts       # XML parsing + ZIP/7z extraction
│   ├── delivery-engine.ts    # Trust score & delivery risk calculation
│   ├── impact-engine.ts      # Business impact estimation
│   └── services/             # Domain services
│       ├── ingestion.service.ts      # Full ingestion pipeline
│       ├── email-fetcher.service.ts  # Gmail IMAP fetcher
│       ├── analytics.service.ts      # Dashboard metrics
│       ├── sender.service.ts         # Sender intelligence
│       └── ...
├── types/              # TypeScript type definitions
prisma/
├── schema.prisma       # Database schema (18 models)
└── seed.ts             # Demo data seeder
```

## License

Private — All rights reserved.
