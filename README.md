# VehicleGuard UK

An enterprise-grade MOT & Tax Reminder Hub for UK drivers. Instantly check vehicle MOT history, manage your garage, receive email reminders, and download detailed PDF reports.

## Features

- **Vehicle Lookup**: Real-time DVSA MOT History API integration with OAuth2
- **User Accounts**: Secure authentication with email/password and Google OAuth
- **Personal Garage**: Save unlimited vehicles with colour-coded status indicators
- **Smart Reminders**: Email alerts 30, 14, and 7 days before MOT/Tax/Service due
- **PDF Reports**: Download branded vehicle reports with full history
- **Service Estimation**: Manufacturer-interval-based service predictions
- **Mileage Fraud Detection**: Automatic anomaly detection in MOT history
- **Admin Dashboard**: Monitor platform usage and activity
- **Dark Mode**: Full dark mode support
- **GDPR Compliant**: Privacy-first design

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Cache/Queue**: Redis, BullMQ
- **Auth**: NextAuth.js v5 (Credentials + Google OAuth)
- **Email**: Resend / Nodemailer
- **PDF**: jsPDF + autotable
- **Container**: Docker + docker-compose

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (optional, for local DB/Redis)
- DVSA MOT History API credentials (provided in `.env.example`)
- Google OAuth credentials (optional)
- Resend API key (optional)

## Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd vehicleguard-uk
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Database Setup (Docker)

```bash
docker-compose up -d db redis
npx prisma migrate dev
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Run Reminder Worker (separate terminal)

```bash
npm run worker
```

## Production Deployment

### Docker Build

```bash
docker-compose up --build
```

### Vercel

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Add `DATABASE_URL`, `REDIS_URL`, `NEXTAUTH_SECRET`, etc.
5. Set build command: `npx prisma generate && next build`

### Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `NEXTAUTH_SECRET` | Random secret for JWT encryption |
| `NEXTAUTH_URL` | App URL (e.g. http://localhost:3000) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `DVSA_CLIENT_ID` | DVSA API client ID |
| `DVSA_CLIENT_SECRET` | DVSA API client secret |
| `DVSA_API_KEY` | DVSA API key |
| `RESEND_API_KEY` | Resend API key for emails |
| `EMAIL_FROM` | Sender email address |

## API Integrations

### DVSA MOT History API

Uses OAuth2 client credentials flow. Tokens are automatically cached in Redis with a 90% expiry buffer. Vehicle lookups are cached for 24 hours.

### DVLA Vehicle Enquiry (placeholder)

Tax status integration is prepared but requires separate DVLA API approval. Currently shows "Unknown" for tax status.

## Project Structure

```
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Sample data
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API routes
│   │   ├── auth/          # Sign in / sign up
│   │   ├── admin/         # Admin dashboard
│   │   ├── dashboard/     # User garage
│   │   ├── lookup/[reg]/  # Vehicle lookup results
│   │   ├── page.tsx       # Home / lookup page
│   │   └── layout.tsx     # Root layout
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   ├── navbar.tsx
│   │   ├── vehicle-lookup-form.tsx
│   │   └── vehicle-lookup-result.tsx
│   ├── hooks/
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── auth.ts        # NextAuth config
│   │   ├── dvsa.ts        # DVSA API client
│   │   ├── email.ts       # Email service
│   │   ├── prisma.ts      # Prisma client
│   │   ├── queue.ts       # BullMQ queues
│   │   ├── redis.ts       # Redis client
│   │   ├── service-estimate.ts
│   │   ├── pdf-report.ts
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run worker` | Start reminder worker |
| `npm run typecheck` | Run TypeScript checks |

## Security

- Input sanitization on all API routes
- Rate limiting ready (implement with middleware or API Gateway)
- Secure HTTP headers via Next.js config
- Content Security Policy configured
- Bcrypt password hashing (12 rounds)
- JWT sessions with 30-day expiry
- OAuth state parameter protection

## License

Proprietary - VehicleGuard UK
