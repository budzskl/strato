from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)  # Allow requests from React frontend

DATA_FILE = "tasks.json"

# Load tasks
def load_tasks():
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, "w") as f:
            json.dump([], f)
    with open(DATA_FILE, "r") as f:
        return json.load(f)

# Save tasks
def save_tasks(tasks):
    with open(DATA_FILE, "w") as f:
        json.dump(tasks, f, indent=2)

# Get all tasks
@app.route("/tasks", methods=["GET"])
def get_tasks():
    return jsonify(load_tasks())

# Add a new task
@app.route("/tasks", methods=["POST"])
def add_task():
    tasks = load_tasks()
    new_task = request.json
    tasks.append(new_task)
    save_tasks(tasks)
    return jsonify({"status": "added"})

# Update task by id
@app.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    tasks = load_tasks()
    for i, task in enumerate(tasks):
        if task["id"] == task_id:
            tasks[i] = request.json
            save_tasks(tasks)
            return jsonify({"status": "updated"})
    return jsonify({"error": "task not found"}), 404

# Delete task by id
@app.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    tasks = load_tasks()
    updated_tasks = [t for t in tasks if t["id"] != task_id]
    if len(updated_tasks) == len(tasks):
        return jsonify({"error": "task not found"}), 404
    save_tasks(updated_tasks)
    return jsonify({"status": "deleted"})

if __name__ == "__main__":
    app.run(debug=True)
