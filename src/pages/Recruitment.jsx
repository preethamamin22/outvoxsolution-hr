import React, { useState, useEffect } from 'react';
import { Send, FileText, CheckCircle2 } from 'lucide-react';

function Recruitment() {
  const [offers, setOffers] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [formData, setFormData] = useState({
    candidateName: '', candidateEmail: '', role: '', salary: ''
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/recruitment/offers');
      const data = await res.json();
      setOffers(data);
    } catch (error) {
      console.error('Failed to fetch offers', error);
    }
  };

  const handleSendOffer = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setSuccessMsg(null);
    try {
      const res = await fetch('http://localhost:5000/api/recruitment/send-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setOffers([data.offer, ...offers]);
        setSuccessMsg(data.previewUrl);
        setFormData({ candidateName: '', candidateEmail: '', role: '', salary: '' });
      }
    } catch (error) {
      console.error('Failed to send offer', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="page-header">
        <div>
          <h2>Recruitment & Offer Letters</h2>
          <p className="text-muted">Generate and send offer letters in one click.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        
        {/* Left Side: Form */}
        <div className="glass-card" style={{ flex: 1, padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={20} className="text-primary" /> Send New Offer
          </h3>
          
          {successMsg && (
            <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderLeft: '4px solid var(--success)', marginBottom: '1.5rem', borderRadius: '4px' }}>
              <p style={{ color: 'var(--success)', fontWeight: 'bold' }}>Offer Sent Successfully!</p>
              <a href={successMsg} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>
                Preview Email HTML
              </a>
            </div>
          )}

          <form onSubmit={handleSendOffer}>
            <div className="form-group">
              <label>Candidate Name</label>
              <input required type="text" value={formData.candidateName} onChange={e => setFormData({...formData, candidateName: e.target.value})} placeholder="Jane Doe" />
            </div>
            <div className="form-group">
              <label>Candidate Email</label>
              <input required type="email" value={formData.candidateEmail} onChange={e => setFormData({...formData, candidateEmail: e.target.value})} placeholder="jane@example.com" />
            </div>
            <div className="form-group">
              <label>Role / Position</label>
              <input required type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="Senior React Developer" />
            </div>
            <div className="form-group">
              <label>Offered Salary</label>
              <input required type="text" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} placeholder="$120,000 / year" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSending}>
              {isSending ? 'Generating & Sending...' : 'Generate & Send Offer Letter'}
            </button>
          </form>
        </div>

        {/* Right Side: History */}
        <div className="glass-card" style={{ flex: 1.5, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} className="text-primary" /> Sent Offers History
          </h3>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {offers.length === 0 ? (
              <p className="text-muted" style={{ textAlign: 'center', marginTop: '2rem' }}>No offers sent yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {offers.map(offer => (
                  <div key={offer.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '1.1rem' }}>{offer.candidateName}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={14}/> {offer.status}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Role: {offer.role}</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Email: {offer.candidateEmail}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Sent: {new Date(offer.sentAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Recruitment;
