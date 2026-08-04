import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(''); // using 'email' state for username
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.role === 'AGENT') {
          navigate('/my-profile');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-container">
      <div className="login-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      
      <div className="login-card glass-card">
        <div className="login-header">
          <div className="logo-icon-large">OS</div>
          <h2>Welcome Back</h2>
          <p>Sign in to OutvoxHR Dashboard</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-message" style={{ color: 'var(--danger)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}
          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input 
              type="text" 
              placeholder="Username" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input 
              type="password" 
              placeholder="Password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div className="login-options">
            <label className="checkbox-container">
              <input type="checkbox" />
              <span className="checkmark"></span>
              Remember Me
            </label>
            <a href="#" className="forgot-link">Forgot Password?</a>
          </div>
          
          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            <LogIn size={20} />
            {loading ? 'Logging in...' : 'Login to Dashboard'}
          </button>
        </form>
        
        <div className="divider">
          <span>OR</span>
        </div>
        
        <div className="social-login">
          <button className="btn btn-glass social-btn">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoft/microsoft-original.svg" alt="Microsoft" width={20} />
            Microsoft
          </button>
          <button className="btn btn-glass social-btn">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" alt="Google" width={20} />
            Google
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
