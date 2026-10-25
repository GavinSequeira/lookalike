import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Database, Download, FileText, FolderOpen, Pencil, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  backupProducts, createAdminProduct, deleteAdminProduct, deleteFile, feedbackCsvUrl,
  fileDownloadUrl, listAdminProducts, listFiles, updateAdminProduct,
} from '../lib/api';
import { money, slugify } from '../lib/format';
import type { AdminProduct, AdminProductInput, Category, FileInfo, User } from '../lib/types';

interface FormState {
  name: string; brand: string; category: Category; slug: string;
  price: string; imageUrl: string; productUrl: string; description: string;
}
const EMPTY: FormState = {
  name: '', brand: '', category: 'shoes', slug: '', price: '', imageUrl: '', productUrl: '', description: '',
};

const toInput = (f: FormState): AdminProductInput => ({
  name: f.name.trim(),
  brand: f.brand.trim(),
  category: f.category,
  slug: f.slug.trim() || slugify(`${f.brand} ${f.name}`),
  price: f.price.trim() === '' ? null : Number(f.price),
  currency: 'INR',
  imageUrl: f.imageUrl.trim(),
  productUrl: f.productUrl.trim(),
  description: f.description.trim(),
});

const kb = (n: number) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`);

function Products() {
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [note, setNote] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    try { setItems(await listAdminProducts()); }
    catch (e) { setNote({ type: 'error', text: e instanceof Error ? e.message : 'Could not load products.' }); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (key: keyof FormState) => (e: { target: { value: string } }) =>
    setForm(f => ({ ...f, [key]: e.target.value }) as FormState);

  async function save(e: FormEvent) {
    e.preventDefault();
    setNote(null);
    const input = toInput(form);
    if (input.price !== null && (!Number.isFinite(input.price) || input.price < 0)) {
      setNote({ type: 'error', text: 'Price must be a positive number.' });
      return;
    }
    try {
      if (editing) {
        await updateAdminProduct(editing, input);          // UPDATE
        setNote({ type: 'ok', text: 'Product updated.' });
      } else {
        await createAdminProduct(input);                   // CREATE
        setNote({ type: 'ok', text: 'Product created.' });
      }
      setForm(EMPTY);
      setEditing(null);
      load();                                              // READ
    } catch (err) {
      setNote({ type: 'error', text: err instanceof Error ? err.message : 'Save failed.' });
    }
  }

  function edit(p: AdminProduct) {
    setEditing(p._id);
    setForm({
      name: p.name, brand: p.brand, category: p.category, slug: p.slug,
      price: p.price == null ? '' : String(p.price),
      imageUrl: p.imageUrl, productUrl: p.productUrl, description: p.description,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function remove(p: AdminProduct) {
    if (!window.confirm(`Delete “${p.name}”? This cannot be undone.`)) return;
    try {
      await deleteAdminProduct(p._id);                     // DELETE
      setNote({ type: 'ok', text: `Deleted ${p.name}.` });
      if (editing === p._id) { setEditing(null); setForm(EMPTY); }
      load();
    } catch (err) {
      setNote({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed.' });
    }
  }

  return (
    <>
      <form className="card feature-form" onSubmit={save}>
        <h2>{editing ? 'Edit product' : 'Add a product'}</h2>
        <div className="two-col">
          <label className="field"><span>Name</span><input required maxLength={160} value={form.name} onChange={set('name')} /></label>
          <label className="field"><span>Brand</span><input required maxLength={100} value={form.brand} onChange={set('brand')} /></label>
        </div>
        <div className="two-col">
          <label className="field"><span>Category</span>
            <select value={form.category} onChange={set('category')}><option value="shoes">Shoes</option><option value="perfumes">Perfumes</option></select></label>
          <label className="field"><span>Price (₹)</span><input type="number" min={0} step="1" value={form.price} onChange={set('price')} /></label>
        </div>
        <label className="field"><span>Slug <small>(auto-generated if empty)</small></span>
          <input value={form.slug} placeholder={slugify(`${form.brand} ${form.name}`)} onChange={set('slug')} /></label>
        <div className="two-col">
          <label className="field"><span>Image URL</span><input type="url" value={form.imageUrl} onChange={set('imageUrl')} /></label>
          <label className="field"><span>Product URL</span><input type="url" value={form.productUrl} onChange={set('productUrl')} /></label>
        </div>
        <label className="field"><span>Description</span><textarea rows={3} maxLength={2000} value={form.description} onChange={set('description')} /></label>
        <div className="row-actions">
          <button className="primary-link" type="submit">{editing ? <><Save size={15} /> Save changes</> : <><Plus size={15} /> Add product</>}</button>
          {editing && <button type="button" className="outline-link" onClick={() => { setEditing(null); setForm(EMPTY); }}><X size={15} /> Cancel</button>}
        </div>
        {note && <p className={`form-message ${note.type}`} role="status">{note.text}</p>}
      </form>

      <div className="card">
        <div className="card-head"><h2><Database size={18} /> Products in MongoDB <small>({items.length})</small></h2>
          <button className="secondary" onClick={load}><RefreshCw size={14} /> Refresh</button></div>
        {busy ? <p className="muted-note">Loading…</p> : items.length === 0 ? <p className="muted-note">Nothing here yet. Add your first product above.</p> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Brand</th><th>Category</th><th>Price</th><th /></tr></thead>
              <tbody>
                {items.map(p => (
                  <tr key={p._id}>
                    <td data-label="Name"><strong>{p.name}</strong><small>{p.slug}</small></td>
                    <td data-label="Brand">{p.brand}</td>
                    <td data-label="Category">{p.category}</td>
                    <td data-label="Price">{money(p.price, p.currency)}</td>
                    <td className="actions">
                      <button className="icon-btn" onClick={() => edit(p)} aria-label={`Edit ${p.name}`}><Pencil size={15} /></button>
                      <button className="icon-btn danger" onClick={() => remove(p)} aria-label={`Delete ${p.name}`}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function Files() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [note, setNote] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setFiles(await listFiles()); setNote(null); }
    catch (e) { setNote({ type: 'error', text: e instanceof Error ? e.message : 'Could not list files.' }); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function backup() {
    setBusy(true);
    try {
      const r = await backupProducts();
      setNote({ type: 'ok', text: `Saved ${r.name} (${r.counts.shoes} shoes, ${r.counts.perfumes} perfumes, ${r.counts.adminProducts} demo products).` });
      load();
    } catch (e) { setNote({ type: 'error', text: e instanceof Error ? e.message : 'Backup failed.' }); }
    finally { setBusy(false); }
  }

  async function remove(name: string) {
    if (!window.confirm(`Delete ${name}?`)) return;
    try { await deleteFile(name); load(); }
    catch (e) { setNote({ type: 'error', text: e instanceof Error ? e.message : 'Delete failed.' }); }
  }

  return (
    <div className="card">
      <div className="card-head">
        <h2><FolderOpen size={18} /> Server files <small>(Node.js fs)</small></h2>
        <div className="row-actions">
          <button className="secondary" onClick={backup} disabled={busy}><Save size={14} /> Back up catalogue to JSON</button>
          <a className="secondary" href={feedbackCsvUrl()}><Download size={14} /> Export feedback CSV</a>
        </div>
      </div>
      {note && <p className={`form-message ${note.type}`} role="status">{note.text}</p>}
      {files.length === 0 && !note ? <p className="muted-note">No files yet. Create a backup to get started.</p> : (
        <ul className="file-list">
          {files.map(f => (
            <li key={f.name}>
              <FileText size={16} /><div><strong>{f.name}</strong><small>{kb(f.size)} · {new Date(f.modified).toLocaleString()}</small></div>
              <a className="icon-btn" href={fileDownloadUrl(f.name)} aria-label={`Download ${f.name}`}><Download size={15} /></a>
              <button className="icon-btn danger" onClick={() => remove(f.name)} aria-label={`Delete ${f.name}`}><Trash2 size={15} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Manage() {
  const { user, checking } = useAuth() as { user: User | null; checking: boolean };
  const [tab, setTab] = useState<'products' | 'files'>('products');

  if (checking) return <main className="page narrow"><p className="muted-note">Checking your session…</p></main>;
  if (!user) {
    return (
      <main className="page narrow center">
        <div className="kicker muted">LOOKALIKE / MANAGE</div>
        <h1>Please log in first.</h1>
        <p className="lead">The product manager is for registered users.</p>
        <div className="center-row"><Link className="primary-link" to="/login">Login</Link><Link className="outline-link" to="/register">Register</Link></div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page-head">
        <div className="kicker muted">LOOKALIKE / MANAGE</div>
        <h1>Product <em>manager.</em></h1>
        <p className="lead">Create, read, update and delete products stored in MongoDB Atlas. Your live catalogue is never touched.</p>
      </div>
      <div className="tabs manage-tabs">
        <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}><Database size={16} /> Products</button>
        {user.isAdmin && <button className={tab === 'files' ? 'active' : ''} onClick={() => setTab('files')}><FolderOpen size={16} /> Files</button>}
      </div>
      <div className="stack">{tab === 'products' || !user.isAdmin ? <Products /> : <Files />}</div>
      {!user.isAdmin && <p className="form-hint">File tools (backups and exports) appear for accounts listed in <code>ADMIN_EMAILS</code> on the server.</p>}
    </main>
  );
}
