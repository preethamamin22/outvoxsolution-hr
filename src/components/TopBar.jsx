import { Bell, Search, Moon, Sun, MessageSquare, Menu } from 'lucide-react';
import './TopBar.css';

function TopBar({ onMenuClick }) {
  return (
    <header className="topbar glass-panel">
      <div className="search-container">
        <button className="mobile-menu-btn" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        <Search className="search-icon" size={20} />
        <input 
          type="text" 
          placeholder="Global Search (Employees, Departments, Files...)" 
          className="search-input"
        />
        <div className="search-shortcut">⌘K</div>
      </div>
      
      <div className="topbar-actions">
        <button className="icon-btn" aria-label="Messages">
          <MessageSquare size={20} />
          <span className="badge">3</span>
        </button>
        
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={20} />
          <span className="badge">5</span>
        </button>
        
        <button className="icon-btn" aria-label="Toggle Theme">
          <Moon size={20} />
        </button>
        
        <div className="profile-dropdown">
          <div className="profile-info">
            <span className="profile-name">Alex Morgan</span>
            <span className="profile-role">HR Director</span>
          </div>
          <img 
            src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop" 
            alt="Profile" 
            className="profile-avatar"
          />
        </div>
      </div>
    </header>
  );
}

export default TopBar;
