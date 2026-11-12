/**
 * Multi-Modal Verification Pipeline
 * Uses Gemini 3.8 Flash Vision capabilities to extract Tracking ID and total weight from uploaded shipping manifests,
 * compares them to original transaction order item weights, and outputs strict JSON payload.
 * If is_valid is true, executes/triggers the PayPal Checkout Orders Capture call.
 */

import { GoogleGenAI } from '@google/genai';
import { GEMINI_MODEL } from './gemini-config';
import { payPalService } from './paypal.service';

export interface OrderItemWeight {
  itemId: string;
  itemName: string;
  expectedWeightKg: number;
}

export interface AuditManifestParams {
  orderId: string;
  manifestBase64: string; // Base64 data (without or with data:image/... prefix)
  mimeType?: string;
  expectedItems: OrderItemWeight[];
  allowedWeightTolerancePercentage?: number; // e.g. 15% tolerance
  executeCaptureOnValid?: boolean;
  humanApproved?: boolean;
}

export interface AuditManifestResult {
  is_valid: boolean;
  confidence_score: number; // 0.00 - 1.00
  extractedTrackingId?: string;
  carrier?: string;
  extractedTotalWeightKg?: number;
  expectedTotalWeightKg?: number;
  weightVariancePercentage?: number;
  reasoning: string;
  captureTrigger: {
    executed: boolean;
    orderId: string;
    captureId?: string;
    status: 'CAPTURED_SETTLED' | 'PENDING_MANUAL_REVIEW' | 'INVALID_MANIFEST';
    message: string;
  };
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
 * Multi-Modal Shipping Manifest Audit Engine
 */
export async function auditShippingManifest(
  params: AuditManifestParams
): Promise<AuditManifestResult> {
  const {
    orderId,
    manifestBase64,
    mimeType = 'image/jpeg',
    expectedItems,
    allowedWeightTolerancePercentage = 15,
    executeCaptureOnValid = false,
  } = params;

  if (!orderId || !Array.isArray(expectedItems) || expectedItems.length === 0) {
    throw new Error('An order ID and at least one expected item are required.');
  }
  if (!Number.isFinite(allowedWeightTolerancePercentage) || allowedWeightTolerancePercentage < 0 || allowedWeightTolerancePercentage > 100) {
    throw new Error('Weight tolerance must be between 0 and 100 percent.');
  }
  if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(mimeType)) {
    throw new Error('Unsupported manifest type. Upload a JPEG, PNG, WebP, or PDF file.');
  }

  // Calculate sum of expected item weights
  const expectedTotalWeightKg = expectedItems.reduce(
    (acc, item) => acc + (item.expectedWeightKg || 0),
    0
  );

  const cleanBase64 = manifestBase64.includes(',')
    ? manifestBase64.split(',')[1].trim()
    : manifestBase64.trim();

  const isValidBase64 = cleanBase64.length > 100 && !/\s/.test(cleanBase64);
  if (!isValidBase64) {
    throw new Error('A valid manifest file is required for verification.');
  }

  const ai = getGeminiClient();
  if (!ai) {
    throw new Error('Gemini is not configured; manifest verification is unavailable.');
  }

  let extractedTrackingId = '';
  let carrier = '';
  let extractedWeightKg = 0;
  let confidenceScore = 0;
  let isValid = false;
  let reasoning = '';
  try {
      const prompt = `You are the PayPal Connect Multi-Modal Automated Audit Engine.
Inspect this uploaded shipping manifest / courier receipt image or document.
Perform optical character recognition (OCR) and layout analysis to extract:
1. Tracking ID / Waybill Number
2. Shipping Carrier (e.g., FedEx, UPS, DHL, USPS, Aramex)
3. Total Package Weight in Kilograms (convert lbs to kg if needed: 1 lb = 0.453592 kg).

Compare the extracted weight against the transaction's expected total weight of ${expectedTotalWeightKg} kg.
Allow a maximum variance threshold of ±${allowedWeightTolerancePercentage}%.

Output STRICT JSON matching this schema:
{
  "trackingId": string,
  "carrier": string,
  "totalWeightKg": number,
  "confidenceScore": number (float between 0.00 and 1.00),
  "isValid": boolean (true if tracking ID is visible and package weight is within ±${allowedWeightTolerancePercentage}% of ${expectedTotalWeightKg} kg, false otherwise),
  "reasoning": string
}`;

      const visionResponse = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = (visionResponse.text || '').trim();
      const parsed = JSON.parse(responseText);

      if (
        typeof parsed.trackingId !== 'string' ||
        !parsed.trackingId.trim() ||
        typeof parsed.carrier !== 'string' ||
        !parsed.carrier.trim() ||
        !Number.isFinite(parsed.totalWeightKg) ||
        typeof parsed.isValid !== 'boolean' ||
        !Number.isFinite(parsed.confidenceScore) ||
        parsed.confidenceScore < 0 ||
        parsed.confidenceScore > 1 ||
        typeof parsed.reasoning !== 'string'
      ) {
        throw new Error('Gemini manifest response did not match the required result schema.');
      }
      extractedTrackingId = parsed.trackingId;
      carrier = parsed.carrier;
      extractedWeightKg = parsed.totalWeightKg;
      confidenceScore = parsed.confidenceScore;
      isValid = parsed.isValid;
      reasoning = parsed.reasoning;
  } catch (visionErr) {
    console.error('Gemini Vision manifest audit failed:', visionErr);
    throw visionErr;
  }

  // Weight variance calculation
  const weightVariance = Math.abs(extractedWeightKg - expectedTotalWeightKg);
  const variancePercentage = expectedTotalWeightKg > 0
    ? Number(((weightVariance / expectedTotalWeightKg) * 100).toFixed(1))
    : 0;

  if (variancePercentage > allowedWeightTolerancePercentage) {
    isValid = false;
    reasoning = `Weight discrepancy of ${variancePercentage}% exceeds acceptable threshold of ±${allowedWeightTolerancePercentage}% (Expected ${expectedTotalWeightKg} kg, Found ${extractedWeightKg} kg).`;
  }

  // If is_valid is true, return a trigger to execute the PayPal Checkout Orders Capture call
  let captureExecuted = false;
  let captureId: string | undefined;
  let captureStatus: 'CAPTURED_SETTLED' | 'PENDING_MANUAL_REVIEW' | 'INVALID_MANIFEST' = isValid
    ? 'PENDING_MANUAL_REVIEW'
    : 'INVALID_MANIFEST';
  let captureMessage = isValid
    ? 'Manifest passed AI checks. No payment has been captured; explicit human approval is still required.'
    : 'Manifest failed verification. No payment was captured.';

  if (isValid && executeCaptureOnValid && orderId) {
    if (params.humanApproved !== true) {
      throw new Error('Explicit human approval is required before capturing a PayPal order.');
    }
    const captureResult = await payPalService.captureOrder(orderId);
    if (captureResult.status !== 'COMPLETED' || !captureResult.captureId) {
      throw new Error(`PayPal capture was not confirmed as completed (status: ${captureResult.status}).`);
    }
    captureExecuted = true;
    captureId = captureResult.captureId;
    captureStatus = 'CAPTURED_SETTLED';
    captureMessage = `PayPal confirmed capture ${captureId} as completed.`;
  }

  return {
    is_valid: isValid,
    confidence_score: Number(confidenceScore.toFixed(2)),
    extractedTrackingId,
    carrier,
    extractedTotalWeightKg: extractedWeightKg,
    expectedTotalWeightKg,
    weightVariancePercentage: variancePercentage,
    reasoning,
    captureTrigger: {
      executed: captureExecuted,
      orderId,
      captureId,
      status: captureStatus,
      message: captureMessage,
    },
  };
}
