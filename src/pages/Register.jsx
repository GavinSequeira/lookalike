import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Eye, EyeOff, X } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { register } from '../lib/api';
import { PASSWORD_RULES, passwordStrength, validateField, validateForm } from '../lib/validators';

const EMPTY = { name: '', email: '', password: '', confirm: '', terms: false };

export default function Register() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const formRef = useRef(null);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const [shake, setShake] = useState(0);

  const strength = passwordStrength(values.password);

  // Re-check one field against the HTML5 constraints + our JS rules.
  function check(field, nextValues) {
    const input = formRef.current?.elements[field];
    const text = input ? validateField(field, input, nextValues) : '';
    setErrors(prev => ({ ...prev, [field]: text }));
    if (field === 'password' && touched.confirm) {
      const confirmInput = formRef.current.elements.confirm;
      setErrors(prev => ({ ...prev, confirm: validateField('confirm', confirmInput, nextValues) }));
    }
  }

  function handleChange(e) {
    const { name, type, value, checked } = e.target;
    const next = { ...values, [name]: type === 'checkbox' ? checked : value };
    setValues(next);
    if (touched[name] || type === 'checkbox') check(name, next);
  }

  function handleBlur(e) {
    const { name } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
    check(name, values);
  }

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    const problems = validateForm(formRef.current, values);
    setErrors(problems);
    setTouched({ name: true, email: true, password: true, confirm: true, terms: true });

    const firstBad = Object.keys(problems)[0];
    if (firstBad) {
      formRef.current.elements[firstBad].focus();
      setShake(s => s + 1);
      return;
    }

    setLoading(true);
    try {
      const data = await register(
        values.name.trim(), values.email.trim(), values.password
      );
      
      setUser(data.user);
      setDone(true);
      setTimeout(() => navigate('/'), 2200);
    } catch (error) {
      setMessage(error.message);
      setShake(s => s + 1);
      setLoading(false);
    }
  }

  // Class names drive the CSS: .is-invalid (red) / .is-valid (green).
  const state = f => (!touched[f] ? '' : errors[f] ? 'is-invalid' : 'is-valid');
  const eye = (
    <button type="button" className="eye" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide passwords' : 'Show passwords'}>
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  if (done) {
    return (
      <AuthShell kicker="LOOKALIKE / REGISTER" title={`Welcome, ${values.name.split(' ')[0]}!`} subtitle="Your account is ready." footer="">
        <div className="success-burst"><span><Check size={34} /></span><p>Taking you to the home page…</p></div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      kicker="LOOKALIKE / REGISTER"
      title="Create your account"
      subtitle="It takes less than a minute."
      footer={<>Already registered? <Link to="/login">Log in</Link></>}
    >
      <form key={shake} ref={formRef} className={`feature-form ${shake ? 'shake' : ''}`} onSubmit={submit} noValidate>
        <label className={`field ${state('name')}`}>
          <span>Full name</span>
          <input name="name" required minLength={2} maxLength={100} autoComplete="name"
            pattern="[A-Za-zÀ-ÿ' .\-]{2,100}" title="Letters, spaces, apostrophes and hyphens only"
            value={values.name} onChange={handleChange} onBlur={handleBlur} aria-describedby="err-name" />
          <em id="err-name" className="field-error">{errors.name}</em>
        </label>

        <label className={`field ${state('email')}`}>
          <span>Email address</span>
          <input name="email" type="email" required maxLength={254} autoComplete="email"
            value={values.email} onChange={handleChange} onBlur={handleBlur} aria-describedby="err-email" />
          <em id="err-email" className="field-error">{errors.email}</em>
        </label>

        <label className={`field ${state('password')}`}>
          <span>Password</span>
          <div className="input-wrap">
            <input name="password" type={show ? 'text' : 'password'} required minLength={8} maxLength={72}
              autoComplete="new-password" value={values.password} onChange={handleChange} onBlur={handleBlur} aria-describedby="err-password" />
            {eye}
          </div>
          <em id="err-password" className="field-error">{errors.password}</em>
        </label>

        {values.password && (
          <div className="strength" data-level={strength.score}>
            <div className="strength-bar">{[1, 2, 3, 4, 5].map(n => <i key={n} className={n <= strength.score ? 'on' : ''} />)}</div>
            <b>{strength.label}</b>
            <ul>
              {PASSWORD_RULES.map(rule => {
                const ok = strength.passed.includes(rule.id);
                return <li key={rule.id} className={ok ? 'ok' : ''}>{ok ? <Check size={12} /> : <X size={12} />} {rule.label}</li>;
              })}
            </ul>
          </div>
        )}

        <label className={`field ${state('confirm')}`}>
          <span>Confirm password</span>
          <input name="confirm" type={show ? 'text' : 'password'} required minLength={8} maxLength={72}
            autoComplete="new-password" value={values.confirm} onChange={handleChange} onBlur={handleBlur} aria-describedby="err-confirm" />
          <em id="err-confirm" className="field-error">{errors.confirm}</em>
        </label>

        <label className={`inline-check ${state('terms')}`}>
          <input name="terms" type="checkbox" required checked={values.terms} onChange={handleChange} />
          <span>I understand this is a student project and agree to be registered.</span>
        </label>
        {errors.terms && touched.terms && <em className="field-error show">{errors.terms}</em>}

        <button className="primary-link wide" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'} <ArrowRight size={15} />
        </button>
        {message && <p className="form-message error" role="alert">{message}</p>}
      </form>
    </AuthShell>
  );
}
