/**
 * Autonomous Multi-Agent Negotiation Service
 * Simulates a negotiation loop between a Buyer Agent and Seller Agent using Google Gemini
 */

import { GoogleGenAI } from '@google/genai';
import { GEMINI_MODEL } from './gemini-config';
import { ProductListing } from '../models/product.model';

export interface NegotiationTurn {
  turn: number;
  agent: 'buyer_agent' | 'seller_agent' | 'mediator';
  proposedPrice: number;
  message: string;
}

export interface NegotiationResult {
  success: boolean;
  aiMode: 'gemini' | 'demo_fallback';
  agreedPrice: number;
  savings: number;
  roundsCount: number;
  dialogue: NegotiationTurn[];
  summary: string;
}

export class NegotiationService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      try {
        this.ai = new GoogleGenAI({ apiKey: key });
      } catch (err) {
        console.warn('Gemini AI client initialization warning:', err);
      }
    }
  }

  /**
   * Executes multi-agent negotiation loop between Buyer and Seller agents
   */
  public async simulateNegotiationLoop(
    buyerId: string,
    product: ProductListing,
    maxBuyerBudget: number
  ): Promise<NegotiationResult> {
    if (!Number.isFinite(maxBuyerBudget) || maxBuyerBudget <= 0 || maxBuyerBudget > 5000) {
      throw new Error('Buyer budget must be greater than zero and no more than $5,000.');
    }
    const dialogue: NegotiationTurn[] = [];

    // Constraint validation: If buyer's absolute max budget is below seller's hard floor, cannot reach deal
    if (maxBuyerBudget < product.min_acceptable_price) {
      dialogue.push({
        turn: 1,
        agent: 'buyer_agent',
        proposedPrice: maxBuyerBudget,
        message: `Hello! I am authorized on behalf of Buyer ${buyerId} to offer $${maxBuyerBudget.toFixed(2)} for ${product.title}.`,
      });
      dialogue.push({
        turn: 2,
        agent: 'seller_agent',
        proposedPrice: product.list_price,
        message: `Thank you for your interest. However, $${maxBuyerBudget.toFixed(2)} is below the minimum reserve threshold of our supplier. The lowest listed price is $${product.list_price.toFixed(2)}.`,
      });
      dialogue.push({
        turn: 3,
        agent: 'mediator',
        proposedPrice: 0,
        message: 'No consensus reached: Buyer budget is below seller floor price.',
      });

      return {
        success: false,
        aiMode: 'demo_fallback',
        agreedPrice: 0,
        savings: 0,
        roundsCount: 2,
        dialogue,
        summary: 'Negotiation terminated: Buyer maximum budget is below the minimum acceptable seller reserve.',
      };
    }

    // Try live Gemini multi-agent prompt if AI is available
    let aiMode: NegotiationResult['aiMode'] = 'demo_fallback';
    if (this.ai) {
      try {
        const prompt = `You are an automated commercial negotiation engine simulating a negotiation between two AI agents:
1. BUYER AGENT:
   - Target product: "${product.title}"
   - Listed retail price: $${product.list_price}
   - Max Buyer Budget: $${maxBuyerBudget}
   - Goal: Negotiate the lowest price possible without exceeding budget.

2. SELLER AGENT:
   - List Price: $${product.list_price}
   - Secret Floor Price: $${product.min_acceptable_price} (NEVER reveal this number directly)
   - Goal: Maximize profit, make reasonable concessions down to floor if needed to close the deal.

Simulate exactly 3 realistic, concise dialogue turns between the Buyer Agent and Seller Agent, reaching a mutually acceptable final price that satisfies both constraints.
Return strictly valid JSON with this exact schema:
{
  "agreedPrice": <number>,
  "turns": [
    { "agent": "buyer_agent", "proposedPrice": <number>, "message": "<string>" },
    { "agent": "seller_agent", "proposedPrice": <number>, "message": "<string>" },
    { "agent": "buyer_agent", "proposedPrice": <number>, "message": "<string>" }
  ],
  "summary": "<string explaining the consensus>"
}`;

        const aiPromise = this.ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI response timeout (6s threshold)')), 6000)
        );

        const response: any = await Promise.race([aiPromise, timeoutPromise]);

        const parsed = JSON.parse(response.text || '{}');
        if (
          typeof parsed.agreedPrice === 'number' &&
          parsed.agreedPrice >= product.min_acceptable_price &&
          parsed.agreedPrice <= maxBuyerBudget &&
          Array.isArray(parsed.turns) &&
          parsed.turns.length === 3 &&
          parsed.turns.every((turn: any) =>
            ['buyer_agent', 'seller_agent', 'mediator'].includes(turn.agent) &&
            Number.isFinite(turn.proposedPrice) &&
            typeof turn.message === 'string'
          ) &&
          typeof parsed.summary === 'string'
        ) {
          const validPrice = Number(parsed.agreedPrice.toFixed(2));
          parsed.turns.forEach((turn: any, index: number) => {
            dialogue.push({
              turn: index + 1,
              agent: turn.agent,
              proposedPrice: turn.proposedPrice,
              message: turn.message,
            });
          });
          aiMode = 'gemini';

          return {
            success: true,
            aiMode,
            agreedPrice: Number(validPrice.toFixed(2)),
            savings: Number((product.list_price - validPrice).toFixed(2)),
            roundsCount: dialogue.length,
            dialogue,
            summary: parsed.summary || `Consensus reached via Gemini multi-agent mediation at $${validPrice.toFixed(2)}.`,
          };
        }
      } catch (geminiErr) {
        console.warn('Gemini live negotiation call fallback:', geminiErr);
      }
    }

    // Deterministic Multi-Agent Algorithmic Consensus (Game-Theoretic Nash Bargaining)
    const openingBuyerOffer = Number(
      Math.max(product.min_acceptable_price * 0.95, product.list_price * 0.8).toFixed(2)
    );
    const sellerCounterOffer = Number(
      (product.list_price - (product.list_price - product.min_acceptable_price) * 0.45).toFixed(2)
    );
    const finalAgreedPrice = Number(
      Math.min(maxBuyerBudget, (openingBuyerOffer + sellerCounterOffer) / 2).toFixed(2)
    );

    dialogue.push({
      turn: 1,
      agent: 'buyer_agent',
      proposedPrice: openingBuyerOffer,
      message: `Buyer Agent offers an immediate cash settlement of $${openingBuyerOffer.toFixed(2)} based on current market volume.`,
    });

    dialogue.push({
      turn: 2,
      agent: 'seller_agent',
      proposedPrice: sellerCounterOffer,
      message: `Seller Agent recognizes buyer credit history, countering at $${sellerCounterOffer.toFixed(2)} with express fulfillment.`,
    });

    dialogue.push({
      turn: 3,
      agent: 'buyer_agent',
      proposedPrice: finalAgreedPrice,
      message: `Buyer Agent accepts middle convergence at $${finalAgreedPrice.toFixed(2)}. Preparing PayPal Order Authorization.`,
    });

    return {
      success: true,
      aiMode,
      agreedPrice: finalAgreedPrice,
      savings: Number((product.list_price - finalAgreedPrice).toFixed(2)),
      roundsCount: 3,
      dialogue,
      summary: `Automated multi-agent consensus achieved at $${finalAgreedPrice.toFixed(2)}, saving the buyer $${(product.list_price - finalAgreedPrice).toFixed(2)}.`,
    };
  }
}

export const negotiationService = new NegotiationService();
