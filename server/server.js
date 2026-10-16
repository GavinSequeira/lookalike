import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const PORT = Number(process.env.PORT || 5000);
const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'lookalike';
const client = new MongoClient(URI);
let db;

app.get('/api/health', async (_req, res) => {
  try { if (!db) throw new Error('Database is not connected'); await db.command({ ping: 1 }); res.json({ok:true,database:DB_NAME}); }
  catch (e) { res.status(503).json({ok:false,error:e.message,help:'Start MongoDB, open Compass, then check server/.env'}); }
});

app.get('/api/products', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        error: 'MongoDB is not connected. Start MongoDB Server and check server/.env.'
      });
    }

    const category =
      req.query.category === 'perfumes' ? 'perfumes' : 'shoes';

    const q = String(req.query.q || '').trim();

    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { brand: { $regex: q, $options: 'i' } },
            { slug: { $regex: q, $options: 'i' } },
            { style: { $regex: q, $options: 'i' } }
          ]
        }
      : {};

    const docs = await db.collection(category)
      .find(filter)
      .sort({ brand: 1, name: 1 })
      .toArray();

    const products = docs.map(({ _id, ...p }) => ({
      ...p,
      category,
      price: p.currentPriceINR ?? p.price ?? null,
      currency: p.currency || 'INR',
      buyUrl: p.productUrl || p.buyUrl || '',
      imageUrl: p.imageUrl || '',
      imageSourceUrl: p.imageSourceUrl || '',
      lastChecked: p.priceCheckedAt || p.lastChecked || null,
      verificationStatus:
        p.verificationStatus || p.catalogueStatus || 'needs_verification'
    }));

    res.json(products);
  } catch (error) {
    console.error('Product query failed:', error);
    res.status(500).json({
      error: 'Could not read products from MongoDB',
      details: error.message
    });
  }
});
app.get('/api/products/:category/:slug/alternatives', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'MongoDB is not connected' });
    }

    const collection =
      req.params.category === 'perfumes' ? 'perfumes' : 'shoes';

    const source = await db.collection(collection).findOne({
      slug: req.params.slug
    });

    if (!source) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      product: source,
      alternatives: Array.isArray(source.alternatives)
        ? source.alternatives
        : [],
      evidence: []
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
async function start(){
  try { await client.connect(); db=client.db(DB_NAME); await db.command({ping:1}); console.log(`MongoDB connected: ${DB_NAME}`); }
  catch(e) { console.error('MongoDB connection failed:',e.message); console.error('Start MongoDB Server and check server/.env. API will start but data routes will report database unavailable.'); }
  app.listen(PORT,()=>console.log(`Lookalike API listening at http://localhost:${PORT}`));
}
start();
