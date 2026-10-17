# Lookalike practical experiments — implementation bundle

This bundle preserves the existing catalogue API and adds:
- React Router navigation: `/`, `/shoes`, `/perfumes`, `/about`, `/register`, `/feedback`, `/products-demo`, `/angular-greeting`
- Registration form validation (front-end demo only; it does not create accounts)
- TypeScript inheritance demo in `typescript/product-inheritance.ts`
- AngularJS 1.x greeting page at `/angular-greeting.html`
- Express file-based feedback endpoint: `POST /api/feedback` writes JSON Lines to `server/data/feedback.jsonl`
- Mongoose CRUD endpoints under `/api/admin/products` using a separate `adminProducts` collection
- Standalone Flask feedback demo under `flask-feedback/`

## Install and run locally

1. Back up your current project and copy these updated files into it.
2. From the project root: `npm install`
3. From `server/`: `npm install`
4. Create `server/.env` from `server/.env.example`; put your local or Atlas URI in it. Do not commit `.env`.
5. Run backend in one terminal: `cd server && npm start`
6. Run frontend in another terminal: `npm run dev`
7. Run TypeScript demo: from root, `npm run demo:typescript`
8. Run AngularJS demo by visiting `/angular-greeting.html` while Vite is running.
9. Run Flask demo separately: `cd flask-feedback`, create a Python virtual environment, install `pip install -r requirements.txt`, then `python app.py`. Visit `http://127.0.0.1:5050`.

## Important safety and deployment notes

- The registration form is a validation exercise only. It does not store passwords or create accounts.
- Feedback in the Express demo is appended to a file. On ephemeral hosting such as Render, local files may not persist across restarts/deploys; use a persistent disk or a database for durable production feedback.
- Flask runs as a separate service/process and is not automatically deployed with the Render Express backend.
- The Mongoose CRUD API is a demonstration and is intentionally separate from the live `shoes` and `perfumes` collections. It uses the `adminProducts` collection. Do not expose write/delete endpoints publicly without authentication and authorization.
- The Mongoose schema stores demo product records separately; it does not automatically migrate the existing catalogue data.
- Keep MongoDB credentials in environment variables only. Do not commit `.env`.
- Test `npm run build` and the API locally before deploying.
