# Lookalike — MongoDB Compass version

React + Vite frontend, Express API, and a local MongoDB database. This version is intentionally designed around real image URLs and source records: it does **not** fall back to dummy photos or invent similarity percentages. The storefront hides records that have no product photo URL yet.

## Requirements
- Node.js 20+ (18+ should work)
- MongoDB Community Server running locally
- MongoDB Compass
- VS Code

## Step 1 — Import the database using MongoDB Compass
1. Start **MongoDB Server** on your computer. Open MongoDB Compass and connect to `mongodb://127.0.0.1:27017`.
2. Click **Create Database**. Database name: `lookalike`; collection name: `shoes`.
3. Open `lookalike.shoes` → **Add Data** → **Import JSON or CSV file**. Choose `data/shoes.json`. Select JSON and import.
4. In the same database, create a collection named `perfumes`; import `data/perfumes.json` into it.
5. Create a collection named `alternatives`; import `data/alternatives.json` into it.
6. Confirm Compass shows the `shoes`, `perfumes`, and `alternatives` collections.

**Important:** Import each JSON file into the collection with the matching name. Each file is a JSON array of documents. If you import again later, use an empty collection or remove duplicate records first.

## Step 2 — Configure and run the API
Open a VS Code terminal in the project root:

```powershell
cd server
npm install
Copy-Item .env.example .env
npm run dev
```

The provided `.env.example` uses local Compass-compatible MongoDB:

```env
MONGODB_URI=mongodb://127.0.0.1:27017
DB_NAME=lookalike
PORT=5000
```

Keep this terminal open. Visit `http://localhost:5000/api/health`; it should return `{"ok":true,"database":"lookalike"}`.

## Step 3 — Run the website
Open a **second** terminal at the project root (not inside `server`):

```powershell
npm install
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`.

## What is already wired up
- The React site fetches data from the Express API, not a hardcoded frontend product array.
- The API reads `shoes`, `perfumes`, and `alternatives` from MongoDB.
- Each visible product has its own image URL and retailer product URL.
- Search works against product name, brand, style and fragrance notes.
- Product detail modal includes source links and Reddit evidence, when present.
- Records without a real product photo are hidden. Do not add placeholders to make the grid look full.
- Prices are time-stamped and should be rechecked before presenting as current.

## Current seed data — read before presenting
The seed is a **small, sourced working sample**, not the finished 100+100 research project. It includes three shoe listings and three fragrance listings; the product photo URLs and retailer pages are recorded individually. A Reddit-sourced comparison is stored as a research lead with caveats. Community posts are subjective and do not prove exact similarity, authenticity, or current stock. The app does not show fake percentages.

A product listing being verified means the product page was found; it does not mean its alternative relationship is proven. In particular, `Lattafa Asad` is a community-suggested direction for `Dior Sauvage Elixir`, not an exact clone. `Club de Nuit Intense Man` is a commonly discussed Aventus-style alternative, but no original Aventus comparison is added as a verified pair in this starter.

## MongoDB collections and document shape
- `shoes`: shoe products
- `perfumes`: fragrance products
- `alternatives`: source product slug, alternative slug, Reddit URL, summary, confidence and review status

For a new product, add a record with a unique `slug`, `name`, `brand`, `category`, numeric `price` (or `null` if not confirmed), `currency`, direct `imageUrl`, `imageSourceUrl`, exact `buyUrl`, `verificationStatus`, and `lastChecked`. Use an image from the actual product listing; never reuse one product's image for a different model. Keep image-source and retailer URLs for auditability.

For a researched alternative, add an `alternatives` document with `sourceSlug`, `alternativeSlug`, `evidenceUrl` (Reddit permalink), a fair summary, `confidence`, and `verificationStatus`. Do not claim a percentage unless you build and validate a real scoring method. Don't publish the alternative as an exact match just because one Reddit commenter suggests it.

## API routes
- `GET /api/health`
- `GET /api/products?category=shoes`
- `GET /api/products?category=perfumes&q=lattafa`
- `GET /api/products/:category/:slug/alternatives`

## Troubleshooting
- **Database offline:** make sure MongoDB Server is running, not just Compass, and that `.env` has the URI above.
- **No products:** check that the JSON files were imported into the correct database and collection names.
- **Broken photo:** the app displays an image-unavailable message and keeps the retailer link; replace the URL only with the correct model's actual product photo.
- **Port in use:** change `PORT` in `server/.env` or close the process using port 5000.
