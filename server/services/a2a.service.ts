/**
 * Agent-to-Agent (A2A) Autonomous Commerce Service
 * Implements end-to-end agentic shopping, multi-turn AI negotiation, and automated contractor milestone payouts
 * Powered by the configured Gemini model and PayPal Sandbox REST API (Orders v2 & Payouts v1)
 */

import { GoogleGenAI } from '@google/genai';
import { productRepository, ProductListing } from '../models/product.model';
import { payPalService } from './paypal.service';
import { GEMINI_MODEL } from './gemini-config';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim().replace(/^["']|["']$/g, '');
  const normalizedKey = apiKey?.toLowerCase();
  if (
    !apiKey ||
    !normalizedKey ||
    normalizedKey.includes('your_') ||
    normalizedKey.includes('my_gemini') ||
    apiKey.length < 20
  ) {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' },
      },
    });
  } catch {
    return null;
  }
}

export interface A2AShoppingRequest {
  userGoalPrompt: string;
  maxBudget: number;
  buyerEmail?: string;
  preferredCategory?: string;
}

export interface A2AShoppingResult {
  success: boolean;
  aiMode: 'gemini' | 'demo_fallback';
  product: {
    id: string;
    name: string;
    listPrice: number;
    sellerEmail: string | null;
  };
  buyerAgentStrategy: string;
  sellerAgentStrategy: string;
  dialogue: Array<{
    step: number;
    agent: 'buyer_agent' | 'seller_agent' | 'protocol';
    message: string;
    offerPrice?: number;
  }>;
  agreedPrice: number;
  savings: number;
  paypalOrder?: {
    orderId: string;
    approvalUrl: string;
    status: string;
  };
  paymentStatus: 'PENDING_APPROVAL';
  timestamp: string;
}

export async function executeA2AShopping(params: A2AShoppingRequest): Promise<A2AShoppingResult> {
  if (!Number.isFinite(params.maxBudget) || params.maxBudget <= 0 || params.maxBudget > 5000) {
    throw new Error('Buyer budget must be greater than zero and no more than $5,000.');
  }
  const products = productRepository.listAll();
  const prompt = params.userGoalPrompt.toLowerCase();
  const targetProduct = products.find((p: ProductListing) =>
    prompt.includes(p.title.toLowerCase()) || prompt.includes(p.category.toLowerCase())
  );
  if (!targetProduct) {
    throw new Error(`No catalog item matched your request. Available demo products: ${products.map((product) => product.title).join(', ')}.`);
  }

  const listPrice = targetProduct.list_price;
  const minPrice = targetProduct.min_acceptable_price;
  const buyerBudget = Math.min(params.maxBudget, listPrice);
  if (buyerBudget < minPrice) {
    throw new Error(`Your budget of $${buyerBudget.toFixed(2)} is below this sample listing's minimum negotiable price.`);
  }

  const dialogue: A2AShoppingResult['dialogue'] = [];

  const ai = getGeminiClient();
  let aiMode: A2AShoppingResult['aiMode'] = 'demo_fallback';
  let agreedPrice = Number(((minPrice + buyerBudget) / 2).toFixed(2));
  let buyerStrategy = 'Aggressive value negotiation with instant PayPal funding commitment';
  let sellerStrategy = 'Protecting merchant 15% margin floor while securing fast volume settlement';

  if (ai) {
    try {
      const prompt = `You are executing an Autonomous Agent-to-Agent (A2A) Commerce Negotiation protocol between a Buyer AI Agent and a Seller AI Agent for PayPal Connect.
      
Goal: The user gave this shopping directive: "${params.userGoalPrompt}".
Target Product: "${targetProduct.title}" (${targetProduct.category})
List Price: $${listPrice}
Seller Minimum Reserve Floor: $${minPrice} (DO NOT settle below this!)
Buyer Max Budget: $${buyerBudget}

Perform an autonomous 4-step negotiation dialogue between buyer_agent and seller_agent.
Step 1: buyer_agent analyzes product and opens offer.
Step 2: seller_agent counters based on warranty/margin.
Step 3: buyer_agent makes a final offer contingent on separate PayPal buyer approval.
Step 4: seller_agent accepts.

Return STRICT JSON matching:
{
  "agreedPrice": number (between ${minPrice} and ${buyerBudget}),
  "buyerStrategy": string,
  "sellerStrategy": string,
  "dialogue": [
    { "step": 1, "agent": "buyer_agent", "message": string, "offerPrice": number },
    { "step": 2, "agent": "seller_agent", "message": string, "offerPrice": number },
    { "step": 3, "agent": "buyer_agent", "message": string, "offerPrice": number },
    { "step": 4, "agent": "seller_agent", "message": string, "offerPrice": number }
  ]
}`;

      const res = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(res.text || '{}');
      if (
        typeof parsed.agreedPrice === 'number' &&
        parsed.agreedPrice >= minPrice &&
        parsed.agreedPrice <= buyerBudget &&
        typeof parsed.buyerStrategy === 'string' &&
        typeof parsed.sellerStrategy === 'string' &&
        Array.isArray(parsed.dialogue) &&
        parsed.dialogue.length === 4 &&
        parsed.dialogue.every((turn: any) =>
          ['buyer_agent', 'seller_agent'].includes(turn.agent) &&
          typeof turn.message === 'string' &&
          typeof turn.offerPrice === 'number'
        )
      ) {
        agreedPrice = Number(parsed.agreedPrice.toFixed(2));
        buyerStrategy = parsed.buyerStrategy;
        sellerStrategy = parsed.sellerStrategy;
        parsed.dialogue.forEach((turn: any, index: number) => {
          dialogue.push({
            step: index + 1,
            agent: turn.agent,
            message: turn.message,
            offerPrice: turn.offerPrice,
          });
        });
        aiMode = 'gemini';
      }
    } catch (err) {
      console.warn('A2A Gemini negotiation note:', err);
    }
  }

  // Fallback dialogue if empty
  if (dialogue.length === 0) {
    dialogue.push({
      step: 1,
      agent: 'buyer_agent',
      message: `Autonomous Buyer Agent initiating purchase for "${targetProduct.title}". Offering $${(listPrice * 0.85).toFixed(2)}.`,
      offerPrice: Number((listPrice * 0.85).toFixed(2)),
    });
    dialogue.push({
      step: 2,
      agent: 'seller_agent',
      message: `Seller Agent reviewing margin floor. Countering at $${(listPrice * 0.92).toFixed(2)} with express shipping.`,
      offerPrice: Number((listPrice * 0.92).toFixed(2)),
    });
    dialogue.push({
      step: 3,
      agent: 'buyer_agent',
      message: `Buyer Agent proposes $${agreedPrice}; any payment still requires buyer approval in PayPal Sandbox.`,
      offerPrice: agreedPrice,
    });
    dialogue.push({
      step: 4,
      agent: 'seller_agent',
      message: `Seller Agent accepts the proposed price. No payment has been made or held.`,
      offerPrice: agreedPrice,
    });
  }

  return {
    success: true,
    aiMode,
    product: {
      id: targetProduct.id,
      name: targetProduct.title,
      listPrice,
      sellerEmail: targetProduct.seller_id.includes('@') ? targetProduct.seller_id : null,
    },
    buyerAgentStrategy: buyerStrategy,
    sellerAgentStrategy: sellerStrategy,
    dialogue,
    agreedPrice,
    savings: Number((listPrice - agreedPrice).toFixed(2)),
    paymentStatus: 'PENDING_APPROVAL',
    timestamp: new Date().toISOString(),
  };
}

// -------------------------------------------------------------
// Contractor Milestone Verification & Instant Payout Service
// -------------------------------------------------------------

export interface MilestonePayoutRequest {
  contractId: string;
  milestoneTitle: string;
  contractorEmail: string;
  amount: number;
  deliverableBase64?: string;
  mimeType?: string;
  deliverableNotes?: string;
  humanApproved?: boolean;
}

export interface MilestonePayoutResult {
  success: boolean;
  verified: boolean;
  aiVerificationScore: number;
  aiAuditSummary: string;
  payoutBatchId?: string;
  contractorEmail: string;
  disbursedAmount: number;
  paypalResponse?: any;
  timestamp: string;
}

export async function processContractorMilestonePayout(params: MilestonePayoutRequest): Promise<MilestonePayoutResult> {
  const amount = Number(params.amount);
  if (!params.contractorEmail.includes('@')) {
    throw new Error('A valid PayPal Sandbox recipient email is required.');
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 5000) {
    throw new Error('Payout amount must be greater than zero and no more than $5,000.');
  }
  if (params.humanApproved !== true) {
    throw new Error('Explicit human approval is required before submitting a payout.');
  }

  const ai = getGeminiClient();
  const cleanBase64 = (params.deliverableBase64 || '').replace(/^data:[^;]+;base64,/, '').trim();
  const isValidBase64 = cleanBase64.length > 100 && !cleanBase64.includes(' ');

  if (!isValidBase64) {
    throw new Error('A real deliverable file is required before a milestone payout can be considered.');
  }
  if (!ai) {
    throw new Error('Gemini is not configured; the deliverable cannot be audited.');
  }

  const mime = params.mimeType || 'image/jpeg';
  if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(mime)) {
    throw new Error('Unsupported deliverable type. Upload a JPEG, PNG, WebP, or PDF file.');
  }

  let verified: boolean;
  let score: number;
  let auditSummary: string;
  try {
    const prompt = `You are an AI Quality Assurance Inspector for Freelancer/Contractor Milestones.
Inspect this deliverable image/document for milestone: "${params.milestoneTitle}".
Contractor notes: "${params.deliverableNotes || 'Completed milestone task.'}"

Verify if the deliverable appears complete, professional, and authentic.
Return STRICT JSON:
{
  "verified": boolean,
  "confidenceScore": number (0.0 to 1.0),
  "summary": string
}`;

    const res = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { inlineData: { mimeType: mime, data: cleanBase64 } },
        { text: prompt },
      ],
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(res.text || '{}');
    if (typeof parsed.verified !== 'boolean' || typeof parsed.confidenceScore !== 'number' || typeof parsed.summary !== 'string') {
      throw new Error('Gemini audit response did not match the required result schema.');
    }
    verified = parsed.verified;
    score = Math.max(0, Math.min(1, parsed.confidenceScore));
    auditSummary = parsed.summary;
  } catch (err) {
    console.error('Milestone Gemini audit failed:', err);
    throw err;
  }

  if (!verified || score < 0.9) {
    return {
      success: false,
      verified,
      aiVerificationScore: score,
      aiAuditSummary: auditSummary,
      contractorEmail: params.contractorEmail,
      disbursedAmount: 0,
      timestamp: new Date().toISOString(),
    };
  }

  // Disburse via PayPal Batch Payouts API
  const token = await payPalService.getAccessToken();
  const res = await fetch('https://api-m.sandbox.paypal.com/v1/payments/payouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: 'Contractor_' + Date.now(),
          email_subject: `PayPal Connect: Instant Milestone Payout for ${params.milestoneTitle}`,
        },
        items: [
          {
            recipient_type: 'EMAIL',
            amount: {
              value: amount.toFixed(2),
              currency: 'USD',
            },
            note: `Automated Payout for milestone: ${params.milestoneTitle} (Contract ${params.contractId})`,
            receiver: params.contractorEmail,
          },
        ],
      }),
    });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`PayPal payout request failed (${res.status}): ${errorText}`);
  }
  const paypalData: any = await res.json();
  const payoutBatchId = paypalData.batch_header?.payout_batch_id;
  if (!payoutBatchId) {
    throw new Error('PayPal accepted no payout batch ID; payout status is unconfirmed.');
  }

  return {
    success: true,
    verified: true,
    aiVerificationScore: score,
    aiAuditSummary: auditSummary,
    payoutBatchId,
    contractorEmail: params.contractorEmail,
    disbursedAmount: amount,
    paypalResponse: paypalData,
    timestamp: new Date().toISOString(),
  };
}
