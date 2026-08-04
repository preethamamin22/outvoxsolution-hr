import React, { useState, useEffect } from 'react';
import { Phone, Users, Plus, PhoneCall } from 'lucide-react';

function Telecallers() {
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', assignedTo: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [leadsRes, empRes] = await Promise.all([
        fetch('http://localhost:5000/api/leads'),
        fetch('http://localhost:5000/api/employees')
      ]);
      const leadsData = await leadsRes.json();
      const empData = await empRes.json();
      
      if (Array.isArray(leadsData)) setLeads(leadsData);
      if (Array.isArray(empData)) {
        setEmployees(empData.filter(e => e.department === 'Marketing' || e.department === 'Sales' || e.department === 'Telecalling'));
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const newLead = await res.json();
        setLeads([newLead, ...leads]);
        setIsModalOpen(false);
        setFormData({ name: '', phone: '', email: '', assignedTo: '' });
      }
    } catch (error) {
      console.error('Failed to create lead', error);
    }
  };

  const updateLeadStatus = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updated = await res.json();
        setLeads(leads.map(l => l.id === id ? updated : l));
      }
    } catch (error) {
      console.error('Failed to update lead', error);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'New': return 'var(--primary)';
      case 'Interested': return 'var(--success)';
      case 'Follow-up': return 'var(--warning)';
      case 'Not Interested': return 'var(--danger)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
      <div className="page-header">
        <div>
          <h2>Telecallers & Leads</h2>
          <p className="text-muted">Manage leads, assign calls, and track conversion.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} /> Add New Lead
        </button>
      </div>

      <div className="glass-card table-container">
        <table className="glass-table">
          <thead>
            <tr>
              <th>Lead Name</th>
              <th>Contact Info</th>
              <th>Assigned Telecaller</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading leads...</td></tr>
            ) : leads.map(lead => (
              <tr key={lead.id}>
                <td><strong>{lead.name}</strong></td>
                <td>
                  <div style={{ fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}><Phone size={14}/> {lead.phone}</div>
                    <div className="text-muted">{lead.email}</div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="avatar small">{lead.employee.fullName.charAt(0)}</div>
                    <span style={{ fontSize: '0.9rem' }}>{lead.employee.fullName}</span>
                  </div>
                </td>
                <td>
                   <span className="status-badge" style={{ backgroundColor: `${getStatusColor(lead.status)}20`, color: getStatusColor(lead.status) }}>
                    {lead.status}
                  </span>
                </td>
                <td>
                  <select 
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', padding: '0.2rem 0.5rem', color: 'var(--text-main)', borderRadius: '4px' }}
                    value={lead.status}
                    onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                  >
                    <option value="New">New</option>
                    <option value="Interested">Interested</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Not Interested">Not Interested</option>
                  </select>
                </td>
              </tr>
            ))}
            {leads.length === 0 && !loading && (
               <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No leads available.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card glass-card">
            <div className="modal-header">
              <h3>Add New Lead</h3>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddLead} className="modal-body">
              <div className="form-group">
                <label>Lead Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Smith" />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+1 234 567 890" />
              </div>
              <div className="form-group">
                <label>Email (Optional)</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />
              </div>
              <div className="form-group">
                <label>Assign to Telecaller</label>
                <select required value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})}>
                  <option value="" disabled>Select Telecaller</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-glass" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Telecallers;
