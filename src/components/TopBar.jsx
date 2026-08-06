import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Moon, Sun, MessageSquare, Menu, Camera } from 'lucide-react';
import './TopBar.css';

function TopBar({ onMenuClick }) {
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [isLight, setIsLight] = useState(localStorage.getItem('theme') === 'light');

  useEffect(() => {
    if (isLight) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [isLight]);

  // Sync state if user object updates in other components (e.g. Profile edit)
  useEffect(() => {
    const handleProfileUpdate = () => {
      setUser(JSON.parse(localStorage.getItem('user') || '{}'));
    };
    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('userProfileUpdated', handleProfileUpdate);
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isLight;
    setIsLight(nextTheme);
    localStorage.setItem('theme', nextTheme ? 'light' : 'dark');
  };

  const handleAvatarClick = (e) => {
    // Avoid triggering if clicking wrapper area, target image or wrapper
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
            email: user.username,
            name: user.name,
            avatar: base64String
          })
        });

        if (res.ok) {
          const updatedUser = await res.json();
          const newUserObj = {
            ...user,
            avatar: updatedUser.avatar
          };
          localStorage.setItem('user', JSON.stringify(newUserObj));
          setUser(newUserObj);
          window.dispatchEvent(new Event('userProfileUpdated'));
        }
      } catch (err) {
        console.error('Failed to upload avatar', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const displayName = user?.name || 'Preetham';
  const displayRole = user?.role === 'ADMIN' ? 'Admin' : user?.role === 'AGENT' ? 'Agent' : 'Admin';
  const avatarSrc = user?.avatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop";

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
        
        <button className="icon-btn" aria-label="Toggle Theme" onClick={toggleTheme}>
          {isLight ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        <div className="profile-dropdown" onClick={handleAvatarClick} title="Click to change profile picture">
          <div className="profile-info">
            <span className="profile-name">{displayName}</span>
            <span className="profile-role">{displayRole}</span>
          </div>
          <div className="avatar-wrapper">
            <img 
              src={avatarSrc} 
              alt="Profile" 
              className="profile-avatar"
            />
            <div className="avatar-hover-overlay">
              <Camera size={14} color="white" />
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
            style={{ display: 'none' }} 
            accept="image/*"
          />
        </div>
      </div>
    </header>
  );
}

export default TopBar;
