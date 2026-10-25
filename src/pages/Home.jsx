import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, ChevronDown, Droplets, Footprints, Search, GitCompareArrows,
  ShoppingBag, ShieldCheck, CalendarCheck, Link2, TrendingDown,
} from 'lucide-react';
import { getProducts } from '../lib/api';
import { bestSaving, getImage, getPrice, money } from '../lib/format';
import { Reveal, CountUp } from '../components/Reveal';
import { FaqList, FAQ_ITEMS } from './Faq';
const BRANDS = ['adidas', 'Reebok', 'Kalenji / Decathlon', 'Dior', 'Lattafa', 'Armaf'];
const SECTIONS = [
  ['top', 'Welcome'], ['how', 'How it works'], ['browse', 'Browse'],
  ['savings', 'Biggest gaps'], ['trust', 'Why trust it'], ['start', 'Start'],
];

function useHomeData() {
  const [state, setState] = useState({ status: 'loading', shoes: [], perfumes: [] });

  useEffect(() => {
    let cancelled = false;
    Promise.all([getProducts('shoes'), getProducts('perfumes')])
      .then(([shoes, perfumes]) => !cancelled && setState({ status: 'ready', shoes, perfumes }))
      .catch(() => !cancelled && setState({ status: 'offline', shoes: [], perfumes: [] }));
    return () => { cancelled = true; };
  }, []);

  return state;
}

function useActiveSection() {
  const [active, setActive] = useState('top');
  useEffect(() => {
    const nodes = SECTIONS.map(([id]) => document.getElementById(id)).filter(Boolean);
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => e.isIntersecting && setActive(e.target.id));
    }, { rootMargin: '-45% 0px -50% 0px' });
    nodes.forEach(n => observer.observe(n));
    return () => observer.disconnect();
  }, []);
  return active;
}

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Home() {
  const navigate = useNavigate();
  const { status, shoes, perfumes } = useHomeData();
  const active = useActiveSection();

  const all = useMemo(() => [...shoes, ...perfumes], [shoes, perfumes]);
  const picks = useMemo(() =>
    all.map(p => ({ product: p, saving: bestSaving(p) }))
      .filter(x => x.saving)
      .sort((a, b) => b.saving.percent - a.saving.percent)
      .slice(0, 3), [all]);
  const altCount = all.reduce((n, p) => n + (p.alternatives?.length || 0), 0);

  return (
    <main className="home">
      <nav className="dots" aria-label="Page sections">
        {SECTIONS.map(([id, label]) => (
          <button key={id} className={active === id ? 'on' : ''} onClick={() => scrollToId(id)} aria-label={label}>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* 1. HERO */}
      <section className="home-hero" id="top">
        <div className="home-copy">
          <div className="kicker"><span className="kicker-dot" /> STYLE, WITHOUT THE MARKUP</div>
          <h1>Love the look.<br /><em>Find it for less.</em></h1>
          <p>Lookalike helps you discover shoes and fragrances inspired by the styles you love — with prices and retailer links together in one place.</p>
          <div className="home-actions">
            <button className="primary-link" onClick={() => navigate('/shoes')}>Explore shoes <ArrowRight size={16} /></button>
            <button className="outline-link" onClick={() => navigate('/perfumes')}>Explore perfumes <ArrowRight size={16} /></button>
          </div>
          <div className="home-note">A smarter way to explore style. Always check the retailer for the latest price and availability.</div>
        </div>

        {picks[0] && (
          <aside className="hero-card" aria-label="Today's biggest price gap">
            <span className="hero-card-tag"><TrendingDown size={13} /> BIGGEST GAP RIGHT NOW</span>
            <strong>{picks[0].product.name}</strong>
            <div className="hero-card-row"><s>{money(getPrice(picks[0].product))}</s><ArrowRight size={13} /><b>{money(getPrice(picks[0].saving.alt))}</b></div>
            <small>{picks[0].saving.alt.name} · save {picks[0].saving.percent}%</small>
          </aside>
        )}

        <button className="scroll-cue" onClick={() => scrollToId('how')} aria-label="Scroll to how it works">
          <span>Scroll</span><ChevronDown size={18} />
        </button>
      </section>

      {/* 2. BRAND MARQUEE */}
      <div className="marquee" aria-label="Brands we track">
        <div className="marquee-track">
          {[...BRANDS, ...BRANDS, ...BRANDS].map((b, i) => <span key={i}>{b}<i>✦</i></span>)}
        </div>
      </div>

      

      {/* 4. BROWSE */}
      <section className="block sand" id="browse">
        <Reveal><div className="kicker muted">BROWSE THE CATALOGUE</div>
          <h2 className="display">Two worlds, <em>one place.</em></h2></Reveal>
        <div className="category-cards">
          {[
            ['shoes', Footprints, 'Shoes', 'Sneakers and everyday runners, with budget-friendly alternatives.', shoes],
            ['perfumes', Droplets, 'Perfumes', 'Designer scents and the affordable lookalikes people compare them to.', perfumes],
          ].map(([key, Icon, title, text, list], i) => (
            <Reveal key={key} delay={i * 140}>
              <button className="category-card" onClick={() => navigate(`/${key}`)}>
                <span className="category-card-icon"><Icon size={20} /></span>
                <span className="category-card-title">{title}</span>
                <span className="category-card-desc">{text}</span>
                <span className="thumb-stack">
                  {list.slice(0, 3).map(p => getImage(p) && <img key={p.slug} src={getImage(p)} alt="" loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }} />)}
                </span>
                <span className="category-card-cta">
                  {status === 'ready' ? `${list.length} products` : 'Browse'} <ArrowRight size={14} />
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 5. BIGGEST GAPS (live data) */}
      <section className="block" id="savings">
        <Reveal><div className="kicker muted">FROM THE CATALOGUE</div>
          <h2 className="display">The biggest <em>price gaps.</em></h2>
          <p className="lead">Pulled live from our database — the products where a lookalike saves you the most.</p></Reveal>

        {status === 'loading' && (
          <div className="pick-grid">{[0, 1, 2].map(i => <div key={i} className="pick skeleton" />)}
            <p className="muted-note">Waking up the catalogue… the first load can take a few seconds.</p></div>
        )}
        {status === 'offline' && (
          <div className="empty-state"><h3>The catalogue is taking a nap</h3>
            <p>We couldn’t reach the server just now.</p>
            <Link className="primary-link" to="/shoes">Try the catalogue</Link></div>
        )}
        {status === 'ready' && picks.length === 0 && (
          <div className="empty-state"><p>No lower-priced alternatives are attached to products yet.</p></div>
        )}
        {picks.length > 0 && (
          <div className="pick-grid">
            {picks.map(({ product, saving }, i) => (
              <Reveal key={product.slug} delay={i * 120}>
                <button className="pick" onClick={() => navigate(`/${product.category}?open=${product.slug}`)}>
                  <span className="pick-badge">Save {saving.percent}%</span>
                  <span className="pick-img">{getImage(product) && <img src={getImage(product)} alt={product.name} loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }} />}</span>
                  <span className="eyebrow">{product.brand}</span>
                  <strong>{product.name}</strong>
                  <span className="pick-prices"><s>{money(getPrice(product), product.currency)}</s> <ArrowRight size={12} /> <b>{money(getPrice(saving.alt), product.currency)}</b></span>
                  <span className="pick-alt">{saving.alt.name} · you keep {money(saving.amount, product.currency)}</span>
                </button>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* 6. TRUST */}
      <section className="block dark" id="trust">
        <Reveal><div className="kicker light">WHY IT’S TRUSTWORTHY</div>
          <h2 className="display light">Honest comparisons, <em>clearly labelled.</em></h2></Reveal>
        <div className="trust-grid">
          {[
            [CalendarCheck, 'Dated prices', 'Every product shows when its price was last checked.'],
            [ShieldCheck, 'Evidence, not hype', 'Alternatives are labelled so you know how strong the match is.'],
            [Link2, 'Straight to the source', 'We link to the retailer — we don’t sell anything ourselves.'],
          ].map(([Icon, title, text], i) => (
            <Reveal key={title} delay={i * 120} className="trust-item"><Icon size={22} /><h3>{title}</h3><p>{text}</p></Reveal>
          ))}
        </div>
        <div className="stat-row">
          <div><strong><CountUp to={all.length} /></strong><span>products tracked</span></div>
          <div><strong><CountUp to={altCount} /></strong><span>lookalikes matched</span></div>
          <div><strong><CountUp to={2} /></strong><span>categories</span></div>
        </div>
      </section>

      {/* 7. FAQ + CTA */}
      <section className="block" id="start">
        <Reveal><div className="kicker muted">QUICK ANSWERS</div>
          <h2 className="display">Good <em>questions.</em></h2></Reveal>
        <div className="faq-wrap"><FaqList items={FAQ_ITEMS.slice(0, 3)} />
          <Link className="text-link" to="/faq">See all questions <ArrowRight size={14} /></Link></div>

        <Reveal className="cta-band">
          <div><h2>Ready to find yours?</h2><p>Browse the catalogue, or tell us what you’d like to see next.</p></div>
          <div className="home-actions">
            <button className="primary-link on-dark" onClick={() => navigate('/shoes')}>Start browsing <ArrowRight size={15} /></button>
            <button className="outline-link on-dark" onClick={() => navigate('/feedback')}>Leave feedback</button>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
