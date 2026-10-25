import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUp, Droplets, Footprints, LogOut, Menu, MessageSquare, UserRound, X, Database,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/shoes', label: 'Shoes', icon: Footprints },
  { to: '/perfumes', label: 'Perfumes', icon: Droplets },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/about', label: 'About' },
  { to: '/feedback', label: 'Feedback', icon: MessageSquare },
];

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) { el.scrollIntoView({ behavior: 'smooth' }); return; }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash]);
  return null;
}

function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(false);
  const [solid, setSolid] = useState(false);
  const [progress, setProgress] = useState(0);
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setSolid(y > 40);
      setProgress(max > 0 ? Math.min(100, (y / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); setProfile(false); }, [pathname]);

  useEffect(() => {
    const close = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setProfile(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const overHero = pathname === '/' && !solid;

  async function handleLogout() {
    await logout();
    setProfile(false);
    navigate('/');
  }

  return (
    <header className={`topbar ${overHero ? 'over-hero' : 'solid'}`}>
      <Link to="/" className="wordmark" aria-label="Lookalike home">lookalike<span>®</span></Link>

      <nav className={`main-nav ${open ? 'open' : ''}`} aria-label="Main navigation">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'nav-active' : '')}>
            {Icon && <Icon size={14} />} {label}
          </NavLink>
        ))}
      </nav>

      <div className="topbar-right">
        {user && <span className="welcome-user">Hello, {user.name.split(' ')[0]}!</span>}
        <div className="profile-menu" ref={menuRef}>
          <button className="profile-link" onClick={() => setProfile(p => !p)} aria-expanded={profile}>
            <UserRound size={17} /> <span>{user ? 'Account' : 'Profile'}</span>
          </button>
          {profile && (
            <div className="profile-dropdown">
              {user ? (
                <>
                  <NavLink to="/manage"><Database size={14} /> Manage products</NavLink>
                  <NavLink to="/tools">AngularJS tools</NavLink>
                  <button onClick={handleLogout}><LogOut size={14} /> Log out</button>
                </>
              ) : (
                <>
                  <NavLink to="/login">Login</NavLink>
                  <NavLink to="/register">Registration</NavLink>
                </>
              )}
            </div>
          )}
        </div>
        <button className="menu-toggle" onClick={() => setOpen(o => !o)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      <div className="scroll-progress" style={{ width: `${progress}%` }} />
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <Link to="/" className="wordmark">lookalike<span>®</span></Link>
          <p className="footer-blurb">Love the look. Find it for less. Compare shoes and fragrances with lower-priced alternatives in one place.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/shoes">Shoes</Link>
          <Link to="/perfumes">Perfumes</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/faq">FAQ</Link>
        </div>
        <div>
          <h4>Project</h4>
          <Link to="/about">About</Link>
          <Link to="/feedback">Feedback</Link>
          <Link to="/tools">AngularJS tools</Link>
          <Link to="/products-demo">TypeScript demo</Link>
          <Link to="/manage">Manage products</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>Prices and availability change. Always confirm with the retailer before buying.</p>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top <ArrowUp size={13} /></button>
      </div>
    </footer>
  );
}

export default function Layout() {
  return (
    <div className="app-shell">
      <ScrollManager />
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}
