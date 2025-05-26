import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css'; // Import the styles

function getDaysInMonth(year, month) {
  const days = [];
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let day = 1; day <= totalDays; day++) {
    days.push(day);
  }

  return days;
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showStats, setShowStats] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getDaysInMonth(year, month);

  useEffect(() => {
    axios.get('/tasks')
      .then(response => setTasks(response.data))
      .catch(error => console.error('Error fetching tasks:', error));
  }, []);

  const addTask = () => {
    if (!newTaskTitle.trim()) return;

    const dueDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

    const newTask = {
      title: newTaskTitle,
      due: dueDate,
      done: false,
      priority: newTaskPriority,
      createdAt: new Date().toISOString()
    };

    axios.post('/tasks', newTask)
      .then(() => {
        setTasks([...tasks, newTask]);
        setNewTaskTitle("");
        setNewTaskPriority("medium");
      })
      .catch(error => console.error('Error adding task:', error));
  };

  const toggleTaskDone = (index) => {
    const updatedTasks = [...tasks];
    updatedTasks[index].done = !updatedTasks[index].done;
    
    axios.put(`/tasks/${index}`, updatedTasks[index])
      .then(() => {
        setTasks(updatedTasks);
      })
      .catch(error => console.error('Error updating task:', error));
  };

  const deleteTask = (index) => {
    axios.delete(`/tasks/${index}`)
      .then(() => {
        const updatedTasks = [...tasks];
        updatedTasks.splice(index, 1);
        setTasks(updatedTasks);
      })
      .catch(error => console.error('Error deleting task:', error));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(today.getDate());
  };

  const selectedISO = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || 
      (filter === "completed" && task.done) ||
      (filter === "pending" && !task.done) ||
      (filter === "high" && task.priority === "high") ||
      (filter === "today" && task.due === new Date().toISOString().split('T')[0]);
    return matchesSearch && matchesFilter;
  });

  const tasksForDate = tasks.filter(task => task.due === selectedISO);

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.done).length;
    const pending = total - completed;
    const high = tasks.filter(t => t.priority === "high").length;
    const overdue = tasks.filter(t => !t.done && new Date(t.due) < new Date()).length;
    return { total, completed, pending, high, overdue };
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    setCurrentDate(newDate);
    setSelectedDay(1);
  };

  const goToNextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    setCurrentDate(newDate);
    setSelectedDay(1);
  };

  const getTasksForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(task => task.due === dateStr);
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case "high": return "#ef4444";
      case "medium": return "#f59e0b";
      case "low": return "#10b981";
      default: return "#6b7280";
    }
  };

  const stats = getTaskStats();

  return (
    <div className="app-container">
      {/* Animated Background */}
      <div className="background-gradient"></div>
      <div className="noise-overlay"></div>
      
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo">Strato</div>
        </div>
        
        <div className="header-right">
          <button className="today-button" onClick={goToToday}>
            Today
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Calendar */}
        <div className="calendar-container">
          <div className="calendar-header">
            <button className="nav-button" onClick={goToPreviousMonth}>
              ←
            </button>
            <h2 className="calendar-title">
              {currentDate.toLocaleString('default', { month: 'long' })} {year}
            </h2>
            <button className="nav-button" onClick={goToNextMonth}>
              →
            </button>
          </div>

          <div className="calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="day-header">{d}</div>
            ))}

            {days.map((day, idx) => (
              <div key={idx}>
                {day ? (
                  <div 
                    className={`calendar-day ${day === selectedDay ? 'selected' : ''}`}
                    onClick={() => setSelectedDay(day)}
                  >
                    <div className="day-number">{day}</div>
                    <div className="day-tasks">
                      {getTasksForDay(day).slice(0, 3).map((task, i) => (
                        <div 
                          key={i} 
                          className={`task-preview ${task.done ? 'completed' : ''}`}
                          style={{ 
                            borderColor: getPriorityColor(task.priority),
                            backgroundColor: task.done ? 'rgba(16, 185, 129, 0.2)' : `rgba(${task.priority === 'high' ? '239, 68, 68' : task.priority === 'medium' ? '245, 158, 11' : '16, 185, 129'}, 0.2)`
                          }}
                        >
                          {task.title}
                        </div>
                      ))}
                      {getTasksForDay(day).length > 3 && (
                        <div className="more-tasks">
                          +{getTasksForDay(day).length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="calendar-day empty"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Task Input */}
        <div className="task-input-container">
          <div className="task-input-form">
            <input
              type="text"
              placeholder="What needs to be accomplished?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              className="task-title-input"
            />
            
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value)}
              className="priority-select"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            
            <button className="add-task-button" onClick={addTask}>
              Add to {selectedISO}
            </button>
          </div>
        </div>

        {/* Control Section (Analytics, Search, Filters) - MOVED HERE */}
        <div className="control-section">
          {/* Stats Section */}
          <div className="stats-section">
            <button
              className="stats-toggle"
              onClick={() => setShowStats(!showStats)}
            >
              Analytics
            </button>
            {showStats && (
              <div className="stats-content">
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-label">Total</div>
                    <div className="stat-value">{stats.total}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Completed</div>
                    <div className="stat-value completed">{stats.completed}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Pending</div>
                    <div className="stat-value pending">{stats.pending}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">High</div>
                    <div className="stat-value overdue">{stats.high}</div>
                  </div>
                </div>
                {stats.overdue > 0 && (
                  <div className="overdue-warning">
                    ⚠️ {stats.overdue} overdue task{stats.overdue > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search Section */}
          <div className="search-section">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-main"
            />
          </div>

          {/* Filter Section */}
          <div className="filter-section">
            {["all", "pending", "completed", "high", "today"].map(filterType => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`filter-button ${filter === filterType ? 'active' : ''}`}
              >
                {filterType}
              </button>
            ))}
          </div>
        </div>

        {/* Task Lists */}
        <div className="task-lists">
          <div className="task-list">
            <h3>All Tasks ({filteredTasks.length})</h3>
            <div className="task-list-content">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task, index) => (
                  <div 
                    key={index} 
                    className={`task-item ${task.done ? 'completed' : ''}`}
                    style={{ borderLeftColor: getPriorityColor(task.priority) }}
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTaskDone(index)}
                      className="task-checkbox"
                    />
                    <div className="task-content">
                      <div className="task-title">{task.title}</div>
                      <div className="task-meta">
                        <span className="task-date">{task.due}</span>
                        <span className="task-priority" style={{ color: getPriorityColor(task.priority) }}>
                          {task.priority}
                        </span>
                        {task.due < new Date().toISOString().split('T')[0] && !task.done && (
                          <span className="overdue-label">OVERDUE</span>
                        )}
                      </div>
                    </div>
                    <button className="delete-button" onClick={() => deleteTask(index)}>
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  {searchQuery ? "No tasks match your search." : "No tasks yet. Start building your day."}
                </div>
              )}
            </div>
          </div>

          <div className="task-list">
            <h3>{selectedISO} ({tasksForDate.length})</h3>
            <div className="task-list-content">
              {tasksForDate.length > 0 ? (
                tasksForDate.map((task, i) => (
                  <div 
                    key={i} 
                    className={`task-item ${task.done ? 'completed' : ''}`}
                    style={{ borderLeftColor: getPriorityColor(task.priority) }}
                  >
                    <div className="task-content">
                      <div className="task-title">{task.title}</div>
                      <div className="task-meta">
                        <span className="task-priority" style={{ color: getPriorityColor(task.priority) }}>
                          {task.priority} Priority
                        </span>
                        {task.due < new Date().toISOString().split('T')[0] && !task.done && (
                          <span className="overdue-label">OVERDUE</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  Focus mode. Clear schedule today.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button
            className="quick-action-button pending"
            onClick={() => setFilter("pending")}
            title="View Pending Tasks"
          >
            ⏳
          </button>
          <button
            className="quick-action-button high"
            onClick={() => setFilter("high")}
            title="View High Priority Tasks"
          >
            ⚡
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;