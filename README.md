# Grande Sports Training Platform

A booking and athlete management platform for Grande Sports.

## Features

- **Session Booking**: Athletes can browse and book private, semi-private, or group training sessions
- **Stripe Payments**: Secure payment processing at time of booking
- **Athlete Dashboard**: View upcoming sessions, payment history, and technical testing progress
- **Admin Dashboard**: Create sessions, manage athletes, input technical testing scores, and create discount codes
- **Discount Codes**: Create percentage or fixed-amount discounts, optionally restricted to specific athletes

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **Styling**: Tailwind CSS
- **Email**: Resend (optional)

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd grande-sports
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **Settings > API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` key (keep this secret!)

### 3. Set Up Database

1. In Supabase, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql` and run it
3. This creates all tables, policies, and functions

### 4. Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Get your API keys from **Developers > API keys**:
   - Publishable key (starts with `pk_`)
   - Secret key (starts with `sk_`)

### 5. Configure Environment Variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# App URL (update for production)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (optional)
RESEND_API_KEY=re_xxx
```

### 6. Set Up Stripe Webhook

1. In Stripe Dashboard, go to **Developers > Webhooks**
2. Add endpoint: `https://your-domain.com/api/webhook`
3. Select events: `checkout.session.completed`, `payment_intent.payment_failed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 7. Make Yourself Admin

After you register your account:

1. Go to Supabase **Table Editor > profiles**
2. Find your row and set `is_admin` to `true`

### 8. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. Add all environment variables in Vercel's settings
4. Deploy

### Connect Your Domain

1. In Vercel, go to **Settings > Domains**
2. Add `train.grandesportstraining.com`
3. Follow Vercel's instructions to add DNS records

## Shopify Integration

To add a "Book Training" link to your Shopify site:

1. Log in to Shopify admin
2. Go to **Online Store > Navigation**
3. Click on your main menu
4. Add a new menu item:
   - Name: `BOOK TRAINING`
   - Link: `https://train.grandesportstraining.com`
5. Save

## Pricing

| Session Type | Price | Capacity |
|--------------|-------|----------|
| Private | $95 | 1 |
| Semi-Private | $70/player | 2 |
| Group | $40/player | 3-8 |
| Monthly Private Package | $680/month | 8 sessions |

## Cancellation Policy

- **24+ hours notice**: Credit issued for future session
- **Under 24 hours**: No refund, session counts as used
- **30+ minutes completed**: Session counts as completed

## Support

For questions, contact Grande Sports.

