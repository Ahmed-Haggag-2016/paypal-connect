export type Language = 'en' | 'ar';

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

export interface Product {
  id: string;
  name: { en: string; ar?: string };
  category: string;
  seller: {
    id: string;
    name: string;
    rating: number;
    salesCount: number;
    verified: boolean;
    paypalEmail: string;
  };
  listPrice: number;
  minPrice: number; // Floor price seller allows the AI to negotiate down to
  description: { en: string; ar?: string };
  imageEmoji: string;
  inStock: boolean;
  deliveryDays: number;
  features: { en: string[]; ar?: string[] };
}

export interface NegotiationMessage {
  id: string;
  sender: 'buyer' | 'mediator' | 'seller';
  text: string;
  timestamp: string;
  offeredPrice?: number;
  proposalAccepted?: boolean;
}

export interface DealContract {
  dealId: string;
  productId: string;
  productName: string;
  originalPrice: number;
  agreedPrice: number;
  savings: number;
  buyerEmail: string;
  sellerEmail: string;
  status: 'NEGOTIATING' | 'AGREED' | 'PAYMENT_COMPLETED' | 'DELIVERED' | 'PAID_OUT';
  paypalOrderId?: string;
  paypalCaptureId?: string;
  payoutId?: string;
  createdAt: string;
}

export interface SellerTransaction {
  id: string;
  date: string;
  buyer: string;
  product: string;
  amount: number;
  paypalFee: number;
  netAmount: number;
  status: 'COMPLETED' | 'IN_ESCROW' | 'DISBURSED';
  payoutBatchId?: string;
}

export interface DeliveryMilestone {
  id: string;
  dealId: string;
  title: { en: string; ar?: string };
  stage: 'ORDER_PLACED' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'FUNDS_RELEASED';
  expectedDate: string;
  completed: boolean;
  notes: string;
}
