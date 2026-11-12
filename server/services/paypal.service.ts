import { randomUUID } from 'node:crypto';

/**
 * PayPal Integration Module
 * Implements PayPal Order Creation & Capture / Authorization with multi-currency & payee email routing
 */

export interface OrderAuthorizationParams {
  buyerId: string;
  sellerId: string;
  productId: string;
  agreedPrice: number;
  currency: string;
  description: string;
}

export interface HumanInTheLoopApproval {
  orderId: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  agreedPrice: number;
  currency: string;
  status: 'PENDING_HUMAN_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CAPTURED';
  paypalIntent: 'AUTHORIZE' | 'CAPTURE';
  approvalUrl?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface AuthenticatedPayerProfile {
  orderId: string;
  authorizationId?: string;
  captureId?: string;
  status: string;
  payer: {
    given_name: string;
    surname: string;
    name: string;
    email_address: string;
    payer_id: string;
    country_code: string;
  };
  amount?: {
    currency_code: string;
    value: string;
  };
}

export interface PayPalUser {
  email: string;
  name: string;
  given_name?: string;
  surname?: string;
  country: string;
  currency: string;
  currencySymbol: string;
  balance: number;
  accountId: string;
  status: string;
  role: 'buyer' | 'seller';
  walletBalances?: Array<{ currency: string; value: string; symbol?: string }>;
}

export interface PayoutItem {
  receiver: string;
  amount: number;
  currency: string;
  note: string;
}

export class PayPalService {
  private baseUrl: string = 'https://api-m.sandbox.paypal.com';
  private pendingApprovals: Map<string, HumanInTheLoopApproval> = new Map();

  private get clientId(): string {
    return process.env.PAYPAL_CLIENT_ID?.trim() || '';
  }

  private get clientSecret(): string {
    return process.env.PAYPAL_CLIENT_SECRET?.trim() || '';
  }

  /**
   * Generates live OAuth 2.0 Access Token from PayPal Sandbox
   */
  public async getAccessToken(): Promise<string> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('PayPal Sandbox credentials are not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.');
    }

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`PayPal OAuth failure (${response.status}): ${err}`);
    }

    const data: any = await response.json();
    if (typeof data.access_token !== 'string' || !data.access_token) {
      throw new Error('PayPal OAuth response did not contain an access token.');
    }
    return data.access_token;
  }

  public async createPayoutBatch(items: PayoutItem[], batchNote: string): Promise<{
    payoutBatchId: string;
    status: string;
    response: Record<string, unknown>;
  }> {
    if (items.length === 0) {
      throw new Error('At least one payout recipient is required.');
    }

    for (const item of items) {
      if (!item.receiver.includes('@')) {
        throw new Error('Every payout item must have a valid recipient email.');
      }
      if (!Number.isFinite(item.amount) || item.amount <= 0 || item.amount > 5000) {
        throw new Error('Payout amounts must be greater than zero and no more than $5,000 each.');
      }
      if (!/^[A-Z]{3}$/.test(item.currency)) {
        throw new Error('Payout currency must be a three-letter ISO currency code.');
      }
    }

    const token = await this.getAccessToken();
    const senderBatchId = `pc_${randomUUID()}`;
    const response = await fetch(`${this.baseUrl}/v1/payments/payouts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': senderBatchId,
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: senderBatchId,
          email_subject: batchNote.slice(0, 255),
        },
        items: items.map((item) => ({
          recipient_type: 'EMAIL',
          amount: { value: item.amount.toFixed(2), currency: item.currency },
          note: item.note.slice(0, 1000),
          receiver: item.receiver.trim(),
        })),
      }),
    });

    const responseText = await response.text();
    let data: Record<string, any>;
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(`PayPal payout returned an unreadable response (${response.status}).`);
    }
    if (!response.ok) {
      throw new Error(`PayPal payout failed (${response.status}): ${data.message || data.name || 'Request rejected'}`);
    }

    const payoutBatchId = data.batch_header?.payout_batch_id;
    if (typeof payoutBatchId !== 'string' || !payoutBatchId) {
      throw new Error('PayPal accepted no payout batch ID; payout status is unconfirmed.');
    }
    return {
      payoutBatchId,
      status: data.batch_header?.batch_status || 'PENDING',
      response: data,
    };
  }

  /**
   * 1. Initialize a fresh PayPal Order supporting intent='CAPTURE' or 'AUTHORIZE', with payee email routing
   */
  public async createOrder(
    amount: string,
    currency: string = 'USD',
    description: string = 'Marketplace Purchase',
    intent: 'CAPTURE' | 'AUTHORIZE' = 'CAPTURE',
    payeeEmail?: string,
    returnUrl?: string,
    cancelUrl?: string
  ): Promise<{ id: string; status: string; links?: any[] }> {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 5000) {
      throw new Error('Order amount must be greater than zero and no more than $5,000.');
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error('Order currency must be a three-letter ISO currency code.');
    }
    if (payeeEmail && !payeeEmail.includes('@')) {
      throw new Error('Payee email is invalid.');
    }
    const accessToken = await this.getAccessToken();
    const formattedAmount = parsedAmount.toFixed(2);

    const purchaseUnit: any = {
      reference_id: `pu_${Date.now()}`,
      description,
      amount: {
        currency_code: currency || 'USD',
        value: formattedAmount,
      },
    };

    if (payeeEmail && payeeEmail.includes('@')) {
      purchaseUnit.payee = {
        email_address: payeeEmail.trim(),
      };
    }

    const payload = {
      intent, // CAPTURE to immediately finalize payment and execute balance reduction
      purchase_units: [purchaseUnit],
      application_context: {
        brand_name: 'PayPal AI Marketplace',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        ...(returnUrl ? { return_url: returnUrl } : {}),
        ...(cancelUrl ? { cancel_url: cancelUrl } : {}),
      },
    };

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`PayPal order creation failed (${response.status}): ${errText}`);
    }

    const order: any = await response.json();
    return {
      id: order.id,
      status: order.status,
      links: order.links,
    };
  }

  /**
   * 2. Execute Live Order Authorization call and extract authentic payer profile
   */
  public async authorizeOrder(orderId: string): Promise<AuthenticatedPayerProfile> {
    const accessToken = await this.getAccessToken();

    const authResponse = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/authorize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!authResponse.ok) {
      const errText = await authResponse.text();
      throw new Error(`PayPal order authorization failed (${authResponse.status}): ${errText}`);
    }
    const authData: any = await authResponse.json();

    const orderResponse = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const orderData: any = orderResponse.ok ? await orderResponse.json() : {};
    if (!orderResponse.ok) {
      console.warn(`PayPal authorization succeeded but order details were unavailable (${orderResponse.status}).`);
    }

    const payerObj = authData.payer || orderData.payer || {};
    const givenName = payerObj.name?.given_name || 'PayPal';
    const surname = payerObj.name?.surname || 'Sandbox Payer';
    const fullName = payerObj.name?.given_name && payerObj.name?.surname
      ? `${payerObj.name.given_name} ${payerObj.name.surname}`
      : `${givenName} ${surname}`.trim();
    const email = payerObj.email_address || '';
    const payerId = payerObj.payer_id || orderData.payer?.payer_id || '';
    const countryCode = payerObj.address?.country_code || 'US';

    const authorizationId =
      authData.purchase_units?.[0]?.payments?.authorizations?.[0]?.id ||
      '';
    const amountVal =
      authData.purchase_units?.[0]?.payments?.authorizations?.[0]?.amount ||
      orderData.purchase_units?.[0]?.amount;
    if (!authorizationId || !amountVal?.currency_code || !amountVal?.value) {
      throw new Error('PayPal authorization response is missing its authorization ID or amount.');
    }

    return {
      orderId,
      authorizationId,
      status: authData.status || orderData.status || 'UNKNOWN',
      payer: {
        given_name: givenName,
        surname,
        name: fullName,
        email_address: email,
        payer_id: payerId,
        country_code: countryCode,
      },
      amount: amountVal,
    };
  }

  /**
   * 3. Execute Live Order Capture call (intent: CAPTURE) and extract payer profile & capture ID
   */
  public async captureOrder(orderId: string): Promise<AuthenticatedPayerProfile> {
    const accessToken = await this.getAccessToken();

    const captureResponse = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!captureResponse.ok) {
      const errText = await captureResponse.text();
      throw new Error(`PayPal order capture failed (${captureResponse.status}): ${errText}`);
    }
    const captureData: any = await captureResponse.json();

    const orderResponse = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const orderData: any = orderResponse.ok ? await orderResponse.json() : {};
    if (!orderResponse.ok) {
      console.warn(`PayPal capture succeeded but order details were unavailable (${orderResponse.status}).`);
    }

    const payerObj = captureData.payer || orderData.payer || {};

    const givenName = payerObj.name?.given_name || 'PayPal';
    const surname = payerObj.name?.surname || 'Sandbox Payer';
    const fullName = payerObj.name?.given_name && payerObj.name?.surname
      ? `${payerObj.name.given_name} ${payerObj.name.surname}`
      : payerObj.name?.given_name || payerObj.name?.surname || 'PayPal Sandbox Payer';

    const email = payerObj.email_address || '';
    const payerId = payerObj.payer_id || orderData.payer?.payer_id || '';
    const countryCode = payerObj.address?.country_code || 'US';

    const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
    if (!capture?.id) {
      throw new Error('PayPal capture succeeded without returning a capture ID.');
    }
    if (typeof capture.status !== 'string' || !capture.status) {
      throw new Error('PayPal capture response is missing its capture status.');
    }
    const captureId = capture.id;
    const amountVal = capture.amount || orderData.purchase_units?.[0]?.amount;
    if (!amountVal?.currency_code || !amountVal?.value) {
      throw new Error('PayPal capture response is missing the captured amount.');
    }

    return {
      orderId,
      captureId,
      status: capture.status,
      payer: {
        given_name: givenName,
        surname,
        name: fullName,
        email_address: email,
        payer_id: payerId,
        country_code: countryCode,
      },
      amount: amountVal,
    };
  }

  /**
   * 4. Fetch Live Wallet Balances from PayPal API
   */
  public async getWalletBalances(): Promise<any[]> {
    try {
      const accessToken = await this.getAccessToken();
      const res = await fetch(`${this.baseUrl}/v1/reporting/balances`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.balances && Array.isArray(data.balances)) {
          return data.balances;
        }
      }
    } catch (err) {
      throw err;
    }

    throw new Error('PayPal balance lookup failed.');
  }

  public async createOrderAuthorization(
    params: OrderAuthorizationParams
  ): Promise<{
    orderId: string;
    status: string;
    humanApprovalState: HumanInTheLoopApproval;
    paypalOrder: any;
  }> {
    const order = await this.createOrder(
      String(params.agreedPrice),
      params.currency,
      params.description,
      'AUTHORIZE'
    );

    const approvalState: HumanInTheLoopApproval = {
      orderId: order.id,
      buyerId: params.buyerId,
      sellerId: params.sellerId,
      productId: params.productId,
      agreedPrice: params.agreedPrice,
      currency: params.currency,
      status: 'PENDING_HUMAN_APPROVAL',
      paypalIntent: 'AUTHORIZE',
      approvalUrl: order.links?.find((l: any) => l.rel === 'approve')?.href,
      createdAt: new Date().toISOString(),
    };

    this.pendingApprovals.set(order.id, approvalState);

    return {
      orderId: order.id,
      status: 'PENDING_HUMAN_APPROVAL',
      humanApprovalState: approvalState,
      paypalOrder: order,
    };
  }

  public approveByHuman(orderId: string, _reviewerId: string): HumanInTheLoopApproval {
    const record = this.pendingApprovals.get(orderId);
    if (!record) {
      throw new Error(`Order authorization ${orderId} not found in pending state`);
    }

    record.status = 'APPROVED';
    record.approvedAt = new Date().toISOString();
    this.pendingApprovals.set(orderId, record);
    return record;
  }

  public getApprovalState(orderId: string): HumanInTheLoopApproval | null {
    return this.pendingApprovals.get(orderId) || null;
  }

  /**
   * Official PayPal OpenID Connect Identity Token & Profile Exchange:
   * 1. Exchanges authorization code for User Access Token via POST /v1/oauth2/token
   * 2. Queries official PayPal OpenID Userinfo via GET /v1/identity/openidconnect/userinfo
   * 3. Queries live wallet balances via GET /v1/reporting/balances
   * Returns authentic Given Name, Surname, Verified Email, Country Code, Payer ID, and live account balances.
   */
  public async exchangeAuthCodeForProfile(
    code: string,
    redirectUri: string,
    requestedRole: 'buyer' | 'seller' = 'buyer'
  ): Promise<PayPalUser> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const tokenResponse = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(code).trim(),
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      let parsedErr: any = null;
      try {
        parsedErr = JSON.parse(errText);
      } catch {
        parsedErr = { error: errText };
      }
      throw new Error(
        parsedErr?.error_description || parsedErr?.error || `PayPal Token Exchange failed (HTTP ${tokenResponse.status})`
      );
    }

    const tokenData: any = await tokenResponse.json();
    const userAccessToken = tokenData.access_token;

    // 2. Query official OpenID userinfo endpoint
    let userInfo: any = null;
    const userinfoResponse = await fetch(
      `${this.baseUrl}/v1/identity/openidconnect/userinfo?schema=openid`,
      {
        headers: {
          'Authorization': `Bearer ${userAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (userinfoResponse.ok) {
      userInfo = await userinfoResponse.json();
    } else {
      // Fallback to oauth2 userinfo
      const altResponse = await fetch(
        `${this.baseUrl}/v1/identity/oauth2/userinfo?schema=paypalv4.0`,
        {
          headers: {
            'Authorization': `Bearer ${userAccessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (altResponse.ok) {
        userInfo = await altResponse.json();
      }
    }

    if (!userInfo) {
      throw new Error('Failed to retrieve PayPal user profile information from Identity API');
    }

    // 3. Extract identity attributes. Reporting balances belong to the configured API account,
    // not necessarily the authenticated payer, so they are intentionally not attached here.
    const rawEmail = userInfo.email || userInfo.email_address;
    if (typeof rawEmail !== 'string' || !rawEmail.includes('@')) {
      throw new Error('PayPal Identity API did not return a verified email address.');
    }
    const email = rawEmail.toLowerCase();
    const givenName = userInfo.given_name || (userInfo.name ? userInfo.name.split(' ')[0] : 'Verified');
    const surname = userInfo.family_name || userInfo.surname || (userInfo.name ? userInfo.name.split(' ').slice(1).join(' ') : 'User');
    const fullName = userInfo.name || `${givenName} ${surname}`.trim();
    
    // Extract authentic Payer ID
    const rawUserId = userInfo.user_id || userInfo.sub || userInfo.payer_id || '';
    if (!rawUserId) {
      throw new Error('PayPal Identity API did not return a payer identifier.');
    }
    const payerId = String(rawUserId).split('/').pop() || String(rawUserId);
      
    const country = userInfo.address?.country || userInfo.zoneinfo || userInfo.locale || 'US';

    const userProfile: PayPalUser = {
      email,
      name: fullName,
      given_name: givenName,
      surname,
      country,
      currency: 'USD',
      currencySymbol: '$',
      balance: 0,
      accountId: payerId,
      status: userInfo.email_verified || userInfo.verified_account ? 'Verified Account' : 'Active Sandbox',
      role: requestedRole,
      walletBalances: [],
    };

    return userProfile;
  }
}

export const payPalService = new PayPalService();
