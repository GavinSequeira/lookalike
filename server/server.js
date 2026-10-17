
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import User from './models/User.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);
const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'lookalike';
const isProduction = process.env.NODE_ENV === 'production';

if (!URI) {
  throw new Error('MONGODB_URI is missing from server/.env');
}

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is missing from server/.env');
}

const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.set('trust proxy', 1);

app.use(cors({
  origin(origin, callback) {
    // Allow local development addresses and explicitly configured origins.
    const isLocal =
      origin === 'http://localhost:5173' ||
      origin === 'http://127.0.0.1:5173';

    if (!origin || isLocal || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error('Blocked CORS origin:', origin);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '20kb' }));

app.use(session({
  name: 'lookalike.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: URI,
    dbName: DB_NAME,
    collectionName: 'sessions',
    ttl: 60 * 60 * 24 * 7,
  }),
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));

const client = new MongoClient(URI);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const feedbackFile = path.join(dataDir, 'feedback.jsonl');
let db;

const productSchema = new mongoose.Schema({
  slug: { type: String, required: true, trim: true, maxlength: 160, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  brand: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, required: true, enum: ['shoes', 'perfumes'] },
  price: { type: Number, min: 0, default: null },
  currency: { type: String, default: 'INR', maxlength: 3 },
  imageUrl: { type: String, default: '', maxlength: 2000 },
  productUrl: { type: String, default: '', maxlength: 2000 },
  description: { type: String, default: '', maxlength: 2000 },
}, { timestamps: true, collection: 'adminProducts' });

productSchema.index({ category: 1, slug: 1 }, { unique: true });

const AdminProduct = mongoose.models.AdminProduct ||
  mongoose.model('AdminProduct', productSchema);

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Please log in first.' });
  }
  next();
}

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    if (!db) throw new Error('Database is not connected');
    await db.command({ ping: 1 });
    res.json({ ok: true, database: DB_NAME });
  } catch (error) {
    res.status(503).json({
      ok: false,
      error: error.message,
      help: 'Check MONGODB_URI and database access.',
    });
  }
});

// Register: passwords are stored as bcrypt hashes by the User model.
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        error: 'Name, email and password are required.',
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({ error: 'Name must be 2–100 characters.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }

    // bcrypt only uses up to 72 bytes; reject longer UTF-8 passwords.
    if (
      password.length < 8 ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters and at most 72 bytes.',
      });
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({
        error: 'An account with this email already exists.',
      });
    }

    const user = new User({ name: cleanName, email: cleanEmail });
    await user.setPassword(password);
    await user.save();

    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => error ? reject(error) : resolve());
    });

    req.session.userId = user._id.toString();

    await new Promise((resolve, reject) => {
      req.session.save((error) => error ? reject(error) : resolve());
    });

    res.status(201).json({
      message: 'Account created successfully.',
      user: publicUser(user),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        error: 'An account with this email already exists.',
      });
    }
    console.error('Registration failed:', error.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select('+passwordHash');

    if (!user || !(await user.verifyPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => error ? reject(error) : resolve());
    });

    req.session.userId = user._id.toString();

    await new Promise((resolve, reject) => {
      req.session.save((error) => error ? reject(error) : resolve());
    });

    res.json({ message: 'Login successful.', user: publicUser(user) });
  } catch (error) {
    console.error('Login failed:', error.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Current logged-in user
app.get('/api/auth/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not logged in.' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return req.session.destroy(() =>
        res.status(401).json({ error: 'Account not found.' })
      );
    }

    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Session check failed:', error.message);
    res.status(500).json({ error: 'Could not check login status.' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ error: 'Could not log out.' });
    }

    res.clearCookie('lookalike.sid', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });

    res.json({ message: 'Logged out successfully.' });
  });
});

// Catalogue API: existing shoes and perfumes collections remain unchanged.
app.get('/api/products', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'MongoDB is not connected.' });

    const category = req.query.category === 'perfumes' ? 'perfumes' : 'shoes';
    const q = String(req.query.q || '').trim().slice(0, 100);
    const filter = q ? {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { slug: { $regex: q, $options: 'i' } },
        { style: { $regex: q, $options: 'i' } },
      ],
    } : {};

    const docs = await db.collection(category)
      .find(filter)
      .sort({ brand: 1, name: 1 })
      .toArray();

    res.json(docs.map(({ _id, ...p }) => ({
      ...p,
      category,
      price: p.currentPriceINR ?? p.price ?? null,
      currency: p.currency || 'INR',
      buyUrl: p.productUrl || p.buyUrl || '',
      imageUrl: p.imageUrl || '',
      imageSourceUrl: p.imageSourceUrl || '',
      lastChecked: p.priceCheckedAt || p.lastChecked || null,
      verificationStatus: p.verificationStatus || p.catalogueStatus || 'needs_verification',
    })));
  } catch (error) {
    console.error('Product query failed:', error);
    res.status(500).json({ error: 'Could not read products from MongoDB' });
  }
});

app.get('/api/products/:category/:slug/alternatives', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'MongoDB is not connected' });

    const collection = req.params.category === 'perfumes' ? 'perfumes' : 'shoes';
    const source = await db.collection(collection).findOne({ slug: req.params.slug });

    if (!source) return res.status(404).json({ error: 'Product not found' });

    res.json({
      product: source,
      alternatives: Array.isArray(source.alternatives) ? source.alternatives : [],
      evidence: [],
    });
  } catch {
    res.status(500).json({ error: 'Could not load alternatives' });
  }
});

// Experiment 7: file-based feedback
app.post('/api/feedback', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim().slice(0, 100);
    const email = String(req.body?.email || '').trim().slice(0, 200);
    const comments = String(req.body?.comments || '').trim().slice(0, 2000);
    const rating = Number(req.body?.rating);

    if (name.length < 2 || !comments ||
        !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Name, comments and a rating from 1 to 5 are required.',
      });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    await mkdir(dataDir, { recursive: true });
    await appendFile(
      feedbackFile,
      JSON.stringify({
        id: randomUUID(),
        name,
        email,
        rating,
        comments,
        createdAt: new Date().toISOString(),
      }) + '\n',
      { encoding: 'utf8', mode: 0o600 }
    );

    res.status(201).json({ ok: true });
  } catch (error) {
    console.error('Feedback file write failed:', error.message);
    res.status(500).json({ error: 'Could not save feedback on this server.' });
  }
});

// Experiment 9: adminProducts demo. Read stays public; writes require a login.
// For real production, restrict writes to designated admin accounts, not every user.
app.get('/api/admin/products', async (_req, res) => {
  try {
    res.json(await AdminProduct.find().sort({ category: 1, name: 1 }).lean());
  } catch {
    res.status(500).json({ error: 'Could not read admin products' });
  }
});

app.post('/api/admin/products', requireLogin, async (req, res) => {
  try {
    const doc = await AdminProduct.create({
      slug: String(req.body?.slug || '').trim(),
      name: req.body?.name,
      brand: req.body?.brand,
      category: req.body?.category,
      price: req.body?.price === '' ? null : req.body?.price,
      currency: req.body?.currency || 'INR',
      imageUrl: req.body?.imageUrl || '',
      productUrl: req.body?.productUrl || '',
      description: req.body?.description || '',
    });
    res.status(201).json(doc);
  } catch (error) {
    res.status(400).json({ error: 'Product validation failed', details: error.message });
  }
});

app.put('/api/admin/products/:id', requireLogin, async (req, res) => {
  try {
    const doc = await AdminProduct.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true, strict: true }
    );
    if (!doc) return res.status(404).json({ error: 'Product not found' });
    res.json(doc);
  } catch (error) {
    res.status(400).json({ error: 'Product update failed', details: error.message });
  }
});

app.delete('/api/admin/products/:id', requireLogin, async (req, res) => {
  try {
    const doc = await AdminProduct.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Product not found' });
    res.json({ ok: true, deletedId: doc._id });
  } catch {
    res.status(400).json({ error: 'Invalid product id' });
  }
});

async function start() {
  try {
    await client.connect();
    db = client.db(DB_NAME);
    await db.command({ ping: 1 });
    console.log(`MongoDB connected: ${DB_NAME}`);

    await mongoose.connect(URI, { dbName: DB_NAME });
    console.log('Mongoose connected');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }

  app.listen(PORT, () => console.log(`Lookalike API listening on port ${PORT}`));
}

start();
