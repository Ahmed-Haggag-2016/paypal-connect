/**
 * Dynamic Bargaining Agent
 * Implements autonomous multi-turn price negotiation driven by Gemini 3.8 Flash
 * Upon agreement, programmatically calls paypal.service.ts to create a PayPal Order Setup
 */

import { GoogleGenAI } from '@google/genai';
import { GEMINI_MODEL } from './gemini-config';
import { productRepository, ProductListing } from '../models/product.model';
import { payPalService } from './paypal.service';

export interface NegotiationTurnItem {
  turn: number;
  agent: 'buyer_agent' | 'seller_agent' | 'mediator';
  proposedPrice: number;
  message: string;
}

export interface NegotiateProductPriceResult {
  success: boolean;
  aiMode: 'gemini' | 'demo_fallback';
  agreedPrice: number;
  originalPrice: number;
  savings: number;
  roundsCount: number;
  dialogue: NegotiationTurnItem[];
  summary: string;
  orderId?: string;
  approvalUrl?: string;
  paypalOrder?: any;
  status: 'AGREEMENT_REACHED' | 'FAILED_BELOW_RESERVE' | 'ERROR';
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim().replace(/^["']|["']$/g, '');
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.length < 20) {
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

/**
 * Autonomous function: negotiateProductPrice
 * 1. Reads the product's list price and hidden 'min_acceptable_price' from the mock database.
 * 2. Uses Gemini 3.8 Flash to evaluate parameters and settle on a custom price.
 * 3. Upon successful agreement, programmatically calls paypal.service.ts to create a PayPal Order Setup.
 */
export async function negotiateProductPrice(
  productId: string,
  buyerMaxBudget: number,
  buyerMessage: string = 'Looking for a reasonable discount on this item.',
  buyerEmail: string = 'buyer@sandbox.paypal.com'
): Promise<NegotiateProductPriceResult> {
  if (!Number.isFinite(buyerMaxBudget) || buyerMaxBudget <= 0 || buyerMaxBudget > 5000) {
    throw new Error('Buyer budget must be greater than zero and no more than $5,000.');
  }
  // 1. Read product from mock database
  const product: ProductListing | null = productRepository.findById(productId);
  if (!product) {
    throw new Error(`Product listing with ID "${productId}" was not found.`);
  }

  const listPrice = product.list_price;
  const minAcceptablePrice = product.min_acceptable_price; // Secret floor price
  const dialogue: NegotiationTurnItem[] = [];

  // Edge case: buyer budget is strictly below seller floor price
  if (buyerMaxBudget < minAcceptablePrice) {
    dialogue.push({
      turn: 1,
      agent: 'buyer_agent',
      proposedPrice: buyerMaxBudget,
      message: `Buyer proposed $${buyerMaxBudget.toFixed(2)}: "${buyerMessage}"`,
    });
    dialogue.push({
      turn: 2,
      agent: 'seller_agent',
      proposedPrice: listPrice,
      message: `The seller's operational reserve requires a baseline higher than $${buyerMaxBudget.toFixed(2)}. The lowest listed price is $${listPrice.toFixed(2)}.`,
    });
    dialogue.push({
      turn: 3,
      agent: 'mediator',
      proposedPrice: 0,
      message: `Negotiation ended without agreement: Buyer maximum budget ($${buyerMaxBudget.toFixed(2)}) is below the seller's minimum acceptable reserve threshold.`,
    });

    return {
      success: false,
      aiMode: 'demo_fallback',
      agreedPrice: 0,
      originalPrice: listPrice,
      savings: 0,
      roundsCount: dialogue.length,
      dialogue,
      summary: 'Buyer maximum budget is below the seller reserve price.',
      status: 'FAILED_BELOW_RESERVE',
    };
  }

  // 2. Use Gemini 3.8 Flash for Autonomous Price Settlement
  const ai = getGeminiClient();
  let aiMode: NegotiateProductPriceResult['aiMode'] = 'demo_fallback';
  let agreedPrice: number | null = null;
  let summaryText = '';

  if (ai) {
    try {
      const prompt = `You are an autonomous commercial bargaining agent for PayPal Connect Marketplace.
Evaluate these parameters and simulate a multi-turn negotiation loop to reach a binding custom price:
- Product: "${product.title}" (${product.category})
- Listed Retail Price: $${listPrice}
- Hidden Seller Minimum Acceptable Floor: $${minAcceptablePrice} (Strict lower boundary. Never settle below this!)
- Buyer Maximum Budget: $${buyerMaxBudget}
- Buyer Message: "${buyerMessage}"

Negotiation Requirements:
1. Conduct exactly 3 concise, realistic turns between buyer_agent, seller_agent, and mediator.
2. Settle on a fair custom price that is >= $${minAcceptablePrice} and <= $${buyerMaxBudget}.
3. The settled price must deliver demonstrable savings to the buyer while preserving merchant margin.

Return STRICT JSON matching this schema:
{
  "agreedPrice": number,
  "summary": string,
  "turns": [
    { "turn": 1, "agent": "buyer_agent", "proposedPrice": number, "message": string },
    { "turn": 2, "agent": "seller_agent", "proposedPrice": number, "message": string },
    { "turn": 3, "agent": "mediator", "proposedPrice": number, "message": string }
  ]
}`;

      const aiResponse = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = (aiResponse.text || '').trim();
      const parsed = JSON.parse(responseText);

      if (
        typeof parsed.agreedPrice === 'number' &&
        parsed.agreedPrice >= minAcceptablePrice &&
        parsed.agreedPrice <= buyerMaxBudget &&
        typeof parsed.summary === 'string' &&
        Array.isArray(parsed.turns) &&
        parsed.turns.length === 3 &&
        parsed.turns.every((turn: any) =>
          ['buyer_agent', 'seller_agent', 'mediator'].includes(turn.agent) &&
          Number.isFinite(turn.proposedPrice) &&
          typeof turn.message === 'string'
        )
      ) {
        agreedPrice = Number(parsed.agreedPrice.toFixed(2));
        summaryText = parsed.summary || `Settled via Gemini 3.8 Flash autonomous bargaining at $${agreedPrice}.`;
        parsed.turns.forEach((turn: any, index: number) => {
          dialogue.push({
            turn: index + 1,
            agent: turn.agent,
            proposedPrice: turn.proposedPrice,
            message: turn.message,
          });
        });
        aiMode = 'gemini';
      }
    } catch (err: any) {
      console.warn('Gemini 3.8 Flash bargaining fallback:', err?.message || err);
    }
  }

  // Deterministic Game-Theoretic Nash Bargaining Fallback if AI unavailable or rate-limited
  if (agreedPrice === null) {
    const openingBuyerOffer = Number(
      Math.max(minAcceptablePrice, Math.min(buyerMaxBudget, listPrice * 0.85)).toFixed(2)
    );
    const sellerCounter = Number(
      (listPrice - (listPrice - minAcceptablePrice) * 0.4).toFixed(2)
    );
    agreedPrice = Number(
      Math.min(buyerMaxBudget, Math.max(minAcceptablePrice, (openingBuyerOffer + sellerCounter) / 2)).toFixed(2)
    );

    dialogue.push({
      turn: 1,
      agent: 'buyer_agent',
      proposedPrice: openingBuyerOffer,
      message: `Buyer Agent offers $${openingBuyerOffer.toFixed(2)} based on volume comparison: "${buyerMessage}"`,
    });
    dialogue.push({
      turn: 2,
      agent: 'seller_agent',
      proposedPrice: sellerCounter,
      message: `Seller Agent counters at $${sellerCounter.toFixed(2)} with express shipping and 2-year warranty included.`,
    });
    dialogue.push({
      turn: 3,
      agent: 'mediator',
      proposedPrice: agreedPrice,
      message: `Mediator settled agreement at $${agreedPrice.toFixed(2)}. Both parties margin constraints satisfied.`,
    });

    summaryText = `Autonomous mediation concluded at $${agreedPrice.toFixed(2)}.`;
  }

  const savings = Number((listPrice - agreedPrice).toFixed(2));

  // 3. Programmatically call paypal.service.ts to create PayPal Order Setup
  let orderId: string | undefined;
  let approvalUrl: string | undefined;
  let paypalOrderPayload: any;
  if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
    const order = await payPalService.createOrder(
      String(agreedPrice),
      product.currency || 'USD',
      `PayPal Connect purchase: ${product.title} (negotiated price)`,
      'CAPTURE',
      product.seller_id.includes('@') ? product.seller_id : undefined
    );
    orderId = order.id;
    paypalOrderPayload = order;
    approvalUrl = order.links?.find((link: any) => link.rel === 'approve')?.href;
    if (!approvalUrl) {
      throw new Error('PayPal created an order without a buyer approval URL.');
    }
  }

  return {
    success: true,
    aiMode,
    agreedPrice,
    originalPrice: listPrice,
    savings,
    roundsCount: dialogue.length,
    dialogue,
    summary: summaryText,
    orderId,
    approvalUrl,
    paypalOrder: paypalOrderPayload,
    status: 'AGREEMENT_REACHED',
  };
}
