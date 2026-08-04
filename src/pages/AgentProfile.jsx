import React, { useState, useEffect } from 'react';
import { User, CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function AgentProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateContent, setUpdateContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'AGENT') {
      navigate('/login');
      return;
    }
    fetchProfile(user.id);
  }, [navigate]);

  const fetchProfile = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/agent/${id}`);
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
      } else {
        setProfile(null);
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
      const res = await fetch(`http://localhost:5000/api/agent/${user.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: updateContent })
      });
      if (res.ok) {
        const newUpdate = await res.json();
        setProfile({
          ...profile,
          dailyUpdates: [newUpdate, ...(profile.dailyUpdates || [])]
        });
        setUpdateContent('');
      }
    } catch (error) {
      console.error('Failed to submit update', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading your profile...</div>;
  if (!profile) return <div style={{ padding: '2rem', textAlign: 'center' }}>Error loading profile.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
      <div className="page-header">
        <div>
          <h2>Welcome, {profile.fullName}</h2>
          <p className="text-muted">Agent Portal - {profile.department} | {profile.designation}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        
        {/* Left Column: Updates Form & History */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={20} className="text-primary" /> Submit Daily Update
            </h3>
            <form onSubmit={handleSubmitUpdate}>
              <textarea 
                rows="4" 
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', padding: '1rem', color: 'var(--text-main)', borderRadius: '8px', marginBottom: '1rem' }}
                placeholder="What did you work on today?"
                value={updateContent}
                onChange={e => setUpdateContent(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Post Update'}
              </button>
            </form>
          </div>

          <div className="glass-card" style={{ padding: '2rem', flex: 1 }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Recent Updates</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(!profile.dailyUpdates || profile.dailyUpdates.length === 0) ? (
                <p className="text-muted">No updates submitted yet.</p>
              ) : (
                profile.dailyUpdates.map(update => (
                  <div key={update.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>{update.content}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12}/> {new Date(update.date).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Assigned Tasks */}
        <div className="glass-card" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={20} className="text-primary" /> My Assigned Tasks
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1 }}>
            {(!profile.tasks || profile.tasks.length === 0) ? (
              <p className="text-muted" style={{ textAlign: 'center', marginTop: '2rem' }}>You have no assigned tasks.</p>
            ) : (
              profile.tasks.map(task => (
                <div key={task.id} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: `4px solid ${task.priority === 'High' ? 'var(--danger)' : task.priority === 'Medium' ? 'var(--warning)' : 'var(--success)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '1.05rem' }}>{task.title}</strong>
                    <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(255,255,255,0.1)' }}>{task.status}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{task.description}</p>
                  {task.dueDate && (
                     <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                       <Clock size={14}/> Due: {new Date(task.dueDate).toLocaleDateString()}
                     </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default AgentProfile;
