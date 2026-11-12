import { randomUUID } from 'node:crypto';
import { payPalService } from './paypal.service';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  creatorName: string;
  creatorEmail: string;
  clientName: string;
  clientEmail: string;
  currency: 'USD' | 'EUR' | 'EGP' | 'GBP' | 'JPY';
  currencySymbol: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  status: 'SENT' | 'PAID';
  paypalCheckoutUrl: string;
  paypalOrderId: string;
  paypalCaptureId?: string;
  createdAt: string;
  dueDate: string;
}

const invoices = new Map<string, Invoice>();
const currencySymbols: Record<Invoice['currency'], string> = {
  USD: '$',
  EUR: '€',
  EGP: 'E£',
  GBP: '£',
  JPY: '¥',
};

export function listInvoices(): Invoice[] {
  return Array.from(invoices.values());
}

export function getInvoiceById(id: string): Invoice | undefined {
  return invoices.get(id);
}

export async function createInvoice(data: Partial<Invoice>, appOrigin: string): Promise<Invoice> {
  const currency = data.currency || 'USD';
  if (!Object.hasOwn(currencySymbols, currency)) throw new Error('Unsupported invoice currency.');
  if (!data.creatorEmail?.includes('@') || !data.clientEmail?.includes('@')) {
    throw new Error('Valid creator and client email addresses are required.');
  }
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new Error('At least one invoice line item is required.');
  }
  for (const item of data.items) {
    if (!item.description.trim() || !Number.isFinite(item.quantity) || item.quantity <= 0 ||
        !Number.isFinite(item.unitPrice) || item.unitPrice < 0 ||
        !Number.isFinite(item.total) || item.total !== Number((item.quantity * item.unitPrice).toFixed(2))) {
      throw new Error('Invoice line items must have valid descriptions, quantities, and matching totals.');
    }
  }

  const id = `INV-${randomUUID()}`;
  const items = data.items;
  const subtotal = Number(items.reduce((sum, item) => sum + item.total, 0).toFixed(2));
  const tax = Number((subtotal * 0.05).toFixed(2));
  const totalAmount = Number((subtotal + tax).toFixed(2));
  if (totalAmount <= 0 || totalAmount > 5000) {
    throw new Error('Invoice total must be greater than zero and no more than $5,000.');
  }

  const returnUrl = `${appOrigin}/?invoiceId=${encodeURIComponent(id)}`;
  const order = await payPalService.createOrder(
    totalAmount.toFixed(2),
    currency,
    `PayPal Connect invoice ${id}`,
    'CAPTURE',
    data.creatorEmail,
    returnUrl,
    `${returnUrl}&cancelled=true`
  );
  const checkoutUrl = order.links?.find((link: any) => link.rel === 'approve')?.href;
  if (!checkoutUrl) throw new Error('PayPal created no buyer approval URL for this invoice.');

  const invoice: Invoice = {
    id,
    creatorName: data.creatorName || 'Creator',
    creatorEmail: data.creatorEmail,
    clientName: data.clientName || 'Client',
    clientEmail: data.clientEmail,
    currency,
    currencySymbol: currencySymbols[currency],
    items,
    subtotal,
    tax,
    totalAmount,
    status: 'SENT',
    paypalCheckoutUrl: checkoutUrl,
    paypalOrderId: order.id,
    createdAt: new Date().toISOString(),
    dueDate: data.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  };
  invoices.set(id, invoice);
  return invoice;
}

export async function captureInvoicePayment(id: string, orderId: string): Promise<Invoice> {
  const invoice = getInvoiceById(id);
  if (!invoice) throw new Error(`Invoice ${id} not found.`);
  if (invoice.paypalOrderId !== orderId) throw new Error('PayPal order does not belong to this invoice.');
  if (invoice.status === 'PAID') return invoice;

  const capture = await payPalService.captureOrder(orderId);
  if (capture.status !== 'COMPLETED' || !capture.captureId) {
    throw new Error(`PayPal has not confirmed a completed capture (status: ${capture.status}).`);
  }
  const updated = { ...invoice, status: 'PAID' as const, paypalCaptureId: capture.captureId };
  invoices.set(id, updated);
  return updated;
}
