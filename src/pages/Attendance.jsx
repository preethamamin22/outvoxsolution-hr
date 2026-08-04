import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import './Attendance.css';

function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empRes, attRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/attendance')
      ]);
      const empData = await empRes.json();
      const attData = await attRes.json();
      
      setEmployees(empData);
      setAttendance(attData);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async (employeeId) => {
    try {
      const res = await fetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      if (res.ok) {
        const record = await res.json();
        setAttendance([record, ...attendance]);
      }
    } catch (error) {
      console.error('Clock-in failed', error);
    }
  };

  const handleClockOut = async (recordId) => {
    try {
      const res = await fetch('/api/attendance/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId })
      });
      if (res.ok) {
        const updatedRecord = await res.json();
        setAttendance(attendance.map(a => a.id === updatedRecord.id ? updatedRecord : a));
      }
    } catch (error) {
      console.error('Clock-out failed', error);
    }
  };

  const getTodayRecord = (empId) => {
    return attendance.find(a => a.employeeId === empId);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="attendance-container">
      <div className="page-header">
        <div>
          <h2>Live Attendance Tracking</h2>
          <p className="text-muted">Monitor clock-ins and clock-outs for {new Date().toLocaleDateString()}</p>
        </div>
        <div className="attendance-stats">
          <div className="stat-badge present">
            <CheckCircle size={16} /> Present: {attendance.length}
          </div>
          <div className="stat-badge absent">
            <XCircle size={16} /> Absent: {employees.length - attendance.length}
          </div>
        </div>
      </div>

      <div className="glass-card table-container">
        <table className="glass-table">
          <thead>
            <tr>
              <th>Agent</th>
              <th>Department</th>
              <th>Status Today</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading data...</td></tr>
            ) : employees.map((emp) => {
              const record = getTodayRecord(emp.id);
              return (
                <tr key={emp.id}>
                  <td>
                    <div className="emp-info-cell">
                      <div className="avatar small">{emp.fullName.charAt(0)}</div>
                      <div className="emp-name">{emp.fullName}</div>
                    </div>
                  </td>
                  <td>{emp.department}</td>
                  <td>
                    {record ? (
                      <span className="status-badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: 'var(--success)' }}>Present</span>
                    ) : (
                      <span className="status-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}>Not Punched In</span>
                    )}
                  </td>
                  <td>{record ? formatTime(record.clockIn) : '--:--'}</td>
                  <td>{record?.clockOut ? formatTime(record.clockOut) : '--:--'}</td>
                  <td>
                    {!record ? (
                      <button className="btn btn-primary btn-sm" onClick={() => handleClockIn(emp.id)}>
                        <Clock size={16} /> Clock In
                      </button>
                    ) : !record.clockOut ? (
                      <button className="btn btn-warning btn-sm" onClick={() => handleClockOut(record.id)}>
                        <Clock size={16} /> Clock Out
                      </button>
                    ) : (
                      <span className="text-muted">Completed</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Attendance;
