import './styles.css';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, ArrowUpRight, ExternalLink, ShieldCheck,
  Footprints, Droplets, X, ArrowRight, RefreshCw, Home,
  UserRound, MessageSquare, UserPlus
} from 'lucide-react';

const API = 'https://lookalike-api-jici.onrender.com/api';

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

function StoreApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const page = location.pathname === '/' ? 'home' : (['/shoes','/perfumes'].includes(location.pathname) ? 'catalog' : 'other');
  const [category, setCategory] = useState('shoes');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [products, setProducts] = useState([]);
  const [health, setHealth] = useState('checking');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

useEffect(() => {
  let cancelled = false;

  async function loadCurrentUser() {
    try {
      const response = await fetch(`${API}/auth/me`, {
        credentials: 'include'
      });

      if (!response.ok) {
        if (!cancelled) setCurrentUser(null);
        return;
      }

      const data = await response.json();
      const user = data.user || data;

      if (!cancelled) {
        setCurrentUser(user?.name ? user : null);
      }
    } catch {
      if (!cancelled) setCurrentUser(null);
    }
  }

  loadCurrentUser();

  return () => {
    cancelled = true;
  };
}, [location.pathname]);
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
    if (location.pathname === '/perfumes') setCategory('perfumes');
    else if (location.pathname === '/shoes') setCategory('shoes');
  }, [location.pathname]);

  useEffect(() => {
    if (page !== 'catalog') return;
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [category, query, page]);

  function browse(nextCategory) {
    setCategory(nextCategory);
    setQuery('');
    setSelected(null);
    navigate(nextCategory === 'perfumes' ? '/perfumes' : '/shoes');
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
  
  const sortedProducts = [...products].sort((a, b) => {
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    const brandA = (a.brand || '').toLowerCase();
    const brandB = (b.brand || '').toLowerCase();
    const priceA = Number(getPrice(a));
    const priceB = Number(getPrice(b));

    switch (sortBy) {
      case 'name-desc':
        return nameB.localeCompare(nameA);
      case 'price-asc':
        if (getPrice(a) == null) return 1;
        if (getPrice(b) == null) return -1;
        return priceA - priceB;
      case 'price-desc':
        if (getPrice(a) == null) return 1;
        if (getPrice(b) == null) return -1;
        return priceB - priceA;
      case 'brand-asc':
        return brandA.localeCompare(brandB);
      case 'brand-desc':
        return brandB.localeCompare(brandA);
      default:
        return nameA.localeCompare(nameB);
    }
  });

  return (
    <div className="app-shell" id="top">
      <header className="topbar">
        <button className="wordmark wordmark-button" onClick={() => { navigate('/'); setSelected(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          lookalike<span>®</span>
        </button>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" end className={({isActive}) => isActive ? 'nav-active' : ''}><Home size={14}/> Home</NavLink>
          <NavLink to="/shoes" className={({isActive}) => isActive ? 'nav-active' : ''}><Footprints size={15}/> Shoes</NavLink>
          <NavLink to="/perfumes" className={({isActive}) => isActive ? 'nav-active' : ''}><Droplets size={15}/> Perfumes</NavLink>
          <NavLink to="/about" className={({isActive}) => isActive ? 'nav-active' : ''}>About</NavLink>
          <NavLink to="/feedback" className={({isActive}) => isActive ? 'nav-active' : ''}><MessageSquare size={14}/> Feedback</NavLink>
        </nav>
        {currentUser && (
  <div className="welcome-user">
    Hello, {currentUser.name}!
  </div>
)}
       <div className="profile-menu">
  <button
    className="profile-link"
    onClick={() => setProfileOpen(!profileOpen)}
  >
    <UserRound size={17} />
    <span>Profile</span>
  </button>

  {profileOpen && (
    <div className="profile-dropdown">
      <NavLink to="/login">Login</NavLink>
      <NavLink to="/register">Registration</NavLink>
    </div>
  )}
</div>
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
      ) : page === 'other' && location.pathname === '/about' ? <AboutContent navigate={navigate}/> 
      : page === 'other' && location.pathname === '/register' ? <RegisterContent/>
      : page === 'other' && location.pathname === '/login' ? <LoginContent/>
      : page === 'other' && location.pathname === '/feedback' ? <FeedbackContent/>
      : page === 'other' && location.pathname === '/angular-greeting' ? <AngularGreetingContent/>
      : page === 'catalog' ? (
        <main className="catalog-page">
          <div className="catalog-back"><button onClick={() => navigate('/')}><ArrowRight className="back-arrow" size={15}/> Back to home</button><span>LOOKALIKE / {categoryTitle.toUpperCase()}</span></div>
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
              
<div className="catalog-tools">
  <label className="search">
    <Search size={18} />
    <input
      value={query}
      onChange={e => setQuery(e.target.value)}
      placeholder={`Search ${categoryTitle.toLowerCase()} or brand…`}
    />
    {query && (
      <button onClick={() => setQuery('')} aria-label="Clear search">
        <X size={15} />
      </button>
    )}
  </label>

  <label className="sort-control">
    <span>Sort by</span>
    <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
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
            {error && <div className="connection-panel"><div><strong>Could not load products</strong><p>{error}</p><span>Check that MongoDB and the Express API are running.</span></div><button className="secondary" onClick={load}><RefreshCw size={15}/> Retry</button></div>}
            {!error && busy && <div className="empty-state"><RefreshCw className="spin"/><p>Loading products…</p></div>}
            {!error && !busy && products.length === 0 && <div className="empty-state"><h3>No matching products found</h3><p>Check the MongoDB collection or try another search.</p></div>}
            {!error && !busy && products.length > 0 && <div className="product-grid">
              {sortedProducts.map((product, index) => {
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
      )      : null}
      
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



function PageFrame({title, eyebrow, children}) {
  const pageClass = eyebrow.includes('REGISTER')
    ? 'register-page'
    : eyebrow.includes('FEEDBACK')
      ? 'feedback-page'
      : 'extra-page';

  return (
    <main className={pageClass}>
      <div className="kicker muted">{eyebrow}</div>
      <h1>{title}</h1>
      {children}
    </main>
  );
}

function AboutContent() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="about-kicker">ABOUT LOOKALIKE</div>
        <h1>A smarter way to explore style.</h1>
        <p className="about-intro">
          Lookalike helps you compare shoes and fragrances, explore
          lower-priced alternatives, and find retailer listings in one place.
        </p>
      </section>

      <section className="about-card">
        <div className="about-card-top">
          <div className="about-description">
            <h2>About Lookalike</h2>
            <p>
              Lookalike is a product comparison platform designed to make
              fashion and fragrance shopping easier. Browse a curated
              collection of shoes and perfumes, compare prices across
              retailers, and discover stylish alternatives that match your
              taste and budget. Our goal is to help you find the looks you
              love, without the guesswork.
            </p>
          </div>

          <aside className="technology-card">
            <h3>Project technologies</h3>
            <p>React, React Router, CSS, Express, Node.js and MongoDB Atlas.</p>
          </aside>
        </div>

        <div className="about-credits">
          <h3>Project by</h3>
          <p>This project was created as a team effort by:</p>
          <div className="credit-names">
            <span>Manasvi Pawar</span>
            <span>Gavin Sequeira</span>
            <span>Raza Ansari</span>
            <span>Sunil Lewis</span>
          </div>
        </div>
      </section>
    </main>
  );
}


function RegisterContent() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [message, setMessage] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMessage('');

    if (form.password.length < 8) {
      setMessage('Password must contain at least 8 characters.');
      return;
    }

    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(form.password)) {
      setMessage('Password must contain a letter and a number.');
      return;
    }

    if (form.password !== form.confirm) {
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setMessage('Account created successfully! You are now registered.');
      setForm({ name: '', email: '', password: '', confirm: '' });
    } catch (error) {
      setMessage(
        `${error.message} Check that the backend is running on port 5000.`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageFrame title="Create your account" eyebrow="LOOKALIKE / REGISTER">
      <form className="feature-form" onSubmit={submit}>
        <label>
          Full name
          <input
            required
            minLength="2"
            maxLength="100"
            autoComplete="name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
        </label>

        <label>
          Email address
          <input
            required
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        </label>

        <label>
          Password
          <input
            required
            type={show ? 'text' : 'password'}
            minLength="8"
            autoComplete="new-password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
        </label>

        <label>
          Confirm password
          <input
            required
            type={show ? 'text' : 'password'}
            minLength="8"
            autoComplete="new-password"
            value={form.confirm}
            onChange={e => setForm({ ...form, confirm: e.target.value })}
          />
        </label>

        <label className="inline-check">
          <input
            type="checkbox"
            checked={show}
            onChange={e => setShow(e.target.checked)}
          />
          Show passwords
        </label>

        <button className="primary-link" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Register'}
          <ArrowRight size={15} />
        </button>

        {message && <p className="form-message" role="status">{message}</p>}

        <p className="form-hint">
          Your password is securely hashed before being stored.
        </p>
      </form>
    </PageFrame>
  );
}

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setStatus('');
    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Check your email and password.');
      }

      setStatus('Login successful! Redirecting to the home page...');
      setTimeout(() => navigate('/'), 1000);
    } catch (error) {
      setStatus(error.message || 'Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-page">
      <div className="kicker">LOOKALIKE / LOGIN</div>
      <h1>Welcome back.</h1>

      <form className="feature-form" onSubmit={submit}>
        <label>
          Email address
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </label>

        <button
          className="primary-link"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
          <ArrowRight size={15} />
        </button>

        {status && (
          <p className="form-message" role="status">
            {status}
          </p>
        )}

        <p className="form-hint">
          Use the email address and password you chose during registration.
        </p>
      </form>
    </main>
  );
}

function FeedbackContent() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    rating: '5',
    comments: ''
  });

  const [status, setStatus] = useState('');

  async function submit(e) {
    e.preventDefault();
    setStatus('Sending...');

    try {
      const r = await fetch('https://lookalike-flask-feedback.onrender.com/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      const d = await r.json();

      if (!r.ok) {
        throw new Error(d.message || 'Could not save feedback.');
      }

      setStatus('Thank you! Your feedback was saved by Flask.');

      setForm({
        name: '',
        email: '',
        rating: '5',
        comments: ''
      });
    } catch (err) {
      setStatus(`Error: ${err.message}. Check that Flask is running.`);
    }
  }

  return (
    <PageFrame
      title="Tell us what you think"
      eyebrow="LOOKALIKE / FEEDBACK"
    >
      <form className="feature-form" onSubmit={submit}>
        <label>
          Name
          <input
            required
            maxLength="100"
            value={form.name}
            onChange={e =>
              setForm({ ...form, name: e.target.value })
            }
          />
        </label>

        <label>
          Email (optional)
          <input
            type="email"
            maxLength="200"
            value={form.email}
            onChange={e =>
              setForm({ ...form, email: e.target.value })
            }
          />
        </label>

        <label>
          Rating
          <select
            value={form.rating}
            onChange={e =>
              setForm({ ...form, rating: e.target.value })
            }
          >
            <option value="5">5 — Excellent</option>
            <option value="4">4 — Good</option>
            <option value="3">3 — Okay</option>
            <option value="2">2 — Needs work</option>
            <option value="1">1 — Poor</option>
          </select>
        </label>

        <label>
          Comments
          <textarea
            required
            maxLength="2000"
            rows="5"
            value={form.comments}
            onChange={e =>
              setForm({ ...form, comments: e.target.value })
            }
          />
        </label>

        <button className="primary-link" type="submit">
          Submit feedback <ArrowRight size={15} />
        </button>

        {status && (
          <p className="form-message" role="status">
            {status}
          </p>
        )}
      </form>
    </PageFrame>
  );
}

function ProductClassContent() {
 return <PageFrame title="Product inheritance demo" eyebrow="TYPESCRIPT / EXPERIMENT 4"><p>The TypeScript parent class <code>Product</code> provides shared fields. <code>Shoe</code> and <code>Perfume</code> inherit from it.</p><div className="demo-grid">
 <article className="experiment-note"><span className="eyebrow">SHOE</span><h2>Everyday Sneaker</h2><p>Size: UK 8</p></article><article className="experiment-note"><span className="eyebrow">PERFUME</span><h2>Citrus Eau de Parfum</h2><p>Volume: 50 ml</p></article></div><p className="form-hint">Source: <code>typescript/product-inheritance.ts</code>. Run <code>npm run demo:typescript</code> from the project root.</p></PageFrame>;
}
function AngularGreetingContent() {
 return <PageFrame title="Say hello" eyebrow="ANGULARJS / EXPERIMENT 6"><p>Use this separate AngularJS 1.x page to demonstrate <code>ng-controller</code>, <code>ng-model</code> and expressions.</p><div className="experiment-note"><p>Open the interactive demo:</p><a href="/angular-greeting.html" target="_blank" rel="noreferrer" className="primary-link">Open AngularJS greeting <ExternalLink size={14}/></a></div></PageFrame>;
}

function App(){ return <BrowserRouter><StoreApp/></BrowserRouter>; }

createRoot(document.getElementById('root')).render(<App />);
