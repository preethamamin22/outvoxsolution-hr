import React, { useState, useEffect, useRef } from 'react';
import { Send, FileText, CheckCircle2, X, Printer, Download } from 'lucide-react';

function Recruitment() {
  const [offers, setOffers] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [offerHtml, setOfferHtml] = useState(null); // HTML of the generated offer
  const [formData, setFormData] = useState({
    candidateName: '', candidateEmail: '', role: '', salary: ''
  });
  const previewRef = useRef(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await fetch('/api/recruitment/offers');
      const data = await res.json();
      if (Array.isArray(data)) setOffers(data);
    } catch (error) {
      console.error('Failed to fetch offers', error);
    }
  };

  const handleSendOffer = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch('/api/recruitment/send-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setOffers([data.offer, ...offers]);
        setOfferHtml(data.offerHtml); // Open preview modal
        setFormData({ candidateName: '', candidateEmail: '', role: '', salary: '' });
      } else {
        setError(data.error || 'Failed to generate offer letter.');
      }
    } catch (err) {
      setError('Could not connect to server. Make sure the backend is running.');
    } finally {
      setIsSending(false);
    }
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offer Letter - Outvox Solution</title>
          <style>
            body { margin: 0; padding: 20px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${offerHtml}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offer Letter - Outvox Solution</title>
          <meta charset="UTF-8">
          <style>body { margin: 20px; }</style>
        </head>
        <body>${offerHtml}</body>
      </html>
    `], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offer-letter-${formData.candidateName || 'candidate'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="page-header">
        <div>
          <h2>Recruitment & Offer Letters</h2>
          <p className="text-muted">Generate and download professional offer letters instantly.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* Left Side: Form */}
        <div className="glass-card" style={{ flex: 1, minWidth: '280px', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={20} className="text-primary" /> Generate Offer Letter
          </h3>
          
          {error && (
            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--danger)', marginBottom: '1.5rem', borderRadius: '4px' }}>
              <p style={{ color: 'var(--danger)', margin: 0, fontSize: '0.9rem' }}>⚠️ {error}</p>
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
              <input required type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="Telecaller" />
            </div>
            <div className="form-group">
              <label>Offered Incentive / Salary</label>
              <input required type="text" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} placeholder="₹500 per successful conversion" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSending}>
              {isSending ? '⏳ Generating...' : '📄 Generate & Preview Offer Letter'}
            </button>
          </form>
        </div>

        {/* Right Side: History */}
        <div className="glass-card" style={{ flex: 1.5, minWidth: '280px', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} className="text-primary" /> Generated Offers History
          </h3>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {offers.length === 0 ? (
              <p className="text-muted" style={{ textAlign: 'center', marginTop: '2rem' }}>No offers generated yet. Fill the form to create your first offer letter.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {offers.map(offer => (
                  <div key={offer.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '1.1rem' }}>{offer.candidateName}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={14}/> {offer.status}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Role: {offer.role}</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Email: {offer.candidateEmail}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Sent: {new Date(offer.sentAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Offer Letter Preview Modal */}
      {offerHtml && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem'
        }}>
          <div style={{
            background: '#1a1a2e', borderRadius: '16px', width: '100%', maxWidth: '900px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 80px rgba(0,0,0,0.7)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #ff5722, #e64a19)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} color="white" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Offer Letter Preview</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Review before printing or downloading</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  onClick={handlePrint}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(79, 70, 229, 0.2)', border: '1px solid rgba(79, 70, 229, 0.5)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  <Printer size={16} /> Print
                </button>
                <button
                  onClick={handleDownloadHtml}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'linear-gradient(135deg, #ff5722, #e64a19)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                >
                  <Download size={16} /> Download
                </button>
                <button
                  onClick={() => setOfferHtml(null)}
                  style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable offer letter */}
            <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>
              <div
                ref={previewRef}
                dangerouslySetInnerHTML={{ __html: offerHtml }}
                style={{ borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Recruitment;
