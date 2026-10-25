"""Lookalike feedback service (Flask).

POST /feedback         save feedback (JSON from React, or a normal HTML form)
GET  /feedback/recent  latest public comments (no emails)
GET  /feedback/stats   count, average and 1-5 star distribution
GET  /health           simple status check
GET  /                 small stand-alone feedback form

Storage: feedback.jsonl by default. If MONGODB_URI is set (and pymongo is
installed) feedback goes to a `feedback` collection instead, which survives
Render restarts. Existing Atlas collections are never touched.
"""
import json
import os
import re
import threading
import time
from collections import defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, render_template, request
from flask_cors import CORS

app = Flask(__name__)

ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "https://lookalike-frontend.onrender.com",
] + [o.strip() for o in os.environ.get("FRONTEND_URL", "").split(",") if o.strip()]
CORS(app, origins=ORIGINS)

DATA_FILE = Path(__file__).parent / "feedback.jsonl"
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
TOPICS = {"general", "catalogue", "design", "prices", "account"}


# ---------------------------------------------------------------- storage
class FileStore:
    def __init__(self, path):
        self.path = path
        self.lock = threading.Lock()

    def add(self, entry):
        with self.lock, self.path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")

    def all(self):
        if not self.path.exists():
            return []
        rows = []
        for line in self.path.read_text(encoding="utf-8").splitlines():
            try:
                rows.append(json.loads(line))
            except ValueError:
                continue
        return rows


class MongoStore:
    def __init__(self, uri, db_name):
        from pymongo import MongoClient
        self.col = MongoClient(uri, serverSelectionTimeoutMS=5000)[db_name]["feedback"]

    def add(self, entry):
        self.col.insert_one(dict(entry))

    def all(self):
        return list(self.col.find({}, {"_id": 0}).sort("submitted_at", -1).limit(500))[::-1]


def make_store():
    uri = os.environ.get("MONGODB_URI")
    if uri:
        try:
            store = MongoStore(uri, os.environ.get("DB_NAME", "lookalike"))
            store.col.database.command("ping")
            print("Feedback storage: MongoDB")
            return store
        except Exception as exc:  # noqa: BLE001
            print("MongoDB unavailable, using file storage:", exc)
    print("Feedback storage: feedback.jsonl")
    return FileStore(DATA_FILE)


store = make_store()


# ------------------------------------------------------------ rate limit
hits = defaultdict(deque)


def too_many():
    ip = (request.headers.get("X-Forwarded-For", request.remote_addr) or "?").split(",")[0].strip()
    now, window = time.time(), hits[ip]
    while window and now - window[0] > 60:
        window.popleft()
    if len(window) >= 5:
        return True
    window.append(now)
    return False


# ------------------------------------------------------------ validation
def parse(data):
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip()
    comments = str(data.get("comments", "")).strip()
    topic = str(data.get("topic", "general")).strip().lower()
    try:
        rating = int(str(data.get("rating", "")).strip())
    except ValueError:
        rating = 0

    if len(name) < 2 or len(name) > 100:
        return None, "Please enter your name (2-100 characters)."
    if email and (len(email) > 200 or not EMAIL_RE.match(email)):
        return None, "That email address doesn't look right."
    if not 1 <= rating <= 5:
        return None, "Please choose a rating from 1 to 5 stars."
    if len(comments) < 3 or len(comments) > 2000:
        return None, "Please tell us a little more (up to 2000 characters)."
    if topic not in TOPICS:
        topic = "general"

    return {
        "name": name, "email": email, "rating": rating, "topic": topic,
        "comments": comments,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }, None


# ---------------------------------------------------------------- routes
@app.get("/")
def home():
    return render_template("feedback.html", message=None, ok=False)


@app.get("/health")
def health():
    return jsonify(ok=True)


@app.post("/feedback")
def save_feedback():
    wants_json = request.is_json
    data = request.get_json(silent=True) if wants_json else request.form
    entry, error = parse(data or {})

    if not error and too_many():
        error = "You're sending feedback very quickly. Please wait a minute."
    if error:
        if wants_json:
            return jsonify(message=error), 400
        return render_template("feedback.html", message=error, ok=False), 400

    store.add(entry)
    if wants_json:
        return jsonify(message="Feedback saved successfully!"), 201
    return render_template("feedback.html", message="Thank you! Feedback saved.", ok=True), 201


@app.get("/feedback/recent")
def recent():
    try:
        limit = max(1, min(int(request.args.get("limit", 6)), 20))
    except ValueError:
        limit = 6
    out = []
    for row in reversed(store.all()):
        try:
            rating = int(row.get("rating"))
        except (TypeError, ValueError):
            continue
        out.append({
            "name": str(row.get("name", "Someone")).split()[0][:30],
            "rating": rating,
            "comments": str(row.get("comments", ""))[:400],
            "topic": row.get("topic", "general"),
            "submitted_at": row.get("submitted_at"),
        })
        if len(out) == limit:
            break
    return jsonify(out)


@app.get("/feedback/stats")
def stats():
    dist = {str(i): 0 for i in range(1, 6)}
    total = 0
    for row in store.all():
        try:
            r = int(row.get("rating"))
        except (TypeError, ValueError):
            continue
        if 1 <= r <= 5:
            dist[str(r)] += 1
            total += r
    count = sum(dist.values())
    return jsonify(count=count, average=round(total / count, 2) if count else 0, distribution=dist)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5001)), debug=False)
