class Task:
    def __init__(self, title, description, due_date=None, completed=False):
        self.title = title
        self.description = description
        self.due_date = due_date
        self.completed = False

    def mark_completed(self):
        self.completed = True

    def __repr__(self):
        return f"Task(title={self.title}, completed={self.completed})"
    
