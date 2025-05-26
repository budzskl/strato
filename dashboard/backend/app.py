from flask import Flask, request, jsonify
import json
import os

app = Flask(__name__)
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

@app.route("/tasks", methods=["GET"])
def get_tasks():
    return jsonify(load_tasks())

@app.route("/tasks", methods=["POST"])
def add_task():
    tasks = load_tasks()
    new_task = request.json
    tasks.append(new_task)
    save_tasks(tasks)
    return jsonify({"status": "added"})

@app.route("/tasks/<int:index>", methods=["PUT"])
def update_task(index):
    tasks = load_tasks()
    if 0 <= index < len(tasks):
        updated_task = request.json
        tasks[index] = updated_task
        save_tasks(tasks)
        return jsonify({"status": "updated"})
    return jsonify({"error": "invalid index"}), 400

@app.route("/tasks/<int:index>", methods=["DELETE"])
def delete_task(index):
    tasks = load_tasks()
    if 0 <= index < len(tasks):
        tasks.pop(index)
        save_tasks(tasks)
        return jsonify({"status": "deleted"})
    return jsonify({"error": "invalid index"}), 400

if __name__ == "__main__":
    app.run(debug=True)