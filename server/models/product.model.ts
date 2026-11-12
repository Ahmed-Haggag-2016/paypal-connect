/**
 * Marketplace Product Listing Model & Schema
 * Follows Clean Architecture domain model standards
 */

export interface ProductListing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  category: string;
  list_price: number;
  min_acceptable_price: number; // Seller's floor price (protected from buyers)
  currency: string;
  inventory_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// In-Memory Database Model for Production Demo & Testing
export class ProductRepository {
  private products: Map<string, ProductListing> = new Map();

  constructor() {
    this.seedInitialProducts();
  }

  private seedInitialProducts() {
    const seedData: ProductListing[] = [
      {
        id: 'prod-1',
        seller_id: 'seller-apex-01',
        title: 'Studio Monitor Audio Interface Pro',
        description: '24-bit/192kHz USB-C Audio Interface with low-noise mic preamps and balanced outputs.',
        category: 'Pro Audio',
        list_price: 380.0,
        min_acceptable_price: 310.0,
        currency: 'USD',
        inventory_count: 8,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'prod-2',
        seller_id: 'seller-soundcraft-02',
        title: 'Analog Mastering Compressor 500-Series',
        description: 'True stereo VCA bus compressor with high-pass sidechain filter.',
        category: 'Studio Hardware',
        list_price: 750.0,
        min_acceptable_price: 640.0,
        currency: 'USD',
        inventory_count: 3,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'prod-3',
        seller_id: 'seller-vintage-03',
        title: 'Broadcast Dynamic Microphone',
        description: 'Cardioid vocal dynamic mic with integrated pop filter and electromagnetic shielding.',
        category: 'Microphones',
        list_price: 260.0,
        min_acceptable_price: 215.0,
        currency: 'USD',
        inventory_count: 12,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    seedData.forEach((p) => this.products.set(p.id, p));
  }

  public findById(id: string): ProductListing | null {
    return this.products.get(id) || null;
  }

  public listAll(): ProductListing[] {
    return Array.from(this.products.values()).filter((p) => p.is_active);
  }

  public create(product: Omit<ProductListing, 'created_at' | 'updated_at'>): ProductListing {
    const timestamp = new Date().toISOString();
    const newProduct: ProductListing = {
      ...product,
      created_at: timestamp,
      updated_at: timestamp,
    };
    this.products.set(newProduct.id, newProduct);
    return newProduct;
  }

  public updatePrice(id: string, list_price: number, min_acceptable_price: number): ProductListing | null {
    const product = this.products.get(id);
    if (!product) return null;
    product.list_price = list_price;
    product.min_acceptable_price = min_acceptable_price;
    product.updated_at = new Date().toISOString();
    return product;
  }
}

export const productRepository = new ProductRepository();
