import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, Droplets, ExternalLink, Footprints, RefreshCw, Search, ShieldCheck, X,
} from 'lucide-react';
import { getAlternatives, getProducts } from '../lib/api';
import { bestSaving, formatDate, getImage, getLink, getPrice, money } from '../lib/format';
import type { Alternative, Category, Product } from '../lib/types';

type SortKey = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'brand-asc' | 'brand-desc';

const hideBroken = (e: { currentTarget: HTMLImageElement }) => { e.currentTarget.style.display = 'none'; };

function sortProducts(list: Product[], sortBy: SortKey): Product[] {
  const text = (v?: string) => (v || '').toLowerCase();
  const byPrice = (a: Product, b: Product, dir: 1 | -1) => {
    const pa = getPrice(a), pb = getPrice(b);
    if (pa == null) return 1;
    if (pb == null) return -1;
    return (pa - pb) * dir;
  };
  return [...list].sort((a, b) => {
    switch (sortBy) {
      case 'name-desc': return text(b.name).localeCompare(text(a.name));
      case 'price-asc': return byPrice(a, b, 1);
      case 'price-desc': return byPrice(a, b, -1);
      case 'brand-asc': return text(a.brand).localeCompare(text(b.brand));
      case 'brand-desc': return text(b.brand).localeCompare(text(a.brand));
      default: return text(a.name).localeCompare(text(b.name));
    }
  });
}

interface Props { category: Category }

export default function Catalog({ category }: Props) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('name-asc');
  const [products, setProducts] = useState<Product[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);

  const title = category === 'shoes' ? 'Shoes' : 'Perfumes';

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const rows = await getProducts(category, query);
      if (!Array.isArray(rows)) throw new Error('Products API did not return a JSON array');
      setProducts(rows);
    } catch (e) {
      setProducts([]);
      setError(e instanceof Error ? e.message : 'Could not connect to the API.');
    } finally {
      setBusy(false);
    }
  }, [category, query]);

  // Reset when switching between /shoes and /perfumes.
  useEffect(() => { setQuery(''); setSelected(null); }, [category]);

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);

  const openProduct = useCallback(async (product: Product) => {
    setSelected(product);
    const fallback = Array.isArray(product.alternatives) ? product.alternatives : [];
    setAlternatives(fallback);
    try {
      const data = await getAlternatives(product.category || category, product.slug);
      if (data.alternatives?.length) setAlternatives(data.alternatives);
    } catch { /* keep the alternatives already attached to the product */ }
  }, [category]);

  // /shoes?open=slug opens that product (used by links on the home page).
  const openSlug = params.get('open');
  useEffect(() => {
    if (!openSlug || products.length === 0) return;
    const match = products.find(p => p.slug === openSlug);
    if (match) {
      openProduct(match);
      setParams({}, { replace: true });
    }
  }, [openSlug, products, openProduct, setParams]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [selected]);

  const sorted = useMemo(() => sortProducts(products, sortBy), [products, sortBy]);
  const sortedAlts = useMemo(
    () => [...alternatives].sort((a, b) => (getPrice(a) ?? Infinity) - (getPrice(b) ?? Infinity)),
    [alternatives]
  );

  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) setSelected(null); };

  return (
    <main className="catalog-page">
      <div className="catalog-back">
        <button onClick={() => navigate('/')}><ArrowRight className="back-arrow" size={15} /> Back to home</button>
        <span>LOOKALIKE / {title.toUpperCase()}</span>
      </div>

      <section className="catalog-section">
        <div className="section-top">
          <div>
            <div className="kicker muted">THE CATALOGUE</div>
            <h2>{category === 'shoes' ? 'Find your next pair.' : 'Find your signature scent.'}</h2>
            <p className="section-sub">Browse products and compare lower-priced alternatives.</p>
          </div>
          <div className="catalog-count">{products.length}<span>matching items</span></div>
        </div>

        <div className="catalog-controls">
          <div className="tabs">
            <button className={category === 'shoes' ? 'active' : ''} onClick={() => navigate('/shoes')}><Footprints size={17} /> Shoes</button>
            <button className={category === 'perfumes' ? 'active' : ''} onClick={() => navigate('/perfumes')}><Droplets size={17} /> Perfumes</button>
          </div>
          <div className="catalog-tools">
            <label className="search">
              <Search size={18} />
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder={`Search ${title.toLowerCase()} or brand…`} aria-label="Search products or brands" />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={15} /></button>}
            </label>
            <label className="sort-control">
              <span>Sort by</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}>
                <option value="name-asc">Name: A–Z</option>
                <option value="name-desc">Name: Z–A</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="brand-asc">Brand: A–Z</option>
                <option value="brand-desc">Brand: Z–A</option>
              </select>
            </label>
          </div>
        </div>

        {error && (
          <div className="connection-panel">
            <div><strong>Could not load products</strong><p>{error}</p><span>Check that MongoDB and the Express API are running.</span></div>
            <button className="secondary" onClick={load}><RefreshCw size={15} /> Retry</button>
          </div>
        )}
        {!error && busy && <div className="empty-state"><RefreshCw className="spin" /><p>Loading products…</p></div>}
        {!error && !busy && products.length === 0 && (
          <div className="empty-state"><h3>No matching products found</h3><p>Try another search{query && <> — or <button className="linklike" onClick={() => setQuery('')}>clear “{query}”</button></>}.</p></div>
        )}

        {!error && !busy && products.length > 0 && (
          <div className="product-grid">
            {sorted.map((product, index) => {
              const saving = bestSaving(product);
              const checked = formatDate(product.lastChecked);
              return (
                <article className="product-card" key={product.slug || index}>
                  <button className="image-button" onClick={() => openProduct(product)} aria-label={`View ${product.name}`}>
                    {getImage(product) && <img src={getImage(product)} alt={`${product.brand} ${product.name}`} loading="lazy"
                      onError={e => { hideBroken(e); e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />}
                    <span className={`no-product-image ${getImage(product) ? 'hidden' : ''}`}>Product image</span>
                  </button>
                  <div className="card-content">
                    <div className="eyebrow">{product.brand} · {category === 'shoes' ? 'Footwear' : 'Fragrance'}</div>
                    <h3>{product.name}</h3>
                    <div className="price-row">
                      <strong>{money(getPrice(product), product.currency)}</strong>
                      <span className="verified"><ShieldCheck size={14} />{checked ? `Checked ${checked}` : 'Check price'}</span>
                    </div>
                    {saving && (
                      <div className="card-best-alt">
                        <span>LOWER-PRICE FIND</span>
                        <strong>{saving.alt.name}</strong>
                        <b>{money(getPrice(saving.alt), saving.alt.currency)}</b>
                      </div>
                    )}
                    <div className="card-actions">
                      <button className="secondary" onClick={() => openProduct(product)}>Compare alternatives <ArrowUpRight size={15} /></button>
                      {getLink(product)
                        ? <a className="buy-link" href={getLink(product)} target="_blank" rel="noreferrer">Buy <ExternalLink size={13} /></a>
                        : <span className="listing-missing">No listing</span>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selected && (
        <div className="modal-backdrop" onMouseDown={onBackdrop}>
          <section className="modal compact-modal" role="dialog" aria-modal="true" aria-label="Product alternatives">
            <button className="close" onClick={() => setSelected(null)} aria-label="Close"><X size={22} /></button>
            <div className="modal-grid">
              <div className="modal-image">
                {getImage(selected)
                  ? <img src={getImage(selected)} alt={`${selected.brand} ${selected.name}`} onError={hideBroken} />
                  : <span className="modal-image-fallback">Product image</span>}
              </div>
              <div className="modal-copy">
                <div className="modal-product-top">
                  <div className="modal-product-title">
                    <div className="eyebrow">{selected.brand} · {selected.category || category}</div>
                    <h2>{selected.name}</h2>
                    <div className="modal-price">{money(getPrice(selected), selected.currency)}</div>
                  </div>
                  {getLink(selected) && <a className="modal-buy" href={getLink(selected)} target="_blank" rel="noreferrer">Buy <ExternalLink size={15} /></a>}
                </div>
                <div className="modal-alt-heading"><span>LOWER-PRICE ALTERNATIVES</span><span>{sortedAlts.length} options</span></div>
                {sortedAlts.length ? (
                  <div className="modal-alternative-grid">
                    {sortedAlts.slice(0, 4).map((a, i) => (
                      <article className="modal-alt-card" key={`${a.slug || a.name}-${i}`}>
                        {getImage(a)
                          ? <img src={getImage(a)} alt={a.name || 'Alternative'} onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />
                          : <div className="alt-image-placeholder">{(a.brand || 'S').slice(0, 1)}</div>}
                        <div className="modal-alt-brand">{a.brand || 'Alternative'}</div>
                        <h3>{a.name || 'Alternative'}</h3>
                        <strong className="modal-alt-price">{money(getPrice(a), a.currency || selected.currency || 'INR')}</strong>
                        <a className="alt-listing" target="_blank" rel="noreferrer"
                          href={getLink(a) || `https://www.google.com/search?q=${encodeURIComponent(`${a.brand || ''} ${a.name || ''} price India`)}`}>
                          View listing <ExternalLink size={12} />
                        </a>
                      </article>
                    ))}
                  </div>
                ) : <div className="no-alternatives">No alternatives are attached to this product yet.</div>}
                <p className="modal-disclaimer">Prices and availability can change. Confirm details with the retailer before buying.</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
