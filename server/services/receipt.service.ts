import { GoogleGenAI } from '@google/genai';
import { GEMINI_MODEL } from './gemini-config';
import { payPalService } from './paypal.service';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim().replace(/^["']|["']$/g, '');
  if (!apiKey || apiKey.length < 20 || /your_|my_gemini/i.test(apiKey)) return null;
  return new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
}

export interface ReceiptItem {
  name: string;
  price: number;
  assignedTo?: string;
}

export interface ScanReceiptResult {
  merchantName: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  currency: string;
  summary: string;
}

export async function scanAndParseReceipt(
  receiptBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<ScanReceiptResult> {
  const cleanBase64 = (receiptBase64 || '').replace(/^data:[^;]+;base64,/, '').trim();
  if (cleanBase64.length <= 100 || /\s/.test(cleanBase64) ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    throw new Error('Upload a valid JPEG, PNG, or WebP receipt image.');
  }
  const ai = getGeminiClient();
  if (!ai) throw new Error('Gemini is not configured; receipt OCR is unavailable.');

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      { inlineData: { mimeType, data: cleanBase64 } },
      { text: 'Read this receipt. Return JSON only with merchantName, date, items (array of name and numeric price), subtotal, tax, tip, total, currency, and summary. Do not invent unreadable values; use 0 for unreadable numeric values and explain uncertainty in summary.' },
    ],
    config: { responseMimeType: 'application/json' },
  });
  const parsed = JSON.parse(response.text || '{}');
  if (
    typeof parsed.merchantName !== 'string' ||
    typeof parsed.date !== 'string' ||
    !Array.isArray(parsed.items) ||
    !parsed.items.every((item: any) => typeof item.name === 'string' && Number.isFinite(item.price) && item.price >= 0) ||
    ![parsed.subtotal, parsed.tax, parsed.tip, parsed.total].every(Number.isFinite) ||
    parsed.subtotal < 0 || parsed.tax < 0 || parsed.tip < 0 || parsed.total <= 0 ||
    typeof parsed.currency !== 'string' ||
    typeof parsed.summary !== 'string'
  ) {
    throw new Error('Gemini receipt response did not match the required result schema.');
  }
  return parsed as ScanReceiptResult;
}

export interface MultiPayeeSplitRequest {
  totalAmount: number;
  platformFeePercentage: number;
  sellerEmail: string;
  platformEmail?: string;
  description: string;
}

export interface MultiPayeeSplitResult {
  success: true;
  totalAmount: number;
  platformFee: number;
  sellerNetAmount: number;
  platformEmail: string;
  sellerEmail: string;
  realPayPalAction: false;
  status: 'FEE_CALCULATION_PREVIEW_ONLY';
  timestamp: string;
}

export async function processMultiPayeeSplit(params: MultiPayeeSplitRequest): Promise<MultiPayeeSplitResult> {
  const total = Number(params.totalAmount);
  const feePct = Number(params.platformFeePercentage);
  if (!Number.isFinite(total) || total <= 0 || total > 5000) {
    throw new Error('Total amount must be greater than zero and no more than $5,000.');
  }
  if (!Number.isFinite(feePct) || feePct < 0 || feePct > 30) {
    throw new Error('Platform fee percentage must be between 0 and 30.');
  }
  if (!params.sellerEmail.includes('@')) throw new Error('A valid seller email is required.');

  const platformFee = Number((total * feePct / 100).toFixed(2));
  return {
    success: true,
    totalAmount: total,
    platformFee,
    sellerNetAmount: Number((total - platformFee).toFixed(2)),
    platformEmail: params.platformEmail || '',
    sellerEmail: params.sellerEmail.trim(),
    realPayPalAction: false,
    status: 'FEE_CALCULATION_PREVIEW_ONLY',
    timestamp: new Date().toISOString(),
  };
}

export interface CauseAllocation {
  causeName: string;
  causeEmail: string;
  percentage: number;
  amount: number;
}

export interface SocialImpactDonationRequest {
  donorEmail: string;
  totalDonation: number;
  allocations: Array<{ causeName: string; causeEmail: string; percentage: number }>;
  humanApproved?: boolean;
}

export interface SocialImpactDonationResult {
  success: true;
  donorEmail: string;
  totalDonation: number;
  causeBreakdown: CauseAllocation[];
  paypalBatchId: string;
  status: string;
  timestamp: string;
}

export async function processSocialImpactDonation(
  params: SocialImpactDonationRequest
): Promise<SocialImpactDonationResult> {
  const total = Number(params.totalDonation);
  if (!params.donorEmail.includes('@')) throw new Error('A valid donor email is required.');
  if (!Number.isFinite(total) || total <= 0 || total > 5000) {
    throw new Error('Donation total must be greater than zero and no more than $5,000.');
  }
  if (params.humanApproved !== true) {
    throw new Error('Explicit human approval is required before submitting donation payouts.');
  }
  if (params.allocations.length === 0 || params.allocations.some((item) =>
    !item.causeName.trim() || !item.causeEmail.includes('@') ||
    !Number.isFinite(item.percentage) || item.percentage < 0
  )) {
    throw new Error('Each allocation needs a cause name, valid recipient email, and non-negative percentage.');
  }
  const percentageTotal = params.allocations.reduce((sum, item) => sum + item.percentage, 0);
  if (Math.abs(percentageTotal - 100) > 0.01) {
    throw new Error('Donation allocations must total exactly 100%.');
  }

  const causeBreakdown = params.allocations.map((item) => ({
    ...item,
    amount: Number((total * item.percentage / 100).toFixed(2)),
  }));
  const roundingDifference = Number((total - causeBreakdown.reduce((sum, item) => sum + item.amount, 0)).toFixed(2));
  causeBreakdown[causeBreakdown.length - 1].amount = Number(
    (causeBreakdown[causeBreakdown.length - 1].amount + roundingDifference).toFixed(2)
  );
  const payout = await payPalService.createPayoutBatch(
    causeBreakdown.map((item) => ({
      receiver: item.causeEmail,
      amount: item.amount,
      currency: 'USD',
      note: `Donation to ${item.causeName} from ${params.donorEmail}`,
    })),
    'PayPal Connect social impact donations'
  );

  return {
    success: true,
    donorEmail: params.donorEmail,
    totalDonation: total,
    causeBreakdown,
    paypalBatchId: payout.payoutBatchId,
    status: `PAYOUT_${payout.status}`,
    timestamp: new Date().toISOString(),
  };
}
