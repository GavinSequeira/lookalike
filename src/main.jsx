import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Search, ArrowUpRight, ExternalLink, ShieldCheck,
  Footprints, Droplets, X, ArrowRight, RefreshCw, Home
} from 'lucide-react';
import './styles.css';

const API = 'https://lookalike-232w.onrender.com/api';

function money(n, currency = 'INR') {
  if (n == null || !Number.isFinite(Number(n))) return 'Price not verified';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency, maximumFractionDigits: 0
  }).format(Number(n));
}

function getPrice(product) {
  return product?.price ?? product?.currentPriceINR ?? null;
}

function getLink(product) {
  return product?.buyUrl || product?.productUrl || product?.retailerUrl || '';
}

function getImage(product) {
  return product?.imageUrl || '';
}

function App() {
  const [page, setPage] = useState('home');
  const [category, setCategory] = useState('shoes');
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [health, setHealth] = useState('checking');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setBusy(true);
    setError('');
    try {
      const [healthResponse, productsResponse] = await Promise.all([
        fetch(`${API}/health`),
        fetch(`${API}/products?category=${category}&q=${encodeURIComponent(query)}`)
      ]);

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealth(healthData.ok ? 'connected' : 'offline');
      } else {
        setHealth('offline');
      }

      if (!productsResponse.ok) {
        const errorData = await productsResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Products API unavailable');
      }
      const rows = await productsResponse.json();
      if (!Array.isArray(rows)) throw new Error('Products API did not return a JSON array');
      setProducts(rows);
    } catch (e) {
      setHealth('offline');
      setProducts([]);
      setError(e.message || 'Could not connect to the API.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (page !== 'catalog') return;
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [category, query, page]);

  function browse(nextCategory) {
    setCategory(nextCategory);
    setQuery('');
    setSelected(null);
    setPage('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function openProduct(product) {
    setSelected(product);
    setDetail(null);
    try {
      const response = await fetch(`${API}/products/${product.category || category}/${product.slug}/alternatives`);
      if (response.ok) {
        const data = await response.json();
        setDetail({
          ...data,
          alternatives: Array.isArray(data.alternatives) && data.alternatives.length
            ? data.alternatives
            : (Array.isArray(product.alternatives) ? product.alternatives : [])
        });
      } else {
        setDetail({ alternatives: Array.isArray(product.alternatives) ? product.alternatives : [], evidence: [] });
      }
    } catch {
      setDetail({ alternatives: Array.isArray(product.alternatives) ? product.alternatives : [], evidence: [] });
    }
  }

  const categoryTitle = category === 'shoes' ? 'Shoes' : 'Perfumes';
  const alternatives = (detail?.alternatives || selected?.alternatives || [])
    .slice()
    .sort((a, b) => Number(getPrice(a) ?? Infinity) - Number(getPrice(b) ?? Infinity));
  const selectedPrice = getPrice(selected);

  return (
    <div className="app-shell" id="top">
      <header className="topbar">
        <button className="wordmark wordmark-button" onClick={() => { setPage('home'); setSelected(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          lookalike<span>®</span>
        </button>
        <nav className="main-nav" aria-label="Main navigation">
          <button onClick={() => setPage('home')} className={page === 'home' ? 'nav-active' : ''}><Home size={14}/> Home</button>
          <button onClick={() => browse('shoes')} className={page === 'catalog' && category === 'shoes' ? 'nav-active' : ''}><Footprints size={15}/> Shoes</button>
          <button onClick={() => browse('perfumes')} className={page === 'catalog' && category === 'perfumes' ? 'nav-active' : ''}><Droplets size={15}/> Perfumes</button>
        </nav>
        <span className={`db-status ${health}`}><i />{health === 'connected' ? 'MongoDB connected' : health === 'checking' ? 'Database ready when browsing' : 'API offline'}</span>
      </header>

      {page === 'home' ? (
        <main className="home-page">
          <section className="home-hero">
            <div className="home-copy">
              <div className="kicker"><span className="kicker-dot" /> STYLE, WITHOUT THE MARKUP</div>
              <h1>Love the look.<br/><em>Find it for less.</em></h1>
              <p>Lookalike helps you discover shoes and fragrances inspired by the styles you love — with prices and retailer links together in one place.</p>
              <div className="home-actions">
                <button className="primary-link" onClick={() => browse('shoes')}>Explore shoes <ArrowRight size={16}/></button>
                <button className="outline-link" onClick={() => browse('perfumes')}>Explore perfumes <ArrowRight size={16}/></button>
              </div>
              <div className="home-note">A smarter way to explore style. Always check the retailer for the latest price and availability.</div>
            </div>
            <div className="home-art" aria-label="Lookalike brand statement">
              <div className="art-ring ring-a"/><div className="art-ring ring-b"/>
              <div className="art-monogram">L<span>/</span></div>
              <div className="art-label">GOOD FINDS<br/>SMARTER CHOICES</div>
            </div>
          </section>
        </main>
      ) : (
        <main className="catalog-page">
          <div className="catalog-back"><button onClick={() => setPage('home')}><ArrowRight className="back-arrow" size={15}/> Back to home</button><span>LOOKALIKE / {categoryTitle.toUpperCase()}</span></div>
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
                <button className={category === 'shoes' ? 'active' : ''} onClick={() => browse('shoes')}><Footprints size={17}/> Shoes</button>
                <button className={category === 'perfumes' ? 'active' : ''} onClick={() => browse('perfumes')}><Droplets size={17}/> Perfumes</button>
              </div>
              <label className="search"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${categoryTitle.toLowerCase()} or brand…`}/>{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={15}/></button>}</label>
            </div>
            {error && <div className="connection-panel"><div><strong>Could not load products</strong><p>{error}</p><span>Check that MongoDB and the Express API are running.</span></div><button className="secondary" onClick={load}><RefreshCw size={15}/> Retry</button></div>}
            {!error && busy && <div className="empty-state"><RefreshCw className="spin"/><p>Loading products…</p></div>}
            {!error && !busy && products.length === 0 && <div className="empty-state"><h3>No matching products found</h3><p>Check the MongoDB collection or try another search.</p></div>}
            {!error && !busy && products.length > 0 && <div className="product-grid">
              {products.map((product, index) => {
                const productAlternatives = Array.isArray(product.alternatives) ? product.alternatives : [];
                const bestAlternative = productAlternatives.filter(a => getPrice(a) != null && (getPrice(product) == null || Number(getPrice(a)) < Number(getPrice(product)))).sort((a,b) => Number(getPrice(a))-Number(getPrice(b)))[0];
                return <article className="product-card" key={product.slug || product._id || index}>
                  <button className="image-button" onClick={() => openProduct(product)} aria-label={`View ${product.name}`}>
                    {getImage(product) ? <img src={getImage(product)} alt={`${product.brand} ${product.name}`} loading="lazy" onError={e => {e.currentTarget.style.display='none'; e.currentTarget.nextSibling?.classList.remove('hidden');}}/> : null}
                    <span className={`no-product-image ${getImage(product) ? 'hidden' : ''}`}>Product image</span>
                  </button>
                  <div className="card-content">
                    <div className="eyebrow">{product.brand} · {category === 'shoes' ? 'Footwear' : 'Fragrance'}</div>
                    <h3>{product.name}</h3>
                    <div className="price-row"><strong>{money(getPrice(product), product.currency)}</strong><span className="verified"><ShieldCheck size={14}/>{product.priceVerificationStatus === 'listed_on_current_source' ? 'Price on source' : 'Check price'}</span></div>
                    {bestAlternative && <div className="card-best-alt"><span>LOWER-PRICE FIND</span><strong>{bestAlternative.name}</strong><b>{money(getPrice(bestAlternative), bestAlternative.currency)}</b></div>}
                    <div className="card-actions"><button className="secondary" onClick={() => openProduct(product)}>Compare alternatives <ArrowUpRight size={15}/></button>{getLink(product) ? <a className="buy-link" href={getLink(product)} target="_blank" rel="noreferrer">Buy <ExternalLink size={13}/></a> : <span className="listing-missing">No listing</span>}</div>
                  </div>
                </article>;
              })}
            </div>}
          </section>
        </main>
      )}

      {selected && <div className="modal-backdrop" onMouseDown={e => {if (e.target === e.currentTarget) setSelected(null);}}>
        <section className="modal compact-modal" role="dialog" aria-modal="true" aria-label="Product alternatives">
          <button className="close" onClick={() => setSelected(null)} aria-label="Close"><X size={22}/></button>
          <div className="modal-grid">
            <div className="modal-image">
              {getImage(selected) ? <img src={getImage(selected)} alt={`${selected.brand} ${selected.name}`} onError={e => {e.currentTarget.style.display='none';}}/> : <span className="modal-image-fallback">Product image</span>}
            </div>
            <div className="modal-copy">
              <div className="modal-product-top">
                <div className="modal-product-title"><div className="eyebrow">{selected.brand} · {selected.category || category}</div><h2>{selected.name}</h2><div className="modal-price">{money(selectedPrice, selected.currency)}</div></div>
                {getLink(selected) ? <a className="modal-buy" href={getLink(selected)} target="_blank" rel="noreferrer">Buy <ExternalLink size={15}/></a> : null}
              </div>
              <div className="modal-alt-heading"><span>LOWER-PRICE ALTERNATIVES</span><span>{alternatives.length} options</span></div>
              {alternatives.length ? <div className="modal-alternative-grid">
                {alternatives.slice(0,4).map((a, i) => <article className="modal-alt-card" key={a.slug || `${a.name}-${i}`}>
                  {getImage(a) ? <img src={getImage(a)} alt={a.name} onError={e => {e.currentTarget.style.visibility='hidden';}}/> : <div className="alt-image-placeholder">{(a.brand || 'S').slice(0,1)}</div>}
                  <div className="modal-alt-brand">{a.brand || 'Alternative'}</div>
                  <h3>{a.name || 'Alternative shoe'}</h3>
                  <strong className="modal-alt-price">{money(getPrice(a), a.currency || selected.currency || 'INR')}</strong>
                  <a className="alt-listing" href={getLink(a) || `https://www.google.com/search?q=${encodeURIComponent(`${a.brand || ''} ${a.name || ''} price India`)}`} target="_blank" rel="noreferrer">View listing <ExternalLink size={12}/></a>
                </article>)}
              </div> : <div className="no-alternatives">No alternatives are attached to this product yet. Check that the alternatives are stored in its MongoDB document.</div>}
              <p className="modal-disclaimer">Prices and availability can change. Confirm details with the retailer before buying.</p>
            </div>
          </div>
        </section>
      </div>}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
