# Indra Cyber Institute — Facebook Messenger AI Chatbot

A sales funnel chatbot for **Indra Cyber Institute** built with Next.js 14 App Router and Google Gemini 1.5 Flash. The bot communicates entirely in **Mongolian** and guides prospective students through a 4-stage sales funnel, automatically capturing leads (name + phone number) and logging them to the console.

---

## Features

- 4-stage Mongolian-language sales funnel (Welcome → Sector → Product Pitch → Lead Capture)
- Per-user conversation history with full Gemini context
- Automatic lead detection and JSON extraction from Gemini output
- Facebook Messenger webhook (GET verify + POST handler)
- Graceful error fallback in Mongolian
- Clean "Bot is running" status page at `/`

---

## Project Structure

```
/
├── app/
│   ├── api/
│   │   └── webhook/
│   │       └── route.ts     ← Facebook webhook (GET verify + POST handler)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx             ← Status page with setup instructions
├── lib/
│   ├── gemini.ts            ← Gemini API with 4-stage system prompt
│   ├── messenger.ts         ← Facebook Graph API sendMessage helper
│   └── store.ts             ← In-memory conversation store per sender
├── .env.local.example       ← Environment variable template
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## Step-by-Step Setup

### 1. Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click **Create API key** → copy the key.

> The `gemini-1.5-flash` model is available on the free tier with generous limits.

---

### 2. Create a Facebook App and Page

1. Go to [Meta for Developers](https://developers.facebook.com/) → **My Apps** → **Create App**.
2. Choose **Business** as the app type, give it a name, and continue.
3. On the dashboard, click **Add Product** → find **Messenger** → click **Set Up**.
4. Under **Access Tokens**, connect or create a **Facebook Page** and generate a **Page Access Token** — copy it.
5. Choose any string as your **Verify Token** (e.g., `indra-verify-2024`) — you'll enter this in both Meta and your env vars.

---

### 3. Clone and Configure Locally

```bash
git clone <your-repo-url>
cd indra-cyber-messenger-bot

cp .env.local.example .env.local
```

Edit `.env.local`:

```env
GEMINI_API_KEY=AIzaSy...
PAGE_ACCESS_TOKEN=EAABs...
VERIFY_TOKEN=indra-verify-2024
```

Install dependencies and run:

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the status page.

> **Note:** To test the webhook locally, use [ngrok](https://ngrok.com/):
> ```bash
> ngrok http 3000
> ```
> Use the HTTPS URL ngrok gives you as your webhook URL.

---

### 4. Deploy to Vercel

1. Push this project to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo.
3. In **Environment Variables**, add:
   | Variable | Value |
   |---|---|
   | `GEMINI_API_KEY` | Your Gemini key |
   | `PAGE_ACCESS_TOKEN` | Your Facebook Page token |
   | `VERIFY_TOKEN` | Your custom verify string |
4. Click **Deploy** and wait for the build to finish.
5. Copy your deployment URL, e.g. `https://indra-bot.vercel.app`.

---

### 5. Register the Webhook in Meta

1. In your Facebook App → **Messenger** → **Webhooks** → **Add Callback URL**.
2. **Callback URL:** `https://indra-bot.vercel.app/api/webhook`
3. **Verify Token:** the same string you set in `VERIFY_TOKEN`
4. Click **Verify and Save** — Meta sends a GET request; your server returns the challenge.
5. Under **Webhook Fields**, subscribe to **`messages`**.

---

### 6. Test the Bot

1. Open your Facebook Page and click **Send Message**.
2. Type any greeting — the bot replies in Mongolian and starts the funnel.
3. Watch your Vercel logs (Functions tab) for:
   - `[Webhook] Message from ...`
   - `NEW LEAD: { phone, name, interest }` — printed when the user provides their details.

---

## Sales Funnel Flow

| Stage | Bot Action |
|---|---|
| **1 — Welcome** | Greet user, introduce 4 programs, ask about their career goals |
| **2 — Sector** | Match their interest to a specific program |
| **3 — Product** | Present price, duration, skills, salary outcome; add urgency ("only 3 spots left!") |
| **4 — Lead Capture** | Ask for name + phone → extract JSON → log lead → confirm 24h callback |

---

## Programs Reference

| Program | Duration | Price | Outcome |
|---|---|---|---|
| Fullstack Хөгжүүлэлт | 6 months | 1,200,000₮ | 2.5–4M₮/mo junior dev |
| UI/UX Дизайн | 3 months | 800,000₮ | 1.5–3M₮/mo designer |
| Дижитал Маркетинг | 3 months | 750,000₮ | 1–2.5M₮/mo marketer |
| Кибер Аюулгүй Байдал | 4 months | 1,100,000₮ | 3–5M₮/mo security engineer |

---

## Lead JSON Format

When the user provides both name and phone number, Gemini embeds this in its response:

```json
{"phone":"99001234","name":"Батбаяр Дорж","interest":"Fullstack Хөгжүүлэлт"}
```

The webhook strips this JSON from the user-facing reply, logs it via `console.log("NEW LEAD:", ...)`, and sends only the confirmation message. To persist leads, replace the `console.log` in `app/api/webhook/route.ts` with a database write (e.g., Supabase, PlanetScale, or Airtable).

---

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **AI:** Google Gemini 1.5 Flash via `@google/generative-ai`
- **Messaging:** Facebook Messenger Platform v18.0
- **Hosting:** Vercel (recommended)
