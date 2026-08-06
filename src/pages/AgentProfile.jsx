import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Clock, MessageSquare, LogIn, LogOut, Edit2, X, Save, User, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AgentProfile.css';

function AgentProfile() {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateContent, setUpdateContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', email: '' });
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [attendanceId, setAttendanceId] = useState(null);
  const [clockLoading, setClockLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('updates'); // 'updates' | 'tasks'

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'AGENT') {
      navigate('/login');
      return;
    }
    fetchProfile(user.id);

    const handleProfileUpdate = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user'));
      if (updatedUser && updatedUser.id) {
        fetchProfile(updatedUser.id);
      }
    };
    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('userProfileUpdated', handleProfileUpdate);
  }, [navigate]);

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;

      try {
        const res = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: profile.email,
            name: profile.fullName,
            avatar: base64String
          })
        });

        if (res.ok) {
          const updatedUser = await res.json();
          setProfile({ ...profile, avatar: updatedUser.avatar });
          
          const userObj = JSON.parse(localStorage.getItem('user') || '{}');
          userObj.avatar = updatedUser.avatar;
          localStorage.setItem('user', JSON.stringify(userObj));
          
          window.dispatchEvent(new Event('userProfileUpdated'));
        }
      } catch (err) {
        console.error('Failed to upload avatar', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchProfile = async (id) => {
    try {
      const res = await fetch(`/api/agent/${id}`);
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
        setEditForm({ fullName: data.fullName, email: data.email });
        const todayStr = new Date().toDateString();
        const activeRecord = data.attendance?.find(a => new Date(a.date).toDateString() === todayStr && !a.clockOut);
        if (activeRecord) {
          setIsClockedIn(true);
          setAttendanceId(activeRecord.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    if (!updateContent.trim()) return;
    setIsSubmitting(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await fetch(`/api/agent/${user.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: updateContent })
      });
      if (res.ok) {
        const newUpdate = await res.json();
        setProfile({ ...profile, dailyUpdates: [newUpdate, ...(profile.dailyUpdates || [])] });
        setUpdateContent('');
      }
    } catch (error) {
      console.error('Failed to submit update', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await fetch(`/api/agent/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        const updatedAgent = await res.json();
        setProfile({ ...profile, fullName: updatedAgent.fullName, email: updatedAgent.email });
        setIsEditing(false);
        user.name = updatedAgent.fullName;
        user.username = updatedAgent.email;
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Failed to update profile', error);
    }
  };

  const handleClockIn = async () => {
    setClockLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await fetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: user.id })
      });
      if (res.ok) {
        const record = await res.json();
        setIsClockedIn(true);
        setAttendanceId(record.id);
      }
    } catch (error) {
      console.error('Clock-in failed', error);
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!attendanceId) return;
    setClockLoading(true);
    try {
      const res = await fetch('/api/attendance/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId: attendanceId })
      });
      if (res.ok) {
        setIsClockedIn(false);
        setAttendanceId(null);
      }
    } catch (error) {
      console.error('Clock-out failed', error);
    } finally {
      setClockLoading(false);
    }
  };

  if (loading) return (
    <div className="agent-loading">
      <div className="agent-spinner" />
      <p>Loading your profile...</p>
    </div>
  );

  if (!profile) return (
    <div className="agent-loading">
      <p style={{ color: 'var(--danger)' }}>Error loading profile. Please try again.</p>
    </div>
  );

  const initials = profile.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AG';

  return (
    <div className="agent-page">

      {/* Hero Profile Card */}
      <div className="agent-hero glass-card">
        <div className="agent-hero-left">
          <div className="agent-avatar-wrapper" onClick={handleAvatarClick} title="Click to change profile picture" style={{ cursor: 'pointer', position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
            {profile.avatar ? (
              <img src={profile.avatar} alt="Profile" className="agent-avatar" style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: '50%' }} />
            ) : (
              <div className="agent-avatar" style={{ margin: 0 }}>{initials}</div>
            )}
            <div className="avatar-hover-overlay" style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justify-content: 'center',
              opacity: 0,
              transition: 'opacity 0.2s',
            }}>
              <Camera size={18} color="white" />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
              style={{ display: 'none' }} 
              accept="image/*"
            />
          </div>
          <div className="agent-info">
            <h2 className="agent-name">{profile.fullName}</h2>
            <p className="agent-dept">{profile.designation} &bull; {profile.department}</p>
            <p className="agent-email">{profile.email}</p>
            <span className={`agent-status-badge ${profile.status === 'Active' ? 'active' : 'inactive'}`}>
              {profile.status}
            </span>
          </div>
        </div>
        <div className="agent-hero-actions">
          <button
            className={`clock-btn ${isClockedIn ? 'clocked-in' : 'clocked-out'}`}
            onClick={isClockedIn ? handleClockOut : handleClockIn}
            disabled={clockLoading}
          >
            {clockLoading ? (
              <span className="agent-spinner small" />
            ) : isClockedIn ? (
              <><LogOut size={20} /> Clock Out</>
            ) : (
              <><LogIn size={20} /> Clock In</>
            )}
          </button>
          <button className="edit-btn" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? <><X size={16} /> Cancel</> : <><Edit2 size={16} /> Edit</>}
          </button>
        </div>
      </div>

      {/* Edit Profile Form */}
      {isEditing && (
        <div className="glass-card agent-edit-card">
          <h3><User size={18} /> Edit Profile</h3>
          <form onSubmit={handleUpdateProfile} className="agent-edit-form">
            <div className="agent-form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={editForm.fullName}
                onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                required
              />
            </div>
            <div className="agent-form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={editForm.email}
                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary save-btn">
              <Save size={16} /> Save Changes
            </button>
          </form>
        </div>
      )}

      {/* Tab Navigation (mobile-friendly) */}
      <div className="agent-tabs">
        <button
          className={`agent-tab ${activeTab === 'updates' ? 'active' : ''}`}
          onClick={() => setActiveTab('updates')}
        >
          <MessageSquare size={16} /> Daily Updates
        </button>
        <button
          className={`agent-tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <CheckCircle2 size={16} /> My Tasks
          {profile.tasks?.length > 0 && (
            <span className="tab-badge">{profile.tasks.length}</span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="agent-tab-content">

        {/* Updates Tab */}
        {activeTab === 'updates' && (
          <div className="agent-updates-section">
            <div className="glass-card agent-update-form-card">
              <h3><MessageSquare size={18} /> Submit Today's Update</h3>
              <form onSubmit={handleSubmitUpdate}>
                <textarea
                  rows={4}
                  className="agent-textarea"
                  placeholder="What did you work on today? How many calls? Any issues?"
                  value={updateContent}
                  onChange={e => setUpdateContent(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%' }}>
                  {isSubmitting ? 'Posting...' : '📤 Post Update'}
                </button>
              </form>
            </div>

            <div className="glass-card agent-updates-list">
              <h3>Recent Updates</h3>
              {(!profile.dailyUpdates || profile.dailyUpdates.length === 0) ? (
                <p className="agent-empty">No updates submitted yet. Add your first one above!</p>
              ) : (
                <div className="updates-feed">
                  {profile.dailyUpdates.map(update => (
                    <div key={update.id} className="update-item">
                      <p className="update-content">{update.content}</p>
                      <span className="update-time">
                        <Clock size={12} /> {new Date(update.date).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="glass-card agent-tasks-list">
            <h3><CheckCircle2 size={18} /> My Assigned Tasks</h3>
            {(!profile.tasks || profile.tasks.length === 0) ? (
              <p className="agent-empty">No tasks assigned yet. Check back soon!</p>
            ) : (
              <div className="tasks-feed">
                {profile.tasks.map(task => (
                  <div
                    key={task.id}
                    className="task-item"
                    style={{ borderLeftColor: task.priority === 'High' ? 'var(--danger)' : task.priority === 'Medium' ? 'var(--warning)' : 'var(--success)' }}
                  >
                    <div className="task-header">
                      <strong className="task-title">{task.title}</strong>
                      <span className={`task-status ${task.status.toLowerCase().replace(' ', '-')}`}>{task.status}</span>
                    </div>
                    {task.description && <p className="task-desc">{task.description}</p>}
                    <div className="task-meta">
                      <span className={`task-priority priority-${task.priority?.toLowerCase()}`}>{task.priority}</span>
                      {task.dueDate && (
                        <span className="task-due">
                          <Clock size={12} /> Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

export default AgentProfile;
