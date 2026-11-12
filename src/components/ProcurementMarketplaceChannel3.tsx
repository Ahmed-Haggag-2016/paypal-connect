import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Search,
  Sparkles,
  Loader2,
  ExternalLink,
  Package,
  Star,
} from 'lucide-react';

interface ProductOffer {
  merchant: string;
  price: number;
  currency: string;
  url?: string;
  availability: string;
  maxCommissionRate?: number;
}

interface Channel3Product {
  id: string;
  title: string;
  description: string;
  brand: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  offers: ProductOffer[];
}

const SAMPLE_CHANNEL3_PRODUCTS: Channel3Product[] = [
  {
    id: 'SAMPLE-DEV-901',
    title: 'NeuralPulse AI Developer Workstation Pro',
    description: 'Illustrative workstation listing. Product details, price, and availability are sample data.',
    brand: 'Sample Catalog',
    offers: [{ merchant: 'Sample supplier', price: 189, currency: 'USD', availability: 'Sample data' }],
  },
  {
    id: 'SAMPLE-DEV-902',
    title: 'QuantumBook Enterprise M3 Workstation',
    description: 'Illustrative workstation listing. Product details, price, and availability are sample data.',
    brand: 'Sample Catalog',
    offers: [{ merchant: 'Sample supplier', price: 249, currency: 'USD', availability: 'Sample data' }],
  },
  {
    id: 'SAMPLE-DEV-903',
    title: 'ThinkStation Workstation Pro Gen 4',
    description: 'Illustrative workstation listing. Product details, price, and availability are sample data.',
    brand: 'Sample Catalog',
    offers: [{ merchant: 'Sample supplier', price: 210, currency: 'USD', availability: 'Sample data' }],
  },
];

type CatalogMode = 'checking' | 'channel3' | 'sample' | 'error';

const formatPrice = (price: number, currency: string) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency,
}).format(price);

export const ProcurementMarketplaceChannel3: React.FC = () => {
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState<string>(
    'I need 20 high-performance workstations for my dev team, with a total budget of $5,000.'
  );
  const [quantity, setQuantity] = useState<number>(20);
  const [targetBudget, setTargetBudget] = useState<number>(5000);
  const [isSearchingChannel3, setIsSearchingChannel3] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<Channel3Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Channel3Product | null>(null);
  const [selectedOfferUrl, setSelectedOfferUrl] = useState<string>('');
  const [catalogMode, setCatalogMode] = useState<CatalogMode>('checking');
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/channel3/status')
      .then(async (res) => {
        if (!res.ok) throw new Error('Could not check Channel3 configuration.');
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        if (data.configured) {
          setCatalogMode('channel3');
        } else {
          setCatalogMode('sample');
          setSearchResults(SAMPLE_CHANNEL3_PRODUCTS);
          setSelectedProduct(SAMPLE_CHANNEL3_PRODUCTS[0]);
          setSelectedOfferUrl('');
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setCatalogMode('error');
        setSearchError(error instanceof Error ? error.message : 'Could not check Channel3 configuration.');
      });

    return () => {
      active = false;
    };
  }, []);

  const handleRunChannel3Search = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    if (!Number.isInteger(quantity) || quantity < 1 || !Number.isFinite(targetBudget) || targetBudget <= 0) {
      setSearchError('Enter a whole-number quantity and a budget greater than zero.');
      return;
    }
    setIsSearchingChannel3(true);
    try {
      let results: Channel3Product[];
      if (catalogMode === 'channel3') {
        const res = await fetch('/api/channel3/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: naturalLanguageQuery,
            maxUnitPrice: targetBudget / quantity,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Channel3 product search failed.');
        }
        results = data.products;
      } else {
        const terms = naturalLanguageQuery.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 3);
        results = SAMPLE_CHANNEL3_PRODUCTS.filter((product) => {
          const listing = `${product.title} ${product.brand} ${product.description}`.toLowerCase();
          return terms.some((term) => listing.includes(term) || (term.endsWith('s') && listing.includes(term.slice(0, -1))));
        });
      }

      setSearchResults(results);
      setSelectedProduct(results[0] || null);
      setSelectedOfferUrl(results[0]?.offers[0]?.url || '');
    } catch (error) {
      setSearchResults([]);
      setSelectedProduct(null);
      setSelectedOfferUrl('');
      setSearchError(error instanceof Error ? error.message : 'Product search failed.');
    } finally {
      setIsSearchingChannel3(false);
    }
  };

  const selectedOffer = selectedProduct?.offers.find((offer) => offer.url === selectedOfferUrl)
    || selectedProduct?.offers[0];
  const totalCalculatedCost = selectedOffer ? selectedOffer.price * quantity : 0;
  const isWithinBudget = totalCalculatedCost <= targetBudget;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950 border border-blue-800 text-[11px] font-semibold text-blue-300 mb-2">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              <span>{catalogMode === 'channel3' ? 'Channel3 product graph · Live search' : 'Product discovery'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Procurement Marketplace
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed mt-1">
              Search real product listings and compare retailer offers with Channel3. Purchase links take you to the merchant; Channel3 checkout is not yet available.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-blue-950 text-blue-300 border border-blue-800 px-3 py-1.5 rounded-xl font-bold">
              {catalogMode === 'channel3' ? 'Channel3 Live' : catalogMode === 'sample' ? 'Sample Data' : catalogMode === 'checking' ? 'Checking…' : 'Unavailable'}
            </span>
          </div>
        </div>
      </div>

      {/* Natural Language Query Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Natural Language Procurement Request</span>
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {catalogMode === 'channel3' ? 'Channel3 agentic search' : catalogMode === 'sample' ? 'Local sample search' : 'Checking catalog'}
          </span>
        </div>

        <form onSubmit={handleRunChannel3Search} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Describe What Your Business Needs:
            </label>
            <textarea
              rows={3}
              value={naturalLanguageQuery}
              onChange={(e) => setNaturalLanguageQuery(e.target.value)}
              placeholder="e.g. I need 20 laptops for my company, with a total budget of $15,000..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Quantity Required:
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Maximum Budget ($):
              </label>
              <input
                type="number"
                min={1}
                step={0.01}
                value={targetBudget}
                onChange={(e) => setTargetBudget(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSearchingChannel3 || catalogMode === 'checking' || catalogMode === 'error'}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/20"
          >
            {isSearchingChannel3 ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{catalogMode === 'channel3' ? 'Searching Channel3…' : 'Searching sample listings…'}</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>{catalogMode === 'channel3' ? 'Search Channel3 Products' : 'Search Sample Products'}</span>
              </>
            )}
          </button>
        </form>
        {catalogMode === 'sample' && (
          <p role="status" className="text-xs text-amber-300">
            Channel3 API key is not configured. Showing clearly labeled sample data; set CHANNEL3_API_KEY on the server to enable live catalog search.
          </p>
        )}
        {searchError && <p role="alert" className="text-xs text-rose-300">{searchError}</p>}
      </div>

      {/* Comparison & Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Channel3 Products List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {catalogMode === 'channel3' ? 'Channel3 Product Results' : 'Sample Product Results'} ({searchResults.length})
            </h2>
            <span className="text-xs text-slate-400">{catalogMode === 'channel3' ? 'Offers sorted by price' : 'Illustrative local listings'}</span>
          </div>

          <div className="space-y-3">
            {searchResults.map((product) => {
              const isSelected = selectedProduct?.id === product.id;
              return (
                <div
                  key={product.id}
                  onClick={() => {
                    setSelectedProduct(product);
                    setSelectedOfferUrl(product.offers[0]?.url || '');
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-slate-900 border-blue-500 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {product.imageUrl && (
                      <img src={product.imageUrl} alt="" className="w-16 h-16 object-contain rounded-lg bg-white p-1" loading="lazy" />
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-400 font-mono">{product.id}</span>
                        <span className="text-xs text-slate-400">· {product.brand || 'Product'}</span>
                      </div>
                      <h3 className="text-base font-bold text-white">{product.title}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-white font-mono tabular-nums">
                        {formatPrice(product.offers[0].price, product.offers[0].currency)}
                      </div>
                      <span className="text-[11px] text-slate-400">per unit</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                    {product.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                    <div className="flex items-center gap-3">
                      {product.rating !== undefined && (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-emerald-400" />
                        {product.rating.toFixed(1)} ({product.reviewCount ?? 0})
                      </span>
                      )}
                      <span className="text-slate-400">{product.offers.length} retailer offer{product.offers.length === 1 ? '' : 's'}</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-300">{product.offers[0].availability}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Product Procurement Workflow Box */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5 sticky top-24">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span>Retailer Offer Comparison</span>
            </span>
            <span className="text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">
              {catalogMode === 'channel3' ? 'Channel3 Data' : 'Sample Data'}
            </span>
          </div>

          {selectedProduct ? <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 block font-semibold">Selected Product:</span>
              <div className="text-sm font-bold text-white">{selectedProduct.title}</div>
              <div className="text-xs text-slate-400">Brand: {selectedProduct.brand || 'Not specified'}</div>
            </div>

            {selectedProduct.offers.length > 1 && (
              <div className="space-y-2">
                <span className="text-xs text-slate-400 font-semibold">Available retailer offers:</span>
                {selectedProduct.offers.map((offer) => (
                  <label key={offer.url || `${offer.merchant}-${offer.price}`} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="channel3-offer"
                        checked={selectedOffer?.url === offer.url}
                        onChange={() => setSelectedOfferUrl(offer.url || '')}
                      />
                      <span className="text-slate-200">{offer.merchant}</span>
                    </span>
                    <span className="font-mono text-white">{formatPrice(offer.price, offer.currency)}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Unit Price:</span>
                <span className="text-white">{selectedOffer ? formatPrice(selectedOffer.price, selectedOffer.currency) : '—'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Quantity:</span>
                <span className="text-white">x {quantity}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Shipping & Insurance:</span>
                <span className="text-slate-400">Not provided by API</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-sm">
                <span className="text-slate-200">Total Calculated Cost:</span>
                <span className={isWithinBudget ? 'text-emerald-400' : 'text-rose-400'}>
                  {selectedOffer ? formatPrice(totalCalculatedCost, selectedOffer.currency) : '—'}
                </span>
              </div>
            </div>

            <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
              isWithinBudget
                ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
                : 'bg-rose-950/40 border-rose-900/60 text-rose-300'
            }`}>
              {isWithinBudget ? (
                <span>✓ Estimated item total ({selectedOffer ? formatPrice(totalCalculatedCost, selectedOffer.currency) : '—'}) is within the target budget (${targetBudget.toFixed(2)}). Shipping and taxes may apply at the retailer.</span>
              ) : (
                <span>⚠️ Item total exceeds target budget by ${(totalCalculatedCost - targetBudget).toFixed(2)}. Reduce quantity or increase the budget.</span>
              )}
            </div>

            <div className="pt-2 space-y-3">
              {selectedOffer?.url ? (
                <a
                  href={selectedOffer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Continue to {selectedOffer.merchant}</span>
                </a>
              ) : (
                <p className="text-xs text-slate-400">Sample entries do not have live retailer links. Channel3 does not currently provide checkout through this app.</p>
              )}
              {selectedOffer?.maxCommissionRate !== undefined && selectedOffer.maxCommissionRate > 0 && (
                <p className="text-[11px] text-slate-500">
                  Channel3 reports a maximum commission rate of {(selectedOffer.maxCommissionRate * 100).toFixed(1)}%; actual commissions may vary.
                </p>
              )}
            </div>
          </div> : <p className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400">
            {catalogMode === 'channel3' ? 'No matching Channel3 listings were found within the unit-price limit. Adjust your query or budget and search again.' : 'No sample listings matched that search. Adjust the query to continue.'}
          </p>}
        </div>
      </div>
    </div>
  );
};
