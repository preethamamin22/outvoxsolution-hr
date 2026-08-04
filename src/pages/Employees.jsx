import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, X } from 'lucide-react';
import './Employees.css';

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    empId: '', fullName: '', email: '', department: 'Engineering', designation: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      setEmployees(data);
    } catch (error) {
      console.error('Failed to fetch employees', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const newEmp = await res.json();
        setEmployees([newEmp, ...employees]);
        setIsModalOpen(false);
        setFormData({ empId: '', fullName: '', email: '', department: 'Engineering', designation: '' });
      }
    } catch (error) {
      console.error('Failed to add employee', error);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'var(--success)';
      case 'On Leave': return 'var(--warning)';
      case 'Terminated': return 'var(--danger)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="employees-container">
      <div className="page-header">
        <div>
          <h2>Agent / Employee Directory</h2>
          <p className="text-muted">Manage your workforce and agent profiles.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Add Agent
        </button>
      </div>

      <div className="glass-card table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="text-muted" />
            <input type="text" placeholder="Search agents..." />
          </div>
          <div className="filters">
            <select className="glass-select">
              <option>All Departments</option>
              <option>Engineering</option>
              <option>Marketing</option>
              <option>Sales</option>
              <option>HR</option>
            </select>
          </div>
        </div>

        <table className="glass-table">
          <thead>
            <tr>
              <th>Agent Info</th>
              <th>Employee ID</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Status</th>
              <th>Joined Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading agents...</td></tr>
            ) : employees.map((emp) => (
              <tr key={emp.id}>
                <td>
                  <div className="emp-info-cell">
                    <div className="avatar">{emp.fullName.charAt(0)}</div>
                    <div>
                      <div className="emp-name">{emp.fullName}</div>
                      <div className="emp-email">{emp.email}</div>
                    </div>
                  </div>
                </td>
                <td>{emp.empId}</td>
                <td>{emp.department}</td>
                <td>{emp.designation}</td>
                <td>
                  <span className="status-badge" style={{ backgroundColor: `${getStatusColor(emp.status)}20`, color: getStatusColor(emp.status) }}>
                    {emp.status}
                  </span>
                </td>
                <td>{new Date(emp.joiningDate).toLocaleDateString()}</td>
                <td>
                  <button className="icon-btn"><MoreVertical size={18} /></button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && !loading && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No agents found. Add one!</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card glass-card">
            <div className="modal-header">
              <h3>Add New Agent</h3>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddEmployee} className="modal-body">
              <div className="form-group">
                <label>Employee ID</label>
                <input required type="text" value={formData.empId} onChange={e => setFormData({...formData, empId: e.target.value})} placeholder="e.g. AGT-001" />
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="Agent Name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="agent@outvox.com" />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                  <option>Engineering</option>
                  <option>Marketing</option>
                  <option>Sales</option>
                  <option>HR</option>
                  <option>Support</option>
                </select>
              </div>
              <div className="form-group">
                <label>Designation</label>
                <input required type="text" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} placeholder="e.g. Support Specialist" />
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-glass" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Agent</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;
