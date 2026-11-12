/**
 * PayPal Order Controller
 * REST endpoints for creating, authorizing, and capturing PayPal Sandbox orders
 */

import { Request, Response } from 'express';
import { payPalService } from '../services/paypal.service';

/**
 * POST /api/orders
 * Creates a new PayPal order with intent='CAPTURE' or 'AUTHORIZE', supporting payee email routing
 */
export async function handleCreateOrder(req: Request, res: Response) {
  try {
    const {
      amount,
      currency = 'USD',
      description = 'Marketplace Purchase',
      intent = 'CAPTURE',
      payeeEmail,
    } = req.body || {};
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 5000) {
      return res.status(400).json({
        success: false,
        error: 'amount is required and must be greater than zero and no more than $5,000.',
      });
    }

    const order = await payPalService.createOrder(
      parsedAmount.toFixed(2),
      String(currency),
      String(description),
      intent === 'AUTHORIZE' ? 'AUTHORIZE' : 'CAPTURE',
      payeeEmail ? String(payeeEmail) : undefined
    );

    return res.status(201).json({
      success: true,
      orderId: order.id,
      status: order.status,
      links: order.links,
    });
  } catch (err: any) {
    console.error('Error creating PayPal order:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to initialize PayPal order',
    });
  }
}

/**
 * POST /api/orders/:orderId/authorize
 * Executes live Order Authorization
 */
export async function handleAuthorizeOrder(req: Request, res: Response) {
  try {
    const orderId = req.params.orderId || req.params.orderID || req.body?.orderId;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required orderId parameter',
      });
    }

    const authResult = await payPalService.authorizeOrder(String(orderId));
    let walletBalances: any[] = [];
    let balanceLookupError: string | undefined;
    try {
      walletBalances = await payPalService.getWalletBalances();
    } catch (err) {
      balanceLookupError = err instanceof Error ? err.message : 'PayPal balance lookup failed.';
      console.warn('PayPal order was authorized, but balance lookup failed:', balanceLookupError);
    }

    const userSession = {
      email: authResult.payer.email_address,
      name: authResult.payer.name,
      given_name: authResult.payer.given_name,
      surname: authResult.payer.surname,
      country: authResult.payer.country_code,
      currency: authResult.amount?.currency_code || 'USD',
      currencySymbol: authResult.amount?.currency_code === 'EUR' ? '€' : authResult.amount?.currency_code === 'EGP' ? 'E£' : '$',
      balance: Number(walletBalances.find((entry) => entry.currency === (authResult.amount?.currency_code || 'USD'))?.value || 0),
      accountId: authResult.payer.payer_id,
      status: 'Authorized by PayPal Sandbox',
      role: 'buyer' as const,
      walletBalances,
    };

    return res.status(200).json({
      success: true,
      orderId: authResult.orderId,
      authorizationId: authResult.authorizationId,
      status: authResult.status,
      payer: authResult.payer,
      user: userSession,
      amount: authResult.amount,
      walletBalances,
      balanceLookupError,
    });
  } catch (err: any) {
    console.error('Error authorizing PayPal order:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to execute PayPal order authorization',
    });
  }
}

/**
 * POST /api/orders/:orderId/capture
 * Executes live Order Capture (intent: CAPTURE), finalizing payment & balance reduction
 */
export let latestCapturedPayPalUser: any = null;

export async function handleCaptureOrder(req: Request, res: Response) {
  try {
    const orderId = req.params.orderId || req.params.orderID || req.body?.orderId;
    const reqRole = req.body?.role;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required orderId parameter',
      });
    }

    const captureResult = await payPalService.captureOrder(String(orderId));
    if (captureResult.status !== 'COMPLETED') {
      return res.status(202).json({
        success: false,
        orderId: captureResult.orderId,
        captureId: captureResult.captureId,
        status: captureResult.status,
        error: `PayPal has not confirmed capture as completed (status: ${captureResult.status}).`,
      });
    }

    let walletBalances: any[] = [];
    let balanceLookupError: string | undefined;
    try {
      walletBalances = await payPalService.getWalletBalances();
    } catch (err) {
      balanceLookupError = err instanceof Error ? err.message : 'PayPal balance lookup failed.';
      console.warn('PayPal order was captured, but balance lookup failed:', balanceLookupError);
    }

    const isSeller = reqRole === 'seller';
    const currency = captureResult.amount?.currency_code || 'USD';
    const userSession = {
      email: captureResult.payer.email_address,
      name: captureResult.payer.name,
      given_name: captureResult.payer.given_name,
      surname: captureResult.payer.surname,
      country: captureResult.payer.country_code,
      currency,
      currencySymbol: currency === 'EUR' ? '€' : currency === 'EGP' ? 'E£' : '$',
      balance: Number(walletBalances.find((entry) => entry.currency === currency)?.value || 0),
      accountId: captureResult.payer.payer_id,
      status: 'Payment captured by PayPal Sandbox',
      role: isSeller ? ('seller' as const) : ('buyer' as const),
      walletBalances,
    };

    // Cache this verified authentic profile so all views get the exact same real data
    latestCapturedPayPalUser = { ...userSession };

    return res.status(200).json({
      success: true,
      orderId: captureResult.orderId,
      captureId: captureResult.captureId,
      status: captureResult.status,
      payer: captureResult.payer,
      user: userSession,
      amount: captureResult.amount,
      walletBalances,
      balanceLookupError,
    });
  } catch (err: any) {
    console.error('Error capturing PayPal order:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to execute PayPal order capture',
    });
  }
}

/**
 * GET /api/wallet/balances
 * Fetches live multi-currency wallet balances from PayPal
 */
export async function handleGetWalletBalances(_req: Request, res: Response) {
  try {
    const balances = await payPalService.getWalletBalances();
    return res.json({
      success: true,
      balances,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch wallet balances',
    });
  }
}

/**
 * POST /api/auth/paypal-login
 * Authenticates user programmatically via PayPal REST API, pulling live verified account profile
 */
export async function handleAuthenticateUser(req: Request, res: Response) {
  try {
    const { code, redirectUri, role = 'buyer' } = req.body || {};
    if (typeof code !== 'string' || !code || typeof redirectUri !== 'string' || !redirectUri) {
      return res.status(400).json({
        success: false,
        error: 'PayPal OAuth authorization code and redirect URI are required; an email address alone cannot authenticate an account.',
      });
    }
    if (role !== 'buyer' && role !== 'seller') {
      return res.status(400).json({ success: false, error: 'Role must be buyer or seller.' });
    }
    const userSession = await payPalService.exchangeAuthCodeForProfile(code, redirectUri, role);

    return res.status(200).json({
      success: true,
      user: userSession,
      message: `PayPal Sandbox account connected for ${userSession.name}.`,
    });
  } catch (err: any) {
    console.error('Error authenticating with PayPal Sandbox:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'PayPal Sandbox authentication failed',
    });
  }
}
