/**
 * Negotiation Controller
 * Endpoints for AI multi-agent negotiation and PayPal Order Authorization with Human-in-the-Loop review
 */

import { Request, Response } from 'express';
import { productRepository } from '../models/product.model';
import { negotiationService } from '../services/negotiation.service';
import { payPalService } from '../services/paypal.service';

export async function handleNegotiate(req: Request, res: Response) {
  try {
    const { buyer_id, product_id, max_buyer_budget } = req.body || {};

    // 1. Validation
    if (!buyer_id || typeof buyer_id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing "buyer_id" field (string required).',
      });
    }

    if (!product_id || typeof product_id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing "product_id" field (string required).',
      });
    }

    const budget = Number(max_buyer_budget);
    if (isNaN(budget) || budget <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing "max_buyer_budget" field (positive number required).',
      });
    }

    // 2. Fetch Product from Model
    const product = productRepository.findById(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: `Product listing "${product_id}" was not found.`,
        available_products: productRepository.listAll().map((p) => ({ id: p.id, title: p.title })),
      });
    }

    // 3. Execute Automated Multi-Agent Negotiation Loop using Gemini
    const negotiationResult = await negotiationService.simulateNegotiationLoop(
      buyer_id,
      product,
      budget
    );

    if (!negotiationResult.success) {
      return res.status(200).json({
        success: false,
        status: 'NEGOTIATION_FAILED',
        message: negotiationResult.summary,
        product: {
          id: product.id,
          title: product.title,
          list_price: product.list_price,
        },
        dialogue: negotiationResult.dialogue,
      });
    }

    // 4. On Successful Negotiation: Setup PayPal Order Authorization with Human-in-the-Loop state
    let paypalAuthResult = null;
    if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
      paypalAuthResult = await payPalService.createOrderAuthorization({
        buyerId: buyer_id,
        sellerId: product.seller_id,
        productId: product.id,
        agreedPrice: negotiationResult.agreedPrice,
        currency: product.currency,
        description: `AI Negotiated Order for ${product.title} (Approved at $${negotiationResult.agreedPrice.toFixed(2)})`,
      });
    }

    // 5. Clean Architecture Response
    return res.status(200).json({
      success: true,
      status: 'NEGOTIATION_COMPLETED_PENDING_APPROVAL',
      product: {
        id: product.id,
        title: product.title,
        seller_id: product.seller_id,
        list_price: product.list_price,
        currency: product.currency,
      },
      negotiation: {
        agreed_price: negotiationResult.agreedPrice,
        savings: negotiationResult.savings,
        rounds_count: negotiationResult.roundsCount,
        summary: negotiationResult.summary,
        dialogue: negotiationResult.dialogue,
        aiMode: negotiationResult.aiMode,
      },
      paypal_integration: {
        configured: !!paypalAuthResult,
        order_id: paypalAuthResult?.orderId,
        intent: 'AUTHORIZE',
        human_in_the_loop_state: {
          status: 'PENDING_HUMAN_APPROVAL',
          required_action: 'Buyer must approve the real PayPal Sandbox order before it can be authorized.',
          approval_url: paypalAuthResult?.humanApprovalState.approvalUrl,
        },
      },
    });
  } catch (err: any) {
    console.error('Unhandled error in /negotiate:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error processing negotiation',
    });
  }
}

/**
 * Human-in-the-Loop Approval Action Endpoint
 */
export async function handleApproveOrder(req: Request, res: Response) {
  try {
    const { order_id } = req.body || {};
    if (!order_id) {
      return res.status(400).json({ success: false, error: 'Missing "order_id" parameter' });
    }

    const approvalState = await payPalService.authorizeOrder(String(order_id));
    return res.json({
      success: true,
      message: `PayPal confirmed authorization ${approvalState.authorizationId}. This is not escrow.`,
      state: approvalState,
    });
  } catch (err: any) {
    return res.status(404).json({ success: false, error: err.message });
  }
}
