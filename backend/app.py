from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow React frontend to access this API

@app.route("/api/status")
def status():
    return jsonify({"message": "Strato backend is running"})

if __name__ == "__main__":
    app.run(debug=True, port=5050)
