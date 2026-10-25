import { useState } from 'react';
import type { FormEvent } from 'react';
import { Perfume, Product, Shoe } from '../lib/productModels';

type Kind = 'shoe' | 'perfume';

export default function ProductsDemo() {
  const [kind, setKind] = useState<Kind>('shoe');
  const [name, setName] = useState('Cloud Runner');
  const [brand, setBrand] = useState('Demo Co');
  const [price, setPrice] = useState(2499);
  const [extra, setExtra] = useState(8);
  const [items, setItems] = useState<Product[]>([
    new Shoe('Everyday Sneaker', 'Demo Co', 2499, 8),
    new Perfume('Citrus Eau de Parfum', 'Demo Co', 1799, 50),
  ]);

  function add(e: FormEvent) {
    e.preventDefault();
    // Polymorphism: both subclasses are stored as Product.
    const item: Product = kind === 'shoe'
      ? new Shoe(name, brand, price, extra)
      : new Perfume(name, brand, price, extra);
    setItems(list => [item, ...list]);
  }

  return (
    <main className="page narrow">
      <div className="kicker muted">LOOKALIKE / TYPESCRIPT</div>
      <h1>Classes &amp; <em>inheritance.</em></h1>
      <p className="lead"><code>Shoe</code> and <code>Perfume</code> extend <code>Product</code> and override <code>describe()</code>. The compiler checks every field type.</p>

      <form className="card feature-form" onSubmit={add}>
        <div className="chips">
          <button type="button" className={kind === 'shoe' ? 'on' : ''} onClick={() => { setKind('shoe'); setExtra(8); }}>Shoe</button>
          <button type="button" className={kind === 'perfume' ? 'on' : ''} onClick={() => { setKind('perfume'); setExtra(50); }}>Perfume</button>
        </div>
        <div className="two-col">
          <label className="field"><span>Name</span><input required value={name} onChange={e => setName(e.target.value)} /></label>
          <label className="field"><span>Brand</span><input required value={brand} onChange={e => setBrand(e.target.value)} /></label>
        </div>
        <div className="two-col">
          <label className="field"><span>Price (₹)</span><input type="number" min={0} required value={price} onChange={e => setPrice(Number(e.target.value))} /></label>
          <label className="field"><span>{kind === 'shoe' ? 'UK size' : 'Volume (ml)'}</span><input type="number" min={1} required value={extra} onChange={e => setExtra(Number(e.target.value))} /></label>
        </div>
        <button className="primary-link" type="submit">Create {kind}</button>
      </form>

      <ul className="file-list">
        {items.map((item, i) => (
          <li key={i}><div><strong>{item.constructor.name}</strong><small>{item.describe()}</small></div></li>
        ))}
      </ul>
    </main>
  );
}
