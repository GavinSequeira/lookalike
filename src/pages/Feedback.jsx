import { useCallback, useEffect, useState } from 'react';
import { Check, MessageSquareHeart, Send, Star } from 'lucide-react';
import { getFeedbackStats, getRecentFeedback, submitFeedback } from '../lib/api';
import { Reveal } from '../components/Reveal';

const TOPICS = [
  ['general', 'General'], ['catalogue', 'Catalogue'], ['design', 'Design'], ['prices', 'Prices'], ['account', 'Account'],
];
const MOODS = ['', 'Poor', 'Needs work', 'Okay', 'Good', 'Excellent!'];
const EMPTY = { name: '', email: '', topic: 'general', comments: '' };

function Stars({ value, size = 18 }) {
  return (
    <span className="stars-static" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map(n => <Star key={n} size={size} className={n <= value ? 'on' : ''} />)}
    </span>
  );
}

export default function Feedback() {
  const [form, setForm] = useState(EMPTY);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [wall, setWall] = useState({ loading: true, entries: [], stats: null, failed: false });

  const loadWall = useCallback(async () => {
    try {
      const [entries, stats] = await Promise.all([getRecentFeedback(6), getFeedbackStats()]);
      setWall({ loading: false, entries, stats, failed: false });
    } catch {
      setWall(w => ({ ...w, loading: false, failed: true }));
    }
  }, []);

  useEffect(() => { loadWall(); }, [loadWall]);

  async function submit(e) {
    e.preventDefault();
    if (rating === 0) {
      setStatus({ type: 'error', text: 'Please choose a star rating first.' });
      return;
    }
    setSending(true);
    setStatus({ type: '', text: '' });
    try {
      await submitFeedback({ ...form, rating });
      setSent(true);
      setForm(EMPTY);
      setRating(0);
      loadWall();
    } catch (error) {
      setStatus({ type: 'error', text: error.message });
    } finally {
      setSending(false);
    }
  }

  const shown = hover || rating;
  const stats = wall.stats;

  return (
    <main className="page feedback-page">
      <Reveal className="page-head">
        <div className="kicker muted">LOOKALIKE / FEEDBACK</div>
        <h1>Tell us how we’re <em>doing.</em></h1>
        <p className="lead">Your feedback goes to our Flask service and helps decide what we build next.</p>
      </Reveal>

      <div className="feedback-layout">
        <section className="card">
          {sent ? (
            <div className="success-burst">
              <span><Check size={34} /></span>
              <h2>Thank you!</h2>
              <p>Your feedback was saved. It should appear on the wall in a moment.</p>
              <button className="outline-link" onClick={() => { setSent(false); setStatus({ type: '', text: '' }); }}>Send another</button>
            </div>
          ) : (
            <form className="feature-form" onSubmit={submit}>
              <div className="field">
                <span>How would you rate Lookalike?</span>
                <div className="star-picker" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`}
                      className={n <= shown ? 'on' : ''} onMouseEnter={() => setHover(n)} onFocus={() => setHover(n)} onBlur={() => setHover(0)}
                      onClick={() => setRating(n)}>
                      <Star size={30} />
                    </button>
                  ))}
                  <b className="mood">{MOODS[shown]}</b>
                </div>
              </div>

              <div className="field">
                <span>What’s it about?</span>
                <div className="chips">
                  {TOPICS.map(([value, label]) => (
                    <button type="button" key={value} className={form.topic === value ? 'on' : ''}
                      onClick={() => setForm({ ...form, topic: value })}>{label}</button>
                  ))}
                </div>
              </div>

              <div className="two-col">
                <label className="field"><span>Name</span>
                  <input required minLength={2} maxLength={100} autoComplete="name" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} /></label>
                <label className="field"><span>Email <small>(optional)</small></span>
                  <input type="email" maxLength={200} autoComplete="email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} /></label>
              </div>

              <label className="field"><span>Comments</span>
                <textarea required minLength={3} maxLength={2000} rows={5} value={form.comments}
                  placeholder="What did you like? What should we improve?"
                  onChange={e => setForm({ ...form, comments: e.target.value })} />
                <small className="counter">{form.comments.length} / 2000</small></label>

              <button className="primary-link wide" type="submit" disabled={sending}>
                {sending ? 'Sending…' : 'Submit feedback'} <Send size={15} />
              </button>
              {status.text && <p className={`form-message ${status.type}`} role="alert">{status.text}</p>}
            </form>
          )}
        </section>

        <aside className="wall">
          <div className="card rating-summary">
            <h2><MessageSquareHeart size={18} /> What people say</h2>
            {stats && stats.count > 0 ? (
              <div className="summary-body">
                <div className="avg"><strong>{stats.average.toFixed(1)}</strong><Stars value={Math.round(stats.average)} /><small>{stats.count} reviews</small></div>
                <div className="bars">
                  {[5, 4, 3, 2, 1].map(n => (
                    <div key={n}><span>{n}★</span>
                      <i><b style={{ width: `${(stats.distribution[String(n)] / stats.count) * 100}%` }} /></i>
                      <span>{stats.distribution[String(n)]}</span></div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="muted-note">{wall.loading ? 'Loading ratings… the feedback service may be waking up.' : wall.failed ? 'Ratings are unavailable right now.' : 'No ratings yet — be the first!'}</p>
            )}
          </div>

          {wall.entries.map((c, i) => (
            <Reveal key={`${c.submitted_at}-${i}`} className="card comment" delay={i * 60}>
              <div className="comment-top"><span className="avatar sm">{c.name[0]?.toUpperCase()}</span>
                <strong>{c.name}</strong><span className="tag">{c.topic}</span></div>
              <Stars value={c.rating} size={14} />
              <p>{c.comments}</p>
            </Reveal>
          ))}
        </aside>
      </div>
    </main>
  );
}
