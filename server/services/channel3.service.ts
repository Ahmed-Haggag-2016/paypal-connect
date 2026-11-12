import { Channel3 } from '@channel3/sdk';

export interface Channel3Offer {
  merchant: string;
  price: number;
  currency: string;
  url: string;
  availability: string;
  maxCommissionRate?: number;
}

export interface Channel3Product {
  id: string;
  title: string;
  description: string;
  brand: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  offers: Channel3Offer[];
}

export function isChannel3Configured(): boolean {
  return Boolean(process.env.CHANNEL3_API_KEY?.trim());
}

export async function searchChannel3Products(query: string, maxUnitPrice?: number): Promise<Channel3Product[]> {
  const apiKey = process.env.CHANNEL3_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Channel3 is not configured. Set CHANNEL3_API_KEY on the server.');
  }

  const client = new Channel3({ apiKey, timeoutInSeconds: 20, maxRetries: 1 });
  const response = await client.products.search({
    query,
    limit: 20,
    filters: {
      availability: ['InStock'],
      ...(maxUnitPrice ? { price: { max_price: maxUnitPrice } } : {}),
    },
    config: { mode: 'agentic', country: 'US', currency: 'USD' },
  });

  return response.data.flatMap((product) => {
    const offers = (product.offers || [])
      .filter((offer) => offer.availability === 'InStock' && Number.isFinite(offer.price?.price) && offer.url)
      .sort((left, right) => left.price.price - right.price.price);
    if (offers.length === 0) return [];

    return [{
      id: product.id,
      title: product.title,
      description: product.description || '',
      brand: product.brands?.map((brand) => brand.name).filter(Boolean).join(', ') || '',
      imageUrl: product.images?.find((image) => image.is_main_image)?.cleaned_url
        || product.images?.find((image) => image.is_main_image)?.url
        || product.images?.[0]?.url,
      rating: product.ratings?.value,
      reviewCount: product.ratings?.count,
      offers: offers.map((offer) => ({
        merchant: offer.domain,
        price: offer.price.price,
        currency: offer.price.currency,
        url: offer.url,
        availability: offer.availability,
        maxCommissionRate: offer.max_commission_rate,
      })),
    }];
  });
}
