import React, { useState, useEffect } from 'react';
import { Phone, Plus, Upload, Check, AlertTriangle } from 'lucide-react';

function Telecallers() {
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Single lead add form
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', assignedTo: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Bulk import states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [excelHeaders, setExcelHeaders] = useState([]);
  const [excelRows, setExcelRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({ nameKey: '', phoneKey: '', emailKey: '' });
  const [assignmentMode, setAssignmentMode] = useState('round-robin');
  const [selectedTelecallerIds, setSelectedTelecallerIds] = useState([]);
  const [singleTelecallerId, setSingleTelecallerId] = useState('');
  const [telecallerNameKey, setTelecallerNameKey] = useState('');
  const [fallbackTelecallerId, setFallbackTelecallerId] = useState('');
  const [previewLeads, setPreviewLeads] = useState([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [leadsRes, empRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/employees')
      ]);
      const leadsData = await leadsRes.json();
      const empData = await empRes.json();
      
      if (Array.isArray(leadsData)) setLeads(leadsData);
      if (Array.isArray(empData)) {
        const telecallersList = empData.filter(e => e.department === 'Marketing' || e.department === 'Sales' || e.department === 'Telecalling');
        setEmployees(telecallersList);
        // Default select all telecallers for round-robin
        setSelectedTelecallerIds(telecallersList.map(e => e.id));
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
      const res = await fetch('/api/leads', {
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
      const res = await fetch(`/api/leads/${id}`, {
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

  // Excel/CSV import parsing logic
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setExcelFile(file);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const XLSX = window.XLSX;
        if (!XLSX) {
          alert("SheetJS library is loading. Please try again in a moment.");
          return;
        }
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Parse rows as raw JSON objects
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        if (rows.length === 0) {
          alert("The uploaded sheet is empty.");
          return;
        }
        
        // Extract headers from first object
        const headers = Object.keys(rows[0]);
        setExcelHeaders(headers);
        setExcelRows(rows);
        
        // Auto-detect columns
        const mapping = { nameKey: '', phoneKey: '', emailKey: '' };
        headers.forEach(h => {
          const lower = h.toLowerCase().replace(/[\s_-]/g, '');
          if (lower.includes('name') || lower === 'fullname' || lower === 'lead') {
            if (!mapping.nameKey) mapping.nameKey = h;
          } else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact')) {
            if (!mapping.phoneKey) mapping.phoneKey = h;
          } else if (lower.includes('email') || lower.includes('mail')) {
            if (!mapping.emailKey) mapping.emailKey = h;
          }
        });
        setColumnMapping(mapping);
      } catch (err) {
        console.error(err);
        alert("Failed to parse the file. Please ensure it is a valid Excel or CSV file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Reactively build list of leads to preview and import
  useEffect(() => {
    if (!excelRows.length || !columnMapping.nameKey || !columnMapping.phoneKey) {
      setPreviewLeads([]);
      return;
    }
    
    const processed = [];
    let rrIndex = 0;
    
    const activeTelecallers = employees.filter(emp => selectedTelecallerIds.includes(emp.id));
    
    excelRows.forEach(row => {
      const name = String(row[columnMapping.nameKey] || '').trim();
      const phone = String(row[columnMapping.phoneKey] || '').trim();
      const email = columnMapping.emailKey ? String(row[columnMapping.emailKey] || '').trim() : '';
      
      if (!name || !phone) return; // skip rows without name or phone
      
      let assignedTo = null;
      let telecallerName = 'Unassigned';
      
      if (assignmentMode === 'single') {
        const empId = parseInt(singleTelecallerId);
        const emp = employees.find(e => e.id === empId);
        if (emp) {
          assignedTo = emp.id;
          telecallerName = emp.fullName;
        }
      } else if (assignmentMode === 'round-robin') {
        if (activeTelecallers.length > 0) {
          const emp = activeTelecallers[rrIndex % activeTelecallers.length];
          assignedTo = emp.id;
          telecallerName = emp.fullName;
          rrIndex++;
        }
      } else if (assignmentMode === 'sheet' && telecallerNameKey) {
        const val = String(row[telecallerNameKey] || '').trim().toLowerCase();
        const emp = employees.find(e => 
          e.fullName.toLowerCase() === val || 
          e.email.toLowerCase() === val || 
          e.empId.toLowerCase() === val
        );
        if (emp) {
          assignedTo = emp.id;
          telecallerName = emp.fullName;
        } else {
          const fEmpId = parseInt(fallbackTelecallerId);
          const fEmp = employees.find(e => e.id === fEmpId);
          if (fEmp) {
            assignedTo = fEmp.id;
            telecallerName = `${fEmp.fullName} (Fallback)`;
          }
        }
      }
      
      processed.push({ name, phone, email, assignedTo, telecallerName });
    });
    
    setPreviewLeads(processed);
  }, [excelRows, columnMapping, assignmentMode, selectedTelecallerIds, singleTelecallerId, telecallerNameKey, fallbackTelecallerId, employees]);

  const handleBulkImport = async () => {
    const validLeads = previewLeads.filter(l => l.assignedTo);
    if (validLeads.length === 0) {
      alert("No valid leads (with assigned telecallers) to import.");
      return;
    }
    
    const unassignedCount = previewLeads.length - validLeads.length;
    if (unassignedCount > 0) {
      if (!confirm(`Warning: ${unassignedCount} leads are currently unassigned and won't be imported. Do you want to continue?`)) {
        return;
      }
    }
    
    setImporting(true);
    try {
      const res = await fetch('/api/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: validLeads })
      });
      if (res.ok) {
        const newLeads = await res.json();
        setLeads(prev => [...newLeads, ...prev]);
        setIsUploadModalOpen(false);
        // Reset states
        setExcelFile(null);
        setExcelHeaders([]);
        setExcelRows([]);
        setPreviewLeads([]);
      } else {
        alert("Server failed to import leads.");
      }
    } catch (error) {
      console.error("Bulk import failed", error);
      alert("Failed to import leads.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
      <div className="page-header">
        <div>
          <h2>Telecallers & Leads</h2>
          <p className="text-muted">Manage leads, assign calls, and track conversion.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-glass" onClick={() => setIsUploadModalOpen(true)}>
            <Upload size={20} /> Import Leads (Excel/CSV)
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={20} /> Add New Lead
          </button>
        </div>
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
                    <div className="avatar small">{lead.employee?.fullName ? lead.employee.fullName.charAt(0) : '?'}</div>
                    <span style={{ fontSize: '0.9rem' }}>{lead.employee?.fullName || 'Unassigned'}</span>
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

      {isUploadModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card glass-card" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Import Leads from Excel/CSV</h3>
              <button className="icon-btn" onClick={() => {
                setIsUploadModalOpen(false);
                setExcelFile(null);
                setExcelHeaders([]);
                setExcelRows([]);
                setPreviewLeads([]);
              }}>×</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {!excelFile ? (
                <div 
                  style={{
                    border: '2px dashed var(--border-glass-strong)',
                    borderRadius: '12px',
                    padding: '3rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.01)',
                    transition: 'var(--transition)'
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileChange({ target: { files: e.dataTransfer.files } });
                    }
                  }}
                  onClick={() => document.getElementById('excel-file-input').click()}
                >
                  <Upload size={48} className="text-muted" style={{ marginBottom: '1rem' }} />
                  <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Drag & Drop Excel or CSV file here</p>
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>Supports .xlsx, .xls, and .csv formats</p>
                  <input 
                    id="excel-file-input" 
                    type="file" 
                    accept=".xlsx,.xls,.csv" 
                    style={{ display: 'none' }} 
                    onChange={handleFileChange} 
                  />
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="text-success" style={{ display: 'flex', alignItems: 'center' }}><Check size={18} /></span>
                      <div>
                        <strong>{excelFile.name}</strong>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{excelRows.length} rows found</div>
                      </div>
                    </div>
                    <button className="btn btn-glass" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => {
                      setExcelFile(null);
                      setExcelHeaders([]);
                      setExcelRows([]);
                      setPreviewLeads([]);
                    }}>Change File</button>
                  </div>
                  
                  {/* Column Mapping */}
                  <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem' }}>1. Map Spreadsheet Columns</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.8rem' }}>Name Column <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <select 
                          value={columnMapping.nameKey} 
                          onChange={e => setColumnMapping({...columnMapping, nameKey: e.target.value})}
                          style={{ padding: '0.4rem' }}
                        >
                          <option value="" disabled>Select column</option>
                          {excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.8rem' }}>Phone Column <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <select 
                          value={columnMapping.phoneKey} 
                          onChange={e => setColumnMapping({...columnMapping, phoneKey: e.target.value})}
                          style={{ padding: '0.4rem' }}
                        >
                          <option value="" disabled>Select column</option>
                          {excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.8rem' }}>Email Column (Optional)</label>
                        <select 
                          value={columnMapping.emailKey} 
                          onChange={e => setColumnMapping({...columnMapping, emailKey: e.target.value})}
                          style={{ padding: '0.4rem' }}
                        >
                          <option value="">-- None --</option>
                          {excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Assignment Settings */}
                  <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem' }}>2. Lead Assignment Settings</h4>
                    
                    <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                        <input 
                          type="radio" 
                          name="assignmentMode" 
                          checked={assignmentMode === 'round-robin'} 
                          onChange={() => setAssignmentMode('round-robin')}
                        />
                        Round-Robin (Evenly distribute)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                        <input 
                          type="radio" 
                          name="assignmentMode" 
                          checked={assignmentMode === 'single'} 
                          onChange={() => setAssignmentMode('single')}
                        />
                        Assign to Single Telecaller
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                        <input 
                          type="radio" 
                          name="assignmentMode" 
                          checked={assignmentMode === 'sheet'} 
                          onChange={() => setAssignmentMode('sheet')}
                        />
                        Match from Sheet Column
                      </label>
                    </div>

                    {/* Mode Specific Inputs */}
                    {assignmentMode === 'round-robin' && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <label style={{ fontSize: '0.85rem' }}>Select Telecallers to include in distribution:</label>
                          <button 
                            type="button" 
                            className="btn btn-glass" 
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => {
                              if (selectedTelecallerIds.length === employees.length) {
                                setSelectedTelecallerIds([]);
                              } else {
                                setSelectedTelecallerIds(employees.map(e => e.id));
                              }
                            }}
                          >
                            {selectedTelecallerIds.length === employees.length ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto', padding: '0.25rem' }}>
                          {employees.map(emp => (
                            <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', padding: '4px', background: 'rgba(255,255,255,0.01)', borderRadius: '4px' }}>
                              <input 
                                type="checkbox" 
                                checked={selectedTelecallerIds.includes(emp.id)} 
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTelecallerIds([...selectedTelecallerIds, emp.id]);
                                  } else {
                                    setSelectedTelecallerIds(selectedTelecallerIds.filter(id => id !== emp.id));
                                  }
                                }}
                              />
                              {emp.fullName}
                            </label>
                          ))}
                        </div>
                        {selectedTelecallerIds.length === 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                            <AlertTriangle size={14} /> Please select at least one telecaller.
                          </div>
                        )}
                      </div>
                    )}

                    {assignmentMode === 'single' && (
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.85rem' }}>Select Telecaller</label>
                        <select 
                          required 
                          value={singleTelecallerId} 
                          onChange={e => setSingleTelecallerId(e.target.value)}
                        >
                          <option value="" disabled>Select Telecaller</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {assignmentMode === 'sheet' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.85rem' }}>Telecaller Name/Email/ID Column</label>
                          <select 
                            required 
                            value={telecallerNameKey} 
                            onChange={e => setTelecallerNameKey(e.target.value)}
                          >
                            <option value="" disabled>Select Column</option>
                            {excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.85rem' }}>Fallback Telecaller (if unmatched)</label>
                          <select 
                            required 
                            value={fallbackTelecallerId} 
                            onChange={e => setFallbackTelecallerId(e.target.value)}
                          >
                            <option value="" disabled>Select Telecaller</option>
                            {employees.map(emp => (
                              <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Lead Preview Section */}
                  {previewLeads.length > 0 && (
                    <div className="glass-card" style={{ padding: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>3. Preview Mapped Leads ({previewLeads.length} leads)</h4>
                      <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                        <table className="glass-table" style={{ fontSize: '0.8rem', margin: 0 }}>
                          <thead>
                            <tr style={{ position: 'sticky', top: 0, background: '#121824', zIndex: 1 }}>
                              <th style={{ padding: '0.5rem' }}>Lead Name</th>
                              <th style={{ padding: '0.5rem' }}>Phone</th>
                              <th style={{ padding: '0.5rem' }}>Email</th>
                              <th style={{ padding: '0.5rem' }}>Assigned Telecaller</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewLeads.map((lead, idx) => (
                              <tr key={idx}>
                                <td style={{ padding: '0.5rem' }}>{lead.name}</td>
                                <td style={{ padding: '0.5rem' }}>{lead.phone}</td>
                                <td style={{ padding: '0.5rem' }}>{lead.email || '-'}</td>
                                <td style={{ padding: '0.5rem' }}>
                                  <span style={{ color: lead.assignedTo ? 'inherit' : 'var(--danger)', fontWeight: lead.assignedTo ? 'normal' : 'bold' }}>
                                    {lead.telecallerName}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-glass" 
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setExcelFile(null);
                  setExcelHeaders([]);
                  setExcelRows([]);
                  setPreviewLeads([]);
                }}
                disabled={importing}
              >
                Cancel
              </button>
              {excelFile && (
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleBulkImport}
                  disabled={importing || previewLeads.length === 0 || (assignmentMode === 'round-robin' && selectedTelecallerIds.length === 0)}
                >
                  {importing ? 'Importing...' : `Import ${previewLeads.filter(l => l.assignedTo).length} Leads`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Telecallers;
