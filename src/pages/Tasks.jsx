import React, { useState, useEffect } from 'react';
import { Plus, X, Clock, AlertCircle } from 'lucide-react';
import './Tasks.css';

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', priority: 'Medium', assigneeId: '', dueDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, empRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/employees')
      ]);
      const tasksData = await tasksRes.json();
      const empData = await empRes.json();
      
      setTasks(tasksData);
      setEmployees(empData);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const newTask = await res.json();
        setTasks([newTask, ...tasks]);
        setIsModalOpen(false);
        setFormData({ title: '', description: '', priority: 'Medium', assigneeId: '', dueDate: '' });
      }
    } catch (error) {
      console.error('Failed to create task', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return 'var(--danger)';
      case 'Medium': return 'var(--warning)';
      case 'Low': return 'var(--success)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="tasks-container">
      <div className="page-header">
        <div>
          <h2>Task Management</h2>
          <p className="text-muted">Assign and track tasks for your agents.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Create Task
        </button>
      </div>

      <div className="task-board">
        {['Pending', 'In Progress', 'Completed'].map(status => (
          <div key={status} className="task-column glass-card">
            <h3 className="column-title">{status}</h3>
            <div className="task-list">
              {tasks.filter(t => t.status === status).map(task => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <span className="task-priority" style={{ backgroundColor: `${getPriorityColor(task.priority)}20`, color: getPriorityColor(task.priority) }}>
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span className="task-date">
                        <Clock size={14} />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h4 className="task-title">{task.title}</h4>
                  <p className="task-desc">{task.description}</p>
                  
                  <div className="task-footer">
                    <div className="assignee">
                      <div className="avatar small">{task.assignee.fullName.charAt(0)}</div>
                      <span>{task.assignee.fullName}</span>
                    </div>
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.status === status).length === 0 && (
                <div className="empty-state text-muted">No tasks in {status}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card glass-card">
            <div className="modal-header">
              <h3>Create & Assign Task</h3>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateTask} className="modal-body">
              <div className="form-group">
                <label>Task Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="What needs to be done?" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Add details..."></textarea>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Assign to Agent</label>
                  <select required value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})}>
                    <option value="" disabled>Select Agent</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.department})</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Due Date (Optional)</label>
                <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-glass" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;
