import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { login } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);

  async function submit(e) {
    e.preventDefault();
    setStatus({ type: '', text: '' });
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      setUser(data.user);
      setStatus({ type: 'ok', text: `Welcome back, ${data.user.name.split(' ')[0]}! Taking you home…` });
      setTimeout(() => navigate('/'), 900);
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Login failed. Check your email and password.' });
      setShake(s => s + 1);
      setLoading(false);
    }
  }

  return (
    <AuthShell
      kicker="LOOKALIKE / LOGIN"
      title="Welcome back."
      subtitle="Log in to manage products and pick up where you left off."
      footer={<>New here? <Link to="/register">Create an account</Link></>}
    >
      <form key={shake} className={`feature-form ${shake ? 'shake' : ''}`} onSubmit={submit}>
        <label className="field">
          <span>Email address</span>
          <input type="email" required autoComplete="email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="field">
          <span>Password</span>
          <div className="input-wrap">
            <input type={show ? 'text' : 'password'} required autoComplete="current-password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} />
            <button type="button" className="eye" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
        <button className="primary-link wide" type="submit" disabled={loading}>
          {loading ? 'Logging in…' : 'Login'} <ArrowRight size={15} />
        </button>
        {status.text && <p className={`form-message ${status.type}`} role="status">{status.text}</p>}
      </form>
    </AuthShell>
  );
}
