import './styles.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import About from './pages/About';
import HowItWorks from './pages/HowItWorks';
import Faq from './pages/Faq';
import Login from './pages/Login';
import Register from './pages/Register';
import Feedback from './pages/Feedback';
import Manage from './pages/Manage';
import Tools from './pages/Tools';
import ProductsDemo from './pages/ProductsDemo';

function NotFound() {
  return (
    <main className="page narrow center">
      <div className="kicker muted">404</div>
      <h1>We couldn’t find that page.</h1>
      <p className="lead">The link may be old, or the page may have moved.</p>
      <Link className="primary-link" to="/">Back to home</Link>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="shoes" element={<Catalog category="shoes" />} />
            <Route path="perfumes" element={<Catalog category="perfumes" />} />
            <Route path="how-it-works" element={<HowItWorks />} />
            <Route path="faq" element={<Faq />} />
            <Route path="about" element={<About />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="manage" element={<Manage />} />
            <Route path="tools" element={<Tools />} />
            <Route path="products-demo" element={<ProductsDemo />} />
            <Route path="angular-greeting" element={<Tools initial="greeting" />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<App />);
