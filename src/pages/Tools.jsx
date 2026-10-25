import { useState } from 'react';

const PAGES = {
  budget: ['Budget finder', '/angular-budget.html', 640],
  
};

// Hosts the standalone AngularJS pages (ng-app / ng-controller / ng-model).
export default function Tools({ initial = 'budget' }) {
  const [tab, setTab] = useState(initial);
  const [label, src, height] = PAGES[tab];

  return (
    <main className="page">
      <div className="page-head">
        <div className="kicker muted">LOOKALIKE / ANGULARJS</div>
        <h1>Interactive <em>tools.</em></h1>
        
      </div>
      <div className="tabs">
        {Object.entries(PAGES).map(([key, [name]]) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{name}</button>
        ))}
      </div>
      <iframe key={tab} className="angular-frame" title={label} src={src} style={{ height }} />
      <p className="form-hint"><a href={src} target="_blank" rel="noreferrer">Open “{label}” on its own page</a></p>
    </main>
  );
}
