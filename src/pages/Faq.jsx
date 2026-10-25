import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

export const FAQ_ITEMS = [
  ['What is a “lookalike”?', 'A lower-priced product that gives a similar look or scent profile to one you love. It is inspired by the original — not a copy, and not guaranteed to be identical.'],
  ['Are the alternatives exact clones?', 'No. Each alternative is labelled with how strong the evidence is, from a community opinion to a closer match. Treat them as good starting points, then judge for yourself.'],
  ['How accurate are the prices?', 'Each product shows when its price was last checked. Prices and stock change often, so always confirm with the retailer before you buy.'],
  ['Do you sell the products?', 'No. Lookalike links you to the retailer’s own listing. Checkout happens on their site.'],
  ['Do I need an account?', 'Not to browse or compare. An account unlocks the product manager, where you can add, edit and delete your own demo products.'],
  ['Where does the data live?', 'Products, alternatives and accounts are stored in MongoDB Atlas. Passwords are hashed before they are saved.'],
];

export function FaqList({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="faq">
      {items.map(([q, a], i) => (
        <div key={q} className={`faq-item ${open === i ? 'open' : ''}`}>
          <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
            <span>{q}</span><Plus size={18} />
          </button>
          <div className="faq-answer"><p>{a}</p></div>
        </div>
      ))}
    </div>
  );
}

export default function Faq() {
  return (
    <main className="page narrow">
      <div className="kicker muted">LOOKALIKE / FAQ</div>
      <h1>Frequently asked <em>questions.</em></h1>
      <p className="lead">Short answers to the things people ask most.</p>
      <FaqList items={FAQ_ITEMS} />
      <p className="form-hint">Still curious? <Link to="/feedback">Send us a message</Link>.</p>
    </main>
  );
}
