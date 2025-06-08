import React, { useEffect, useState } from 'react';
import './App.css';

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

function getWeekDays(currentDate) {
  const week = [];
  const startOfWeek = new Date(currentDate);
  const dayOfWeek = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    week.push(day);
  }

  return week;
}

function generateTimeSlots() {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    const time12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour < 12 ? 'AM' : 'PM';
    const timeString = `${time12.toString().padStart(2, '0')}:00 ${ampm}`;
    slots.push({
      hour,
      timeString,
      time24: `${hour.toString().padStart(2, '0')}:00`
    });
  }
  return slots;
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  // Removed newTaskTime state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [calendarView, setCalendarView] = useState("month"); // "month" or "week"
  
  // Event form states
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventStartTime, setNewEventStartTime] = useState("09:00");
  const [newEventEndTime, setNewEventEndTime] = useState("10:00");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [showEventForm, setShowEventForm] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getDaysInMonth(year, month);
  const weekDays = getWeekDays(currentDate);
  const timeSlots = generateTimeSlots();

  // Load data from Flask backend
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load tasks from backend
        const taskResponse = await fetch('http://127.0.0.1:5000/tasks');
        if (taskResponse.ok) {
          const backendTasks = await taskResponse.json();
          setTasks(backendTasks);
        }
        
        // Load events from backend (you'll need to add this endpoint)
        const eventResponse = await fetch('http://127.0.0.1:5000/events');
        if (eventResponse.ok) {
          const backendEvents = await eventResponse.json();
          setEvents(backendEvents);
        }
      } catch (error) {
        console.error('Failed to load data from backend:', error);
        // Fall back to empty arrays if backend is unavailable
      }
    };
    
    loadData();

    const ensureRecurringTasks = async () => {
      const response = await fetch('http://127.0.0.1:5000/tasks');
      const existingTasks = await response.json();
      const today = new Date().toISOString().split('T')[0];
    
      const recurringTemplates = existingTasks.filter(t => t.recurring === 'daily');
      const todayTasks = existingTasks.filter(t => t.due === today);
    
      const missing = recurringTemplates.filter(template =>
        !todayTasks.some(t => t.title === template.title && t.due === today)
      );
    
      for (const task of missing) {
        const cloned = {
          ...task,
          id: Date.now() + Math.random(),  // ensure uniqueness
          due: today,
          done: false,
          createdAt: new Date().toISOString()
        };
        await fetch('http://127.0.0.1:5000/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cloned)
        });
      }
    };
    
  }, []);

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;

    // Use the currently selected/viewed date for new tasks
    const selectedDate = getSelectedDate();
    const dueDate = selectedDate.toISOString().split('T')[0];

    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      due: dueDate,
      // Removed time field
      done: false,
      priority: newTaskPriority,
      createdAt: new Date().toISOString()
    };

    try {
      // Save to backend
      const response = await fetch('http://127.0.0.1:5000/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask)
      });

      if (response.ok) {
        // Update local state only if backend save was successful
        setTasks([...tasks, newTask]);
        setNewTaskTitle("");
        setNewTaskPriority("medium");
      } else {
        console.error('Failed to save task to backend');
        alert('Failed to save task. Please try again.');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Error connecting to server. Task not saved.');
    }
  };

  const addEvent = async () => {
    if (!newEventTitle.trim()) return;

    // Use the currently selected/viewed date for new events
    const selectedDate = getSelectedDate();
    const eventDate = selectedDate.toISOString().split('T')[0];

    const newEvent = {
      id: Date.now(),
      title: newEventTitle,
      description: newEventDescription,
      date: eventDate,
      startTime: newEventStartTime,
      endTime: newEventEndTime,
      createdAt: new Date().toISOString()
    };

    try {
      // Save to backend
      const response = await fetch('http://127.0.0.1:5000/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEvent)
      });

      if (response.ok) {
        // Update local state only if backend save was successful
        setEvents([...events, newEvent]);
        setNewEventTitle("");
        setNewEventDescription("");
        setNewEventStartTime("09:00");
        setNewEventEndTime("10:00");
        setShowEventForm(false);
      } else {
        console.error('Failed to save event to backend');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      // Still update local state as fallback
      setEvents([...events, newEvent]);
      setNewEventTitle("");
      setNewEventDescription("");
      setNewEventStartTime("09:00");
      setNewEventEndTime("10:00");
      setShowEventForm(false);
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      // Find the index of the event to delete
      const eventIndex = events.findIndex(event => event.id === eventId);
      if (eventIndex === -1) return;

      // Delete from backend
      const response = await fetch(`http://127.0.0.1:5000/events/${eventIndex}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Update local state only if backend delete was successful
        setEvents(events.filter(event => event.id !== eventId));
      } else {
        console.error('Failed to delete event from backend');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      // Still update local state as fallback
      setEvents(events.filter(event => event.id !== eventId));
    }
  };

  const toggleTaskDone = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
  
      const updatedTask = { ...task, done: !task.done };
  
      const response = await fetch(`http://127.0.0.1:5000/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTask)
      });
  
      if (response.ok) {
        setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
      } else {
        console.error('Failed to update task on backend');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      // Still optimistically update the state
      setTasks(tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t));
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/tasks/${taskId}`, {
        method: 'DELETE'
      });
  
      if (response.ok) {
        setTasks(tasks.filter(task => task.id !== taskId));
      } else {
        console.error('Failed to delete task from backend');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      // Still optimistically update
      setTasks(tasks.filter(task => task.id !== taskId));
    }
  };
  

  // Handle day selection and view switching synchronization
  const handleDaySelect = (day) => {
    if (calendarView === "month") {
      setSelectedDay(day);
      // Update currentDate to reflect the selected day
      setCurrentDate(new Date(year, month, day));
    }
  };

  const handleWeekDayClick = (dayDate) => {
    // When clicking a day in week view, update both selectedDay and currentDate
    setCurrentDate(new Date(dayDate));
    setSelectedDay(dayDate.getDate());
    
    // If the clicked date is in a different month, switch to that month
    if (dayDate.getMonth() !== month || dayDate.getFullYear() !== year) {
      setCurrentDate(new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate()));
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
    setSelectedDay(today.getDate());
  };

  // Sync selected date between views
  const getSelectedDate = () => {
    if (calendarView === "week") {
      // In week view, use the current date being viewed
      return currentDate;
    } else {
      // In month view, use the selected day
      return new Date(year, month, selectedDay);
    }
  };

  const selectedISO = getSelectedDate().toISOString().split('T')[0];
  
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
  const eventsForDate = events.filter(event => event.date === selectedISO);

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.done).length;
    const pending = total - completed;
    const high = tasks.filter(t => t.priority === "high").length;
    const overdue = tasks.filter(t => !t.done && new Date(t.due) < new Date()).length;
    return { total, completed, pending, high, overdue };
  };

  const goToPrevious = () => {
    if (calendarView === "month") {
      const newDate = new Date(year, month - 1, 1);
      setCurrentDate(newDate);
      setSelectedDay(1);
    } else {
      // Fixed: properly navigate weeks
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    }
  };

  const goToNext = () => {
    if (calendarView === "month") {
      const newDate = new Date(year, month + 1, 1);
      setCurrentDate(newDate);
      setSelectedDay(1);
    } else {
      // Fixed: properly navigate weeks
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    }
  };

  const getTasksForDay = (day) => {
    const dateStr = calendarView === "month" 
      ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      : day.toISOString().split('T')[0];
    return tasks.filter(task => task.due === dateStr);
  };

  const getEventsForDay = (day) => {
    const dateStr = calendarView === "month" 
      ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      : day.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case "high": return "#ef4444";
      case "medium": return "#f59e0b";
      case "low": return "#10b981";
      default: return "#6b7280";
    }
  };

  const getItemsForTimeSlot = (hour, dayDate) => {
    const dateStr = dayDate.toISOString().split('T')[0];
    const dayEvents = events.filter(event => event.date === dateStr);
  
    const items = [];
  
    dayEvents.forEach(event => {
      const [startH, startM] = event.startTime.split(':').map(Number);
      const [endH, endM] = event.endTime.split(':').map(Number);
      
      const eventStartMinutes = startH * 60 + startM;
      const eventEndMinutes = endH * 60 + endM;
      const slotStartMinutes = hour * 60;
      const slotEndMinutes = (hour + 1) * 60;
  
      // Updated comparison to include the final hour block
      if (eventStartMinutes < slotEndMinutes && eventEndMinutes > slotStartMinutes) {
        items.push({ ...event, type: 'event' });
      }
    });
  
    return items;
  };
  
  

  const stats = getTaskStats();

  const formatDateTitle = () => {
    if (calendarView === "month") {
      return `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
    } else {
      const startOfWeek = weekDays[0];
      const endOfWeek = weekDays[6];
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  };

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
          <div className="view-toggle">
            <button 
              className={`view-button ${calendarView === 'month' ? 'active' : ''}`}
              onClick={() => setCalendarView('month')}
            >
              Month
            </button>
            <button 
              className={`view-button ${calendarView === 'week' ? 'active' : ''}`}
              onClick={() => setCalendarView('week')}
            >
              Week
            </button>
          </div>
          <button className="today-button" onClick={goToToday}>
            Today
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Calendar Header */}
        <div className="calendar-container">
          <div className="calendar-header">
            <button className="nav-button" onClick={goToPrevious}>
              ←
            </button>
            <h2 className="calendar-title">
              {formatDateTitle()}
            </h2>
            <button className="nav-button" onClick={goToNext}>
              →
            </button>
          </div>

          {calendarView === "month" ? (
            /* Monthly Calendar View */
            <div className="calendar-grid">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} className="day-header">{d}</div>
              ))}

              {days.map((day, idx) => (
                <div key={idx}>
                  {day ? (
                    <div 
                      className={`calendar-day ${day === selectedDay ? 'selected' : ''}`}
                      onClick={() => handleDaySelect(day)}
                    >
                      <div className="day-number">{day}</div>
                      <div className="day-tasks">
                        {/* Show events first */}
                        {getEventsForDay(day).slice(0, 2).map((event, i) => (
                          <div 
                            key={`event-${i}`} 
                            className="event-preview"
                          >
                            {event.startTime} {event.title}
                          </div>
                        ))}
                        {/* Then show tasks (no time display) */}
                        {getTasksForDay(day).slice(0, 3 - getEventsForDay(day).length).map((task, i) => (
                          <div 
                            key={`task-${i}`} 
                            className={`task-preview ${task.done ? 'completed' : ''}`}
                            style={{ borderLeftColor: getPriorityColor(task.priority) }}
                          >
                            {task.title}
                          </div>
                        ))}
                        {(getTasksForDay(day).length + getEventsForDay(day).length) > 3 && (
                          <div className="more-tasks">
                            +{(getTasksForDay(day).length + getEventsForDay(day).length) - 3} more
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
          ) : (
            /* Weekly Calendar View - Fixed */
            <div className="week-view">
              <div className="week-header">
                <div className="time-gutter"></div>
                {weekDays.map((day, idx) => (
                  <div 
                    key={idx} 
                    className="week-day-header"
                    onClick={() => handleWeekDayClick(day)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="day-name">
                      {day.toLocaleDateString('en', { weekday: 'short' })}
                    </div>
                    <div className={`day-number ${day.toDateString() === new Date().toDateString() ? 'today' : ''} ${day.toDateString() === getSelectedDate().toDateString() ? 'selected-week-day' : ''}`}>
                      {day.getDate()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="week-schedule">
                <div className="time-column">
                  {timeSlots.map((slot) => (
                    <div key={slot.hour} className="time-slot-label">
                      {slot.timeString}
                    </div>
                  ))}
                </div>

                {weekDays.map((day, dayIdx) => (
                  <div key={dayIdx} className="day-column">
                    {timeSlots.map((slot) => {
                      const items = getItemsForTimeSlot(slot.hour, day);
                      return (
                        <div key={slot.hour} className="schedule-slot">
                          {items.map((item, itemIdx) => (
                            <div 
                              key={itemIdx} 
                              className={`schedule-item ${item.type}`}
                              style={{
                                backgroundColor: item.type === 'event' 
                                  ? 'rgba(59, 130, 246, 0.3)' 
                                  : `rgba(${item.priority === 'high' ? '239, 68, 68' : item.priority === 'medium' ? '245, 158, 11' : '16, 185, 129'}, 0.3)`,
                                borderLeftColor: item.type === 'event' ? '#3b82f6' : getPriorityColor(item.priority)
                              }}
                            >
                              <div className="item-title">
                                {item.title}
                              </div>
                              {item.type === 'event' && (
                                <div className="item-time">
                                  {item.startTime} - {item.endTime}
                                </div>
                              )}
                              {/* Removed task time display */}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add Task/Event Section */}
        <div className="add-section">
          <div className="add-task-container">
            <h3>Add Task</h3>
            <div className="task-input-form">
              <input
                type="text"
                placeholder="Add task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
                className="task-title-input"
              />
              
              {/* Removed time input */}
              
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
                Add Task
              </button>
            </div>
          </div>

          <div className="add-event-container">
            <div className="event-header">
              <h3>Add Event</h3>
              <button 
                className="toggle-form-button"
                onClick={() => setShowEventForm(!showEventForm)}
              >
                {showEventForm ? 'Cancel' : 'New Event'}
              </button>
            </div>

            {showEventForm && (
              <div className="event-form">
                <input
                  type="text"
                  placeholder="Event title..."
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="event-title-input"
                />
                
                <div className="time-inputs">
                  <div className="time-input-group">
                    <label>Start Time:</label>
                    <input
                      type="time"
                      value={newEventStartTime}
                      onChange={(e) => setNewEventStartTime(e.target.value)}
                      className="time-input"
                    />
                  </div>
                  
                  <div className="time-input-group">
                    <label>End Time:</label>
                    <input
                      type="time"
                      value={newEventEndTime}
                      onChange={(e) => setNewEventEndTime(e.target.value)}
                      className="time-input"
                    />
                  </div>
                </div>
                
                <textarea
                  placeholder="Description (optional)..."
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  className="event-description-input"
                  rows="3"
                />
                
                <button className="create-event-button" onClick={addEvent}>
                  Create Event
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Control Section - Only show in month view */}
        {calendarView === "month" && (
          <>
            <div className="control-section">
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
                  </div>
                )}
              </div>

              <div className="search-section">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input-main"
                />
              </div>

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

            {/* Task Lists - Only in month view */}
            <div className="task-lists">
              <div className="task-list">
                <h3>All Tasks ({filteredTasks.length})</h3>
                <div className="task-list-content">
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                      <div 
                        key={task.id} 
                        className={`task-item ${task.done ? 'completed' : ''}`}
                        style={{ borderLeftColor: getPriorityColor(task.priority) }}
                      >
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleTaskDone(task.id)}
                          className="task-checkbox"
                        />
                        <div className="task-content">
                          <div className="task-title">{task.title}</div>
                          <div className="task-meta">
                            <span className="task-date">{task.due}</span>
                            {/* Removed task time display */}
                            <span className="task-priority" style={{ color: getPriorityColor(task.priority) }}>
                              {task.priority}
                            </span>
                            {task.due < new Date().toISOString().split('T')[0] && !task.done && (
                              <span className="overdue-label">OVERDUE</span>
                            )}
                          </div>
                        </div>
                        <button className="delete-button" onClick={() => deleteTask(task.id)}>
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
                    tasksForDate.map((task) => (
                      <div 
                        key={task.id} 
                        className={`task-item ${task.done ? 'completed' : ''}`}
                        style={{ borderLeftColor: getPriorityColor(task.priority) }}
                      >
                        <div className="task-content">
                          <div className="task-title">{task.title}</div>
                          <div className="task-meta">
                            {/* Removed task time display */}
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
          </>
        )}
      </div>
    </div>
  );
}

export default App;