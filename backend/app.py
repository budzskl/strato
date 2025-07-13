from flask import Flask, jsonify, request
from flask_cors import CORS
from task import Task

app = Flask(__name__)
CORS(app)

tasks ={}
task_id = 1

@app.route("/home")
def home():
    return jsonify({"message": "Welcome to the Strato backend!"})

@app.route("/tasks", methods=["GET"])
def get_tasks():
    return jsonify({"tasks": [{"title": task.title, "description": task.description, "due_date": task.due_date, "completed": task.completed}]})

@app.route("/tasks", methods=["POST"])
def create_task():
     global task_id

     data = request.get_json()
     new_task = Task(
        title=data.get("title", ""),
        description=data.get("description", ""),
        due_date=data.get("due_date", None),
        completed=data.get("completed", False)  
     )
     new_task.id = task_id
     tasks[task_id] = new_task
     task_id += 1
        

if __name__ == "__main__":
    app.run(debug=True, port=5050)
