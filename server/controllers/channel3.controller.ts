import { Request, Response } from 'express';
import { isChannel3Configured, searchChannel3Products } from '../services/channel3.service';

export function handleChannel3Status(_req: Request, res: Response) {
  return res.json({ configured: isChannel3Configured() });
}

export async function handleChannel3Search(req: Request, res: Response) {
  const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
  const maxUnitPrice = req.body?.maxUnitPrice === undefined ? undefined : Number(req.body.maxUnitPrice);

  if (query.length < 3 || query.length > 500) {
    return res.status(400).json({ success: false, error: 'Search query must be between 3 and 500 characters.' });
  }
  if (maxUnitPrice !== undefined && (!Number.isFinite(maxUnitPrice) || maxUnitPrice <= 0 || maxUnitPrice > 5000)) {
    return res.status(400).json({ success: false, error: 'Maximum unit price must be greater than zero and no more than $5,000.' });
  }

  try {
    const products = await searchChannel3Products(query, maxUnitPrice);
    return res.json({ success: true, source: 'channel3', products });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Channel3 product search failed.';
    console.error('Channel3 product search failed:', message);
    return res.status(isChannel3Configured() ? 502 : 503).json({ success: false, error: message });
  }
}
