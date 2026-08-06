import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, User, Calendar, CheckSquare, LogOut, Briefcase, PhoneCall, X } from 'lucide-react';
import './Sidebar.css';

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAgent = user?.role === 'AGENT';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <aside className={`sidebar glass-panel ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <img src="/logo.jpg" alt="Outvox Logo" className="logo-icon" style={{ objectFit: 'cover' }} />
          <h2 className="logo-text">Outvox<span className="text-gradient">HR</span></h2>
        </div>
        <button className="mobile-close-btn" onClick={onClose}>
          <X size={24} />
        </button>
      </div>
      
      <nav className="sidebar-nav">
        {!isAgent && (
          <>
            <NavLink to="/dashboard" className="nav-item">
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/employees" className="nav-item">
              <Users size={20} />
              <span>Employees</span>
            </NavLink>
            <NavLink to="/telecallers" className="nav-item">
              <PhoneCall size={20} />
              <span>Telecallers</span>
            </NavLink>
            <NavLink to="/tasks" className="nav-item">
              <CheckSquare size={20} />
              <span>Tasks</span>
            </NavLink>
            <NavLink to="/attendance" className="nav-item">
              <Calendar size={20} />
              <span>Attendance</span>
            </NavLink>
            <NavLink to="/recruitment" className="nav-item">
              <Briefcase size={20} />
              <span>Recruitment</span>
            </NavLink>
          </>
        )}

        {isAgent && (
          <NavLink to="/my-profile" className="nav-item">
            <User size={20} />
            <span>My Profile</span>
          </NavLink>
        )}
      </nav>
      
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="nav-item logout-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
          <LogOut size={20} className="nav-icon text-danger" />
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
