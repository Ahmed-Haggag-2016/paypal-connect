# PayPal Connect

PayPal Connect is a small-business commerce prototype. It combines constrained AI price negotiation with buyer-approved PayPal Sandbox checkout and a human-approved, Gemini-reviewed contractor payout flow.

This project is released under the MIT License. See [LICENSE](./LICENSE).

> **Prototype notice:** this is not a production financial product. The demo profile is not a PayPal login. Dashboard figures and most ledger, supplier, project, and activity data are illustrative. No escrow, custody, dispute resolution, or real-account balance syncing is provided.

## What is actually integrated

- **Gemini:** server-side `@google/genai` calls power price negotiation and uploaded-image/document analysis. Negotiation uses a deterministic result labeled as a demo fallback only when Gemini is unavailable; receipt and deliverable audits fail explicitly instead of inventing results.
- **PayPal Sandbox:** server-side OAuth 2.0 obtains access tokens. Orders v2 creates orders; the buyer approves with PayPal before capture. The contractor flow submits a Batch Payout only after a real deliverable passes Gemini review and the user explicitly approves the recipient and amount.
- **AG Grid Community:** the Money Center uses AG Grid with illustrative sample rows.
- **Channel3:** server-side Channel3 SDK search uses the live product graph when `CHANNEL3_API_KEY` is configured; otherwise the procurement page explicitly falls back to local sample listings. Retailer offers link out to merchants. Channel3 Checkout is not currently available in this app.
- **Bryntum Gantt Community:** the Projects screen renders the local example tasks in the actual Bryntum Gantt component. Its schedule adjustment is a local rule-based preview, not AI or live project data.
- Marketplace fee sharing is a calculator preview; it does not split a payment. Dashboard and financial-intelligence screens do not query or analyze a connected PayPal account.

A PayPal order capture is a payment to its configured payee, not escrow. A payout batch ID means PayPal accepted the batch for processing; it does not prove settlement. Confirm status in PayPal Sandbox.

**Sandbox verification status:** Gemini, Sandbox OAuth, order creation, and buyer approval were tested. PayPal rejected capture of the approved $325 test order with `COMPLIANCE_VIOLATION`, so a completed end-to-end payment has not been verified. Resolve this with PayPal Sandbox support before presenting checkout as working.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- A Google Gemini API key for AI features
- PayPal Sandbox REST app credentials for checkout and payouts
- A PayPal Sandbox buyer and business account for end-to-end testing

## Local setup

```powershell
npm install
Copy-Item .env.example .env
# Fill the placeholders in .env with your own credentials.
npm run dev
```

Open <http://localhost:3000>. Never commit `.env` or put `PAYPAL_CLIENT_SECRET` in a `VITE_` variable. The browser-visible PayPal client ID is public; the secret must remain server-side.

### Environment variables

| Variable | Required for | Where it is used |
|---|---|---|
| `GEMINI_API_KEY` | Negotiation and file analysis | Server only |
| `GEMINI_MODEL` | Model ID for Gemini calls; defaults to `gemini-3.1-flash-lite` | Server only |
| `CHANNEL3_API_KEY` | Live product search in Procurement | Server only; optional |
| `PAYPAL_CLIENT_ID` | PayPal Orders, payouts, and account API | Server only |
| `PAYPAL_CLIENT_SECRET` | PayPal OAuth | Server only |
| `VITE_PAYPAL_CLIENT_ID` | PayPal Smart Buttons | Browser; public identifier only |
| `APP_URL` | PayPal return URLs | Server; e.g. `http://localhost:3000` locally |
| `PORT` | Optional server port | Server; defaults to `3000` |

Without Gemini credentials, price negotiation is explicitly labeled **Deterministic demo fallback**; vision features are unavailable. Without PayPal credentials, PayPal actions fail explicitly and the app reports Sandbox as not configured. No mock transaction IDs or successful payment fallbacks are generated.

The `.env.example` file contains placeholders only. Copy it to `.env` and add credentials locally; never place a PayPal secret in a browser-visible variable.

## 60-second judge walkthrough

1. Configure the environment variables above and run `npm run dev`.
2. Visit `/api/health`, then `/api/connect/verify-ai-key?force=true`; require `working: true` before claiming the configured Gemini model was live-tested.
3. Open **A2A Commerce Studio**, keep the sample product *Studio Monitor Audio Interface Pro*, set a budget above its displayed server-side reserve, and run negotiation.
4. Review whether the result is Gemini or deterministic fallback. The agreed price is not a payment.
5. Use the PayPal button, sign in with a Sandbox buyer, and approve the order. The app captures only after PayPal calls `onApprove`; verify the returned capture ID.
6. To test payouts, open **Verified Payments**, upload a real deliverable, set a Sandbox recipient, check the exact-amount approval box, and submit. Gemini must return at least 90% confidence; verify the returned batch status in PayPal Sandbox.

## Main screens

- **Command Center:** sample metrics and example activity.
- **Money Center:** AG Grid ledger with sample records, not account transactions.
- **Procurement:** live Channel3 product search and retailer offer links when configured; clearly labeled sample catalog otherwise. Channel3 checkout is not available in this app.
- **Projects:** Bryntum Gantt Community chart showing illustrative tasks; schedule adjustment uses local rules and is not AI-generated.
- **Agent Control Room:** illustrative agent configuration/activity.
- **A2A Commerce Studio:** catalog-constrained negotiation followed by a separate buyer-approved Sandbox order.
- **Verified Payments:** illustrative workflow preview and separate real-file audit/payout flow.
- **Financial Intelligence:** local calculations and sample alerts, not a Gemini-generated forecast.
- **Invoices:** in-memory invoice records with PayPal approval link and capture confirmation. Records are lost when the server restarts; invoice checkout requires PayPal Sandbox credentials.
- **Developer API:** endpoint reference and integration notes.

## Useful API routes

- `GET /api/health` — Gemini/PayPal configuration status.
- `GET /api/channel3/status` and `POST /api/channel3/search` — check Channel3 setup and search real catalog offers.
- `POST /api/agent/a2a-negotiate` — constrained negotiation; no payment is created.
- `POST /api/orders` — creates a real Sandbox order.
- `POST /api/orders/:orderId/capture` — captures only after buyer approval.
- `POST /api/agent/contractor-payout` — requires explicit approval, a real deliverable, a passing Gemini audit, and configured PayPal credentials.
- `POST /api/receipt/scan` — Gemini Vision receipt extraction; no payment.
- `POST /api/receipt/social-impact-donation` — human-approved PayPal Sandbox payout batch.
- `POST /api/invoices` and `POST /api/invoices/:id/capture` — create an invoice checkout and capture a PayPal-approved order.
- `POST /api/connect/release-payout` — disabled (`410 Gone`); this prototype does not hold escrow funds.
- `GET /api/paypal/credentials` — reports public client ID and configuration status, never the secret.

## Validation

```powershell
npm run lint
npm run build
```

No demo video is included in this repository. No feature or prize outcome is guaranteed by this prototype.
