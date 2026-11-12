import 'dotenv/config';
import { GEMINI_MODEL } from './server/services/gemini-config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { handleNegotiate, handleApproveOrder } from './server/controllers/negotiate.controller';
import { productRepository } from './server/models/product.model';
import { handleCreateOrder, handleAuthorizeOrder, handleCaptureOrder, handleGetWalletBalances, handleAuthenticateUser } from './server/controllers/order.controller';
import { payPalService } from './server/services/paypal.service';
import { negotiateProductPrice } from './server/services/negotiate.service';
import { auditShippingManifest } from './server/services/audit.service';
import { handleChannel3Search, handleChannel3Status } from './server/controllers/channel3.controller';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

function isValidGeminiApiKey(key?: string): boolean {
  if (!key) return false;
  const clean = key.trim().replace(/^["']|["']$/g, '');
  const normalized = clean.toLowerCase();
  if (!clean) return false;
  // Ignore template placeholders
  if (
    normalized === 'my_gemini_api_key' ||
    normalized === 'your_gemini_api_key' ||
    normalized === 'your_gemini_api_key_here' ||
    normalized === 'your_api_key' ||
    normalized.includes('my_gemini') ||
    normalized.includes('your_') ||
    clean.length < 20
  ) {
    return false;
  }
  return true;
}

const rawApiKey = process.env.GEMINI_API_KEY?.trim().replace(/^["']|["']$/g, '');
const isKeyValid = isValidGeminiApiKey(rawApiKey);

// Initialize Google GenAI ONLY if a genuine, non-placeholder key is provided
let ai: GoogleGenAI | null = null;
if (isKeyValid && rawApiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: rawApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize Google GenAI SDK:', err);
  }
}

// ==========================================
// PayPal Connect: AI Marketplace & Mediation Routes
// ==========================================

// Health Check Endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'PayPal Connect AI Commerce & Mediation Service',
    geminiConfigured: !!ai,
    geminiMode: ai ? 'configured' : 'demo_fallback',
    geminiModel: ai ? GEMINI_MODEL : null,
    paypalConfigured: !!configuredPayPalCredentials,
    paypalMode: configuredPayPalCredentials ? 'sandbox' : 'not_configured',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/channel3/status', handleChannel3Status);
app.post('/api/channel3/search', handleChannel3Search);

// Cached verification to prevent burning user's 20 requests/day quota on pings
let cachedVerify: {
  working: boolean;
  configured: boolean;
  model: string;
  message: string;
  isQuotaExceeded?: boolean;
  timestamp: number;
} | null = null;

// Live Gemini API Key Verification Endpoint
app.get('/api/connect/verify-ai-key', async (req, res) => {
  const force = req.query.force === 'true';

  // Return cached result if checked within the last 2 minutes to conserve daily quota
  if (!force && cachedVerify && Date.now() - cachedVerify.timestamp < 120000) {
    return res.json(cachedVerify);
  }

  if (!ai) {
    cachedVerify = {
      working: false,
      configured: false,
      model: 'deterministic-fallback',
      message: 'Gemini is not configured. Price negotiation may use a clearly labeled deterministic demo fallback; vision tasks are unavailable.',
      timestamp: Date.now(),
    };
    return res.json(cachedVerify);
  }

  let lastErr: any = null;
  for (const model of [GEMINI_MODEL]) {
    try {
      const testPromise = ai.models.generateContent({
        model,
        contents: 'Say OK',
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error('Network latency timeout (took over 25s). Check your internet connection.')
            ),
          25000
        )
      );
      const test: any = await Promise.race([testPromise, timeoutPromise]);
      cachedVerify = {
        working: true,
        configured: true,
        model,
        message: `Verified successfully! Model ${model} is connected and responding live via Google GenAI.`,
        timestamp: Date.now(),
      };
      return res.json({
        ...cachedVerify,
        testResponse: test.text?.trim(),
      });
    } catch (err: any) {
      lastErr = err;
      const msg = err?.message || String(err);
      if (!msg.includes('429') && !msg.includes('RESOURCE_EXHAUSTED')) {
        console.warn(`Model verification for ${model} encountered issue:`, msg);
      }
    }
  }

  const errMsg = String(lastErr?.message || lastErr || '');
  const is429 = errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED');
  const isTimeout = errMsg.includes('timeout');

  cachedVerify = {
    working: false,
    configured: true,
    isQuotaExceeded: is429,
    model: 'deterministic-fallback',
    message: is429
      ? 'Gemini quota limit reached. No live AI response was produced; deterministic demo fallback may be used for negotiation only.'
      : isTimeout
      ? 'Gemini request timed out. No live AI response was produced; deterministic demo fallback may be used for negotiation only.'
      : `Google API Notice: ${errMsg}`,
    timestamp: Date.now(),
  };

  return res.json(cachedVerify);
});

const PAYPAL_SANDBOX_BASE = 'https://api-m.sandbox.paypal.com';

const configuredPayPalCredentials: {
  clientId: string;
  clientSecret: string;
  appId?: string;
  tokenType?: string;
  scope?: string;
  expiresIn?: number;
  lastVerified?: string;
} | null = process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
  ? {
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      tokenType: 'Bearer',
    }
  : null;

// 2. Endpoint to query current PayPal credentials configuration status
app.get('/api/paypal/credentials', (_req, res) => {
  const isConfigured = !!configuredPayPalCredentials;
  res.json({
    configured: isConfigured,
    clientId: configuredPayPalCredentials?.clientId || '',
    appId: configuredPayPalCredentials?.appId,
    tokenType: configuredPayPalCredentials?.tokenType,
    lastVerified: configuredPayPalCredentials?.lastVerified,
    scope: configuredPayPalCredentials?.scope,
    endpoint: `${PAYPAL_SANDBOX_BASE}/v1/oauth2/token`,
  });
});

// 2-diag. Live test of PayPal credentials directly with api-m.sandbox.paypal.com
app.get('/api/paypal/diagnostic', async (_req, res) => {
  const clientId = configuredPayPalCredentials?.clientId;
  const clientSecret = configuredPayPalCredentials?.clientSecret;

  if (!clientId || !clientSecret) {
    return res.status(503).json({
      success: false,
      error: 'PayPal Sandbox credentials are not configured.',
    });
  }

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch(`${PAYPAL_SANDBOX_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const rawText = await response.text();
    let parsed: any = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { raw: rawText };
    }

    const isSecretIdenticalToClientId = clientId.trim() === clientSecret.trim();

    return res.json({
      success: response.ok,
      httpStatus: response.status,
      endpoint: `${PAYPAL_SANDBOX_BASE}/v1/oauth2/token`,
      clientIdUsed: `${clientId.substring(0, 10)}...${clientId.substring(clientId.length - 6)}`,
      secretUsedIsIdenticalToClientId: isSecretIdenticalToClientId,
      paypalResponse: response.ok
        ? {
            tokenType: parsed?.token_type,
            expiresIn: parsed?.expires_in,
            scope: parsed?.scope,
          }
        : {
            error: parsed?.error,
            errorDescription: parsed?.error_description,
          },
      diagnosis: response.ok
        ? 'Connected successfully to live PayPal Sandbox REST API!'
        : isSecretIdenticalToClientId
        ? 'Client Authentication failed: Your PAYPAL_CLIENT_SECRET is identical to your CLIENT_ID. In PayPal Developer Dashboard, click "Show" next to Secret to get your actual Secret (which begins with "E...").'
        : parsed?.error_description || 'PayPal returned an authentication failure.',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Production Clean Architecture: Multi-Agent Negotiation & Human-in-the-Loop PayPal Authorization
app.post(['/negotiate', '/api/negotiate'], handleNegotiate);
app.post(['/negotiate/approve', '/api/negotiate/approve'], handleApproveOrder);

// 1. Dynamic Bargaining Agent Endpoint (Gemini 3.8 Flash + Programmatic PayPal Order Setup)
app.post('/api/negotiate/autonomous', async (req, res) => {
  try {
    const { productId, buyerMaxBudget, buyerMessage, buyerEmail } = req.body || {};
    if (!productId || typeof buyerMaxBudget !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: productId (string) and buyerMaxBudget (number)',
      });
    }

    const result = await negotiateProductPrice(
      String(productId),
      Number(buyerMaxBudget),
      buyerMessage ? String(buyerMessage) : undefined,
      buyerEmail ? String(buyerEmail) : undefined
    );

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Error in /api/negotiate/autonomous:', err);
    return res.status(500).json({ success: false, error: err.message || 'Negotiation failed' });
  }
});

// -------------------------------------------------------------
// New Hackathon Track Endpoints: Agentic Commerce & Money Movement
// -------------------------------------------------------------
import { executeA2AShopping, processContractorMilestonePayout } from './server/services/a2a.service';
import { scanAndParseReceipt, processMultiPayeeSplit, processSocialImpactDonation } from './server/services/receipt.service';
import { listInvoices, createInvoice, captureInvoicePayment } from './server/services/invoice.service';

// Agent-to-Agent Autonomous Commerce Route
app.post('/api/agent/a2a-negotiate', async (req, res) => {
  try {
    const { userGoalPrompt, maxBudget, buyerEmail } = req.body || {};
    if (!userGoalPrompt || !Number.isFinite(Number(maxBudget)) || Number(maxBudget) <= 0 || Number(maxBudget) > 5000) {
      return res.status(400).json({ error: 'userGoalPrompt and maxBudget are required' });
    }
    const result = await executeA2AShopping({
      userGoalPrompt: String(userGoalPrompt),
      maxBudget: Number(maxBudget),
      buyerEmail: buyerEmail ? String(buyerEmail) : undefined,
    });
    return res.json(result);
  } catch (err: any) {
    console.error('A2A error:', err);
    return res.status(500).json({ error: err.message || 'A2A execution failed' });
  }
});

// Contractor Milestone Verification & Instant Payout
app.post('/api/agent/contractor-payout', async (req, res) => {
  try {
    const { contractId, milestoneTitle, contractorEmail, amount, deliverableBase64, mimeType, deliverableNotes, humanApproved } = req.body || {};
    if (
      typeof contractorEmail !== 'string' ||
      !contractorEmail.includes('@') ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      Number(amount) > 5000 ||
      typeof deliverableBase64 !== 'string' ||
      !deliverableBase64 ||
      humanApproved !== true
    ) {
      return res.status(400).json({
        error: 'A valid recipient email, amount between $0 and $5,000, and a deliverable file are required.',
      });
    }
    const result = await processContractorMilestonePayout({
      contractId: String(contractId || 'CONTRACT_01'),
      milestoneTitle: String(milestoneTitle || 'Deliverable'),
      contractorEmail: String(contractorEmail),
      amount: Number(amount),
      deliverableBase64,
      mimeType,
      deliverableNotes,
      humanApproved,
    });
    return res.json(result);
  } catch (err: any) {
    console.error('Contractor payout error:', err);
    return res.status(500).json({ error: err.message || 'Milestone payout failed' });
  }
});

// Receipt OCR & Bill Splitter
app.post('/api/receipt/scan', async (req, res) => {
  try {
    const { receiptBase64, mimeType } = req.body || {};
    if (!receiptBase64) {
      return res.status(400).json({ error: 'receiptBase64 image is required' });
    }
    const result = await scanAndParseReceipt(String(receiptBase64), mimeType || 'image/jpeg');
    return res.json(result);
  } catch (err: any) {
    console.error('Receipt OCR error:', err);
    return res.status(500).json({ error: err.message || 'Receipt OCR failed' });
  }
});

app.post('/api/audit/manifest', async (req, res) => {
  try {
    const { orderId, manifestBase64, mimeType, expectedItems, allowedWeightTolerancePercentage } = req.body || {};
    if (typeof orderId !== 'string' || typeof manifestBase64 !== 'string' || !Array.isArray(expectedItems)) {
      return res.status(400).json({ success: false, error: 'orderId, manifestBase64, and expectedItems are required.' });
    }
    const result = await auditShippingManifest({
      orderId,
      manifestBase64,
      mimeType,
      expectedItems,
      allowedWeightTolerancePercentage,
      executeCaptureOnValid: false,
    });
    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Manifest audit error:', err);
    return res.status(400).json({ success: false, error: err.message || 'Manifest audit failed.' });
  }
});

// Marketplace Multi-Payee Platform Fee Splitter
app.post('/api/receipt/split-multi-payee', async (req, res) => {
  try {
    const { totalAmount, platformFeePercentage, sellerEmail, platformEmail, description } = req.body || {};
    if (!totalAmount || !sellerEmail) {
      return res.status(400).json({ error: 'totalAmount and sellerEmail are required' });
    }
    const result = await processMultiPayeeSplit({
      totalAmount: Number(totalAmount),
      platformFeePercentage: Number(platformFeePercentage ?? 5),
      sellerEmail: String(sellerEmail),
      platformEmail: platformEmail ? String(platformEmail) : undefined,
      description: String(description || 'Marketplace Item'),
    });
    return res.json(result);
  } catch (err: any) {
    console.error('Multi-payee split error:', err);
    return res.status(500).json({ error: err.message || 'Multi-payee split failed' });
  }
});

// Social Impact Multi-Cause Donation
app.post('/api/receipt/social-impact-donation', async (req, res) => {
  try {
    const { donorEmail, totalDonation, allocations, humanApproved } = req.body || {};
    if (!donorEmail || !totalDonation || !Array.isArray(allocations) || humanApproved !== true) {
      return res.status(400).json({ error: 'donorEmail, totalDonation, and allocations are required' });
    }
    const result = await processSocialImpactDonation({
      donorEmail: String(donorEmail),
      totalDonation: Number(totalDonation),
      allocations,
      humanApproved,
    });
    return res.json(result);
  } catch (err: any) {
    console.error('Social impact donation error:', err);
    return res.status(500).json({ error: err.message || 'Social impact donation failed' });
  }
});

// Multi-Currency Invoicing Endpoints
app.get('/api/invoices', (_req, res) => {
  return res.json({ success: true, invoices: listInvoices() });
});

app.post('/api/invoices', async (req, res) => {
  try {
    const invoice = await createInvoice(req.body, resolveAppOrigin(req));
    return res.status(201).json({ success: true, invoice });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create invoice' });
  }
});

app.post('/api/invoices/:id/capture', async (req, res) => {
  try {
    const orderId = req.body?.orderId;
    if (typeof orderId !== 'string' || !orderId) {
      return res.status(400).json({ success: false, error: 'A PayPal order ID is required.' });
    }
    const invoice = await captureInvoicePayment(req.params.id, orderId);
    return res.json({ success: true, invoice });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to capture invoice payment' });
  }
});

app.get('/api/products', (_req, res) => res.json(productRepository.listAll()));
// Helper to determine exact host origin across dev / preview environments
function resolveAppOrigin(req: any): string {
  if (req.headers.origin && typeof req.headers.origin === 'string') {
    return req.headers.origin;
  }
  if (req.headers.referer && typeof req.headers.referer === 'string') {
    try {
      return new URL(req.headers.referer).origin;
    } catch {
      // ignore
    }
  }
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  if (host && !host.includes('localhost')) {
    return `${proto}://${host}`;
  }
  return process.env.APP_URL || 'https://ais-dev-4frztzzkawvuz7rtn7qz4a-377795100741.europe-west2.run.app';
}

// 4. Strict Catch-All for ANY Unmatched /api/* Route to prevent HTML fallback

// 2b. Customer / Buyer Session Management (Customer enters PayPal Email & Password)
interface CustomerAccountProfile {
  email: string;
  name: string;
  country: string;
  currency: string;
  currencySymbol: string;
  balance: number;
  accountId: string;
  status: string;
  role: 'buyer';
}

const activeCustomerSessions: Record<string, CustomerAccountProfile> = {};

function resolveCustomerProfile(email: string): CustomerAccountProfile {
  const cleanEmail = email.trim().toLowerCase();

  if (activeCustomerSessions[cleanEmail]) {
    return activeCustomerSessions[cleanEmail];
  }

  // Account identity derived safely
  const username = cleanEmail.split('@')[0];
  const parts = username.split(/[\._\-0-9]/).filter(Boolean);
  const resolvedName = parts.length > 0
    ? parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
    : 'PayPal User';

  const profile: CustomerAccountProfile = {
    email: cleanEmail,
    name: resolvedName,
    country: 'United States (US)',
    currency: 'USD',
    currencySymbol: '$',
    balance: 0,
    accountId: 'DEMO-PROFILE',
    status: 'Demo profile — not authenticated with PayPal',
    role: 'buyer',
  };

  activeCustomerSessions[cleanEmail] = profile;
  return profile;
}

app.post('/api/auth/customer-session', (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !String(email).includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'A valid PayPal email is required.',
      });
    }

    const profile = resolveCustomerProfile(email);

    return res.json({
      success: true,
      user: profile,
      message: `Demo profile created for ${profile.email}. This does not authenticate or verify a PayPal account.`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to establish customer session' });
  }
});

app.get('/api/auth/customer-session', (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (email && activeCustomerSessions[email]) {
    return res.json({ success: true, user: activeCustomerSessions[email] });
  }
  return res.status(404).json({ success: false, error: 'No active session found for this email' });
});

app.post('/api/auth/paypal-login', handleAuthenticateUser);

// Official Next.js Checkout Guide: Create Order with intent strictly set to 'AUTHORIZE'
app.post('/api/orders', handleCreateOrder);

// Official Next.js Checkout Guide: Live Order Authorization (Extracts Payer Payload)
app.post(['/api/orders/:orderId/authorize', '/api/orders/:orderID/authorize'], handleAuthorizeOrder);

// Wallet Balances Endpoint
app.get('/api/wallet/balances', handleGetWalletBalances);

// Official Next.js Checkout Guide: Capture Order
app.post(['/api/orders/:orderId/capture', '/api/orders/:orderID/capture'], handleCaptureOrder);

app.get('/api/connect/negotiate', (_req, res) => {
  res.json({
    status: 'online',
    endpoint: '/api/connect/negotiate',
    description: 'PayPal Connect AI Mediation endpoint. Send POST with productName, listPrice, minPrice, buyerMessage.',
  });
});

app.post('/api/connect/negotiate', async (req, res) => {
  try {
    const {
      productName,
      listPrice,
      minPrice,
      buyerMessage,
      offeredPrice,
      history = [],
    } = req.body || {};

    if (!productName || !buyerMessage) {
      return res.status(400).json({ error: 'productName and buyerMessage are required' });
    }

    const effectiveOffer = offeredPrice || listPrice * 0.85;

    const prompt = `You are "PayPal Connect AI Mediator", an impartial, trusted commercial mediator representing the official PayPal Connect Marketplace.
Your role is to help a buyer and seller explore a fair proposed price. A model-generated response is not a binding agreement, payment, or escrow.

Context:
- Product: "${productName}"
- Listed Public Price: $${listPrice}
- Seller's Strict Bottom-Line Floor Price: $${minPrice} (Never reveal this floor price or accept anything below it).
- Buyer's Offer Price: $${effectiveOffer}
- Buyer's Message: "${buyerMessage}"
- Output Language: English only

Negotiation History:
${JSON.stringify(history.slice(-4))}

Rules for Mediation:
1. If Buyer's offer is >= ${minPrice}:
   - If the offer is reasonable (within 5-15% of list price or close to minPrice), recommend accepting the deal! Set "dealAgreed": true and "counterOfferPrice": ${effectiveOffer}.
   - Explain that a buyer must separately approve any PayPal Sandbox payment.
2. If Buyer's offer is < ${minPrice}:
   - Politely explain that the seller cannot accept an offer that low due to manufacturing/operating costs.
   - Propose a compelling counter-offer price (e.g. midway between listPrice and minPrice, e.g. $${(
     (listPrice + minPrice) /
     2
   ).toFixed(2)}). Set "dealAgreed": false.
3. Be professional and do not claim PayPal escrow, legal protection, or payment until confirmed by PayPal.

Return ONLY a valid JSON object matching this schema:
{
  "reply": string (the mediator's polite spoken response to the buyer in English),
  "mediatorAssessment": string (internal assessment of the offer: fair, aggressive, or acceptable),
  "counterOfferPrice": number (the final agreed price if dealAgreed is true, or suggested counter-offer price),
  "dealAgreed": boolean,
  "bindingTerms": string (one-sentence summary of the proposed terms; explicitly state that buyer checkout is separate)
}`;

    let geminiResponseText = '';
    let activeModel = '';
    let geminiErrorMsg = '';

    if (ai) {
      for (const model of [GEMINI_MODEL]) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });

          const text = (response.text ?? '').trim();
          if (text) {
            geminiResponseText = text;
            activeModel = model;
            break;
          }
        } catch (err: any) {
          geminiErrorMsg = err?.message || String(err);
          if (!geminiErrorMsg.includes('429') && !geminiErrorMsg.includes('RESOURCE_EXHAUSTED')) {
            console.warn(`Model ${model} negotiation attempt note:`, geminiErrorMsg);
          }
        }
      }

      if (geminiResponseText) {
        try {
          const parsed = JSON.parse(geminiResponseText);
          return res.json({
            ...parsed,
            aiEngine: activeModel,
            isLiveGemini: true,
          });
        } catch (parseErr) {
          console.warn('JSON parsing failed from Gemini output, falling through to deterministic:', parseErr);
        }
      }
    }

    // Deterministic mediation fallback
    const isAccepted = effectiveOffer >= minPrice;
    const agreedOrCounter = isAccepted ? effectiveOffer : Number(((listPrice + minPrice) / 2).toFixed(2));

    return res.json({
      reply: isAccepted
        ? `Your offer of $${effectiveOffer} meets the configured seller threshold. The proposal is accepted; any payment requires separate buyer approval in PayPal Sandbox.`
        : `Thank you for your proposal of $${effectiveOffer}. The seller cannot accept this amount due to baseline operational costs. The seller's suggested counter-offer is $${agreedOrCounter}. Checkout and any buyer protection are governed by PayPal's terms.`,
      mediatorAssessment: isAccepted ? 'Mutually acceptable terms' : 'Counter-offer required',
      counterOfferPrice: agreedOrCounter,
      dealAgreed: isAccepted,
      bindingTerms: `Proposed price $${agreedOrCounter}; this is not a binding contract or escrow, and payment requires separate PayPal buyer approval.`,
      aiEngine: 'deterministic-fallback',
      isLiveGemini: false,
      geminiError: geminiErrorMsg || 'No active Gemini API key configured',
    });
  } catch (outerErr: any) {
    console.error('Error in /api/connect/negotiate:', outerErr);
    return res.status(500).json({ error: outerErr?.message || 'Internal negotiation failure' });
  }
});

// 2. PayPal Sandbox authorization order creation
app.get('/api/connect/checkout-escrow', (_req, res) => {
  res.json({
    status: 'online',
    endpoint: '/api/connect/checkout-escrow',
    description: 'Creates a PayPal Sandbox authorization order. It does not create escrow or move funds before buyer approval.',
  });
});

app.post('/api/connect/checkout-escrow', async (req, res) => {
  try {
    const { productId, agreedPrice, buyerEmail, sellerEmail, payeeEmail } = req.body || {};
    const timestamp = new Date().toISOString();
    const targetSellerEmail = sellerEmail || payeeEmail;
    const amount = Number(agreedPrice);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 5000) {
      return res.status(400).json({ success: false, error: 'agreedPrice must be greater than zero and no more than $5,000.' });
    }

    let tokenData: any = null;
    let authError: any = null;
    try {
      tokenData = { access_token: await payPalService.getAccessToken() };
    } catch (err: any) {
      authError = err?.message || String(err);
    }

    if (!tokenData?.access_token) {
      return res.status(503).json({
        success: false,
        error: 'Could not authenticate with PayPal Sandbox. Configure valid Sandbox credentials and try again.',
        details: authError,
      });
    }

    let liveOrder: any = null;
    let liveCapture: any = null;
    let paypalError: any = null;

    if (tokenData?.access_token) {
      try {
        const purchaseUnit: any = {
          amount: {
            currency_code: 'USD',
            value: amount.toFixed(2),
          },
          description: `PayPal Connect purchase: Item ${productId}`,
        };

        if (targetSellerEmail && String(targetSellerEmail).includes('@')) {
          purchaseUnit.payee = {
            email_address: String(targetSellerEmail).trim(),
          };
        }

        const createOrderRes = await fetch(`${PAYPAL_SANDBOX_BASE}/v2/checkout/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
          body: JSON.stringify({
            intent: 'AUTHORIZE',
            purchase_units: [purchaseUnit],
            application_context: {
              return_url: 'https://www.sandbox.paypal.com/checkoutnow',
              cancel_url: 'https://www.sandbox.paypal.com/checkoutnow',
            },
          }),
        });

        const orderText = await createOrderRes.text();
        if (createOrderRes.ok) {
          liveOrder = JSON.parse(orderText);
          
          // Attempt immediate order capture if intent is CAPTURE
          if (liveOrder?.id && liveOrder.intent === 'CAPTURE') {
            try {
              const captureRes = await fetch(`${PAYPAL_SANDBOX_BASE}/v2/checkout/orders/${liveOrder.id}/capture`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${tokenData.access_token}`,
                },
              });
              const captureText = await captureRes.text();
              if (captureRes.ok) {
                liveCapture = JSON.parse(captureText);
              }
            } catch (capErr) {
              console.warn('Order capture notice:', capErr);
            }
          }
        } else {
          try {
            paypalError = JSON.parse(orderText);
          } catch {
            paypalError = { error: orderText };
          }
          console.warn('Live PayPal Order creation returned error status:', createOrderRes.status, orderText);
        }
      } catch (err: any) {
        paypalError = { error: err?.message || String(err) };
        console.warn('Live PayPal Order creation failed:', err);
      }
    }

    if (!liveOrder?.id) {
      return res.status(502).json({
        success: false,
        error: 'PayPal did not create an order.',
        paypalError,
      });
    }
    const orderId = liveOrder.id;
    const approveUrl = liveOrder.links?.find((l: any) => l.rel === 'approve')?.href;
    if (!approveUrl) {
      return res.status(502).json({ success: false, error: 'PayPal order is missing its approval URL.' });
    }
    const authorizationId = liveOrder.purchase_units?.[0]?.payments?.authorizations?.[0]?.id;

    return res.json({
      success: true,
      status: 'PENDING_APPROVAL',
      orderId,
      authorizationId,
      approveUrl,
      sandboxLoginUrl: 'https://www.sandbox.paypal.com/',
      isLivePayPalSandbox: true,
      productId,
      agreedPrice: amount,
      buyerEmail,
      sellerEmail: targetSellerEmail,
      escrowVaultStatus: 'NOT_ESCROWED',
      protection: 'PENDING_PAYPAL_APPROVAL',
      timestamp,
      message: 'A PayPal authorization order was created. No funds are authorized or held until the buyer approves it on PayPal. This is not escrow.',
    });
  } catch (err: any) {
    console.error('Error in /api/connect/checkout-escrow:', err);
    return res.status(500).json({ error: err?.message || 'PayPal authorization order creation failed' });
  }
});

// 3. Direct payouts are disabled; PayPal Connect does not hold escrow.
app.get('/api/connect/release-payout', (_req, res) => {
  res.status(410).json({
    status: 'disabled',
    endpoint: '/api/connect/release-payout',
    error: 'There is no escrow balance to release. Buyer-approved PayPal checkout captures directly to the configured payee.',
  });
});

app.post('/api/connect/release-payout', (_req, res) => {
  return res.status(410).json({
    success: false,
    error: 'Direct payout release is disabled because PayPal Connect does not hold escrow funds.',
  });
});

// 4. Strict Catch-All for ANY Unmatched /api/* Route to prevent HTML fallback
app.all('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API route not found',
    path: req.path,
    method: req.method,
  });
});

// 5. Global Express Error Handler for API Routes
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err?.message || 'Internal server error' });
});

// ==========================================
// Setup Vite Development or Static SPA Serving
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[PayPal Connect] Server listening on http://0.0.0.0:${port}`);
    if (ai) {
      console.log(`[PayPal Connect] 🤖 Gemini AI Engine: ACTIVE (Model: ${GEMINI_MODEL})`);
    } else {
      console.log(`[PayPal Connect] ⚡ Gemini AI Engine: FALLBACK MODE (No GEMINI_API_KEY in .env)`);
    }
  });
}

startServer();
