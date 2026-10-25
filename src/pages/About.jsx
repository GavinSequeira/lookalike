import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Database, FileCode2, FolderOpen, Layers, Route, Sparkles, Flame, Compass, Scale } from 'lucide-react';
import { Reveal, CountUp } from '../components/Reveal';
import { getProducts } from '../lib/api';

const TEAM = ['Manasvi Pawar', 'Gavin Sequeira', 'Raza Ansari', 'Sunil Lewis'];

const VALUES = [
  [Compass, 'Clarity first', 'Prices, dates and links in one place, so you never have to open ten tabs.'],
  [Scale, 'Honest labels', 'A lookalike is not a clone. We say how strong each match is.'],
  [Sparkles, 'Taste over hype', 'Good style should not need a luxury budget.'],
];

const STACK = [
  [Route, 'React + React Router', 'Pages, navigation and the scrolling home page.'],
  [FileCode2, 'TypeScript', 'Typed catalogue, API client and product manager.'],
  [Layers, 'AngularJS', 'ng-controller, ng-model and expressions in the budget tool.'],
  [Flame, 'Flask', 'Feedback service with ratings and a public comment wall.'],
  [FolderOpen, 'Node.js file handling', 'Feedback exports, JSON backups and file tools.'],
  [Database, 'MongoDB Atlas', 'Catalogue, accounts and full CRUD with Mongoose.'],
];

export default function About() {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    let off = false;
    Promise.all([getProducts('shoes'), getProducts('perfumes')]).then(([s, p]) => {
      if (off) return;
      const all = [...s, ...p];
      setCounts({ products: all.length, alts: all.reduce((n, x) => n + (x.alternatives?.length || 0), 0) });
    }).catch(() => {});
    return () => { off = true; };
  }, []);

  return (
    <main className="about">
      <section className="about-hero">
        <div className="orb orb-a" /><div className="orb orb-b" />
        <div className="kicker"><span className="kicker-dot" /> ABOUT LOOKALIKE</div>
        <h1>A smarter way to <em>explore style.</em></h1>
        <p className="lead">Lookalike helps you compare shoes and fragrances, explore lower-priced alternatives, and find retailer listings in one place.</p>
      </section>

      <section className="block narrow-block">
        <Reveal>
          <h2 className="display">Why we built it</h2>
          <p className="story">Shopping for style shouldn’t feel like detective work. We kept finding ourselves loving a sneaker or a scent, then hunting through tabs to find something close that cost less. Lookalike puts that whole search in one calm, honest place — so you can find the looks you love, without the guesswork.</p>
        </Reveal>
      </section>


      <section className="block">
        <Reveal><div className="kicker muted">UNDER THE HOOD</div><h2 className="display">Project <em>technologies.</em></h2></Reveal>
        <div className="stack-grid">
          {STACK.map(([Icon, t, d], i) => (
            <Reveal key={t} delay={(i % 3) * 90} className="stack-item"><Icon size={20} /><h3>{t}</h3><p>{d}</p></Reveal>
          ))}
        </div>
      </section>

      <section className="block sand">
        <Reveal><div className="kicker muted">THE TEAM</div><h2 className="display">Project <em>by.</em></h2>
          <p className="lead">This project was created as a team effort by:</p></Reveal>
        <div className="team">
          {TEAM.map((name, i) => (
            <Reveal key={name} delay={i * 100} className="member">
              <span className="avatar">{name.split(' ').map(w => w[0]).join('')}</span>
              <strong>{name}</strong>
            </Reveal>
          ))}
        </div>
        <Reveal className="center-row">
          <Link className="primary-link" to="/feedback">Tell us what you think <ArrowRight size={15} /></Link>
        </Reveal>
      </section>
    </main>
  );
}
