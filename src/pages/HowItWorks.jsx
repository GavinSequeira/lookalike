import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, GitCompareArrows, Search, ShoppingBag } from 'lucide-react';
import { Reveal } from '../components/Reveal';

const STEPS = [
  [Search, 'Search or browse', 'Open Shoes or Perfumes and use the search box or sort menu. Search matches names, brands and styles.'],
  [GitCompareArrows, 'Compare alternatives', 'Open a product to see lower-priced alternatives, ordered from cheapest. Each shows its own price and listing.'],
  [CalendarCheck, 'Check the details', 'Look at the “last checked” date and the evidence label. These tell you how fresh and how strong the match is.'],
  [ShoppingBag, 'Buy from the retailer', 'Use the Buy or View listing links. We never handle payment — you check out on the retailer’s site.'],
];

const LEGEND = [
  ['Lower-price find', 'The cheapest alternative that costs less than the original.'],
  ['Last checked', 'The date we last confirmed the price on the retailer page.'],
  ['Check price', 'Prices move. Treat ours as a guide and confirm on the retailer’s site.'],
  ['Evidence label', 'Shows whether a match is a community opinion, a research lead, or something firmer.'],
];

export default function HowItWorks() {
  return (
    <main className="page">
      <Reveal><div className="kicker muted">LOOKALIKE / HOW IT WORKS</div>
        <h1>From “I love it” to <em>“I found it for less.”</em></h1>
        <p className="lead">A quick tour of how to get the most out of Lookalike.</p></Reveal>

      <ol className="timeline">
        {STEPS.map(([Icon, title, text], i) => (
          <Reveal as="li" key={title} delay={i * 90}>
            <span className="timeline-dot"><Icon size={18} /></span>
            <div><h3>{title}</h3><p>{text}</p></div>
          </Reveal>
        ))}
      </ol>

      <Reveal className="legend">
        <h2>Reading a product card</h2>
        <dl>{LEGEND.map(([t, d]) => <div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}</dl>
      </Reveal>

      <Reveal className="center-row">
        <Link className="primary-link" to="/shoes">Try it with shoes <ArrowRight size={15} /></Link>
        <Link className="outline-link" to="/perfumes">Try it with perfumes</Link>
      </Reveal>
    </main>
  );
}
