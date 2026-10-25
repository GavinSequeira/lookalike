import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

const TIPS = [
  'Save your favourite lookalikes and come back to them.',
  'Add your own products to the catalogue manager.',
  'Your password is hashed before it is stored.',
];

// Split layout: photo panel with a rotating tip, form panel on the right.
export default function AuthShell({ kicker, title, subtitle, children, footer }) {
  const [tip, setTip] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTip(t => (t + 1) % TIPS.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="auth">
      <aside className="auth-art" aria-hidden="true">
        <span />
        <div>
          <h2>Love the look.<br /><em>Find it for less.</em></h2>
          <div className="auth-tip" key={tip}><Check size={15} /> {TIPS[tip]}</div>
          <div className="auth-dots">{TIPS.map((_, i) => <i key={i} className={i === tip ? 'on' : ''} />)}</div>
        </div>
      </aside>
      <section className="auth-panel">
        <div className="auth-card">
          <div className="kicker muted">{kicker}</div>
          <h1>{title}</h1>
          <p className="lead">{subtitle}</p>
          {children}
          <p className="auth-footer">{footer}</p>
        </div>
      </section>
    </main>
  );
}
