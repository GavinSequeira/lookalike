from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
import json
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:5174",
    "https://lookalike-frontend.onrender.com"
])

DATA_FILE = Path(__file__).parent / "feedback.jsonl"


@app.route("/feedback", methods=["POST"])
def save_feedback():
    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip()
    rating = str(data.get("rating", "")).strip()
    comments = str(data.get("comments", "")).strip()

    if not name or not rating or not comments:
        return jsonify({
            "message": "Please fill in your name, rating, and comments."
        }), 400

    feedback = {
        "name": name,
        "email": email,
        "rating": rating,
        "comments": comments,
        "submitted_at": datetime.now().isoformat()
    }

    with DATA_FILE.open("a", encoding="utf-8") as file:
        file.write(json.dumps(feedback) + "\n")

    return jsonify({
        "message": "Feedback saved successfully!"
    }), 201


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(__import__("os").environ.get("PORT", 5001)),
        debug=False
    )
