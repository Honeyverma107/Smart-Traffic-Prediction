import React from 'react';
import { useTheme } from '../ThemeContext';

const Navbar = ({ activeTab, setActiveTab, isLoggedIn, userEmail, onLogout, onLoginClick }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="navbar">
      <div className="nav-left">
        <div className="nav-brand" onClick={() => setActiveTab('landing')}>
          <div className="brand-logo-box">
            <span className="material-symbols-outlined brand-icon">traffic</span>
          </div>
          <div className="brand-text-container">
            <span className="brand-title">SMART TRAFFIC</span>
            <span className="brand-tagline">AI ROUTE INTELLIGENCE</span>
          </div>
        </div>

        <nav className="nav-links">
          <button 
            className={`nav-link ${activeTab === 'landing' ? 'active' : ''}`}
            onClick={() => setActiveTab('landing')}
          >
            <span className="material-symbols-outlined">home</span>
            Overview
          </button>
          <button 
            className={`nav-link ${activeTab === 'workspace' ? 'active' : ''}`}
            onClick={() => setActiveTab('workspace')}
          >
            <span className="material-symbols-outlined">map</span>
            Navigation
          </button>
          <button 
            className={`nav-link ${activeTab === 'challan' ? 'active' : ''}`}
            onClick={() => setActiveTab('challan')}
          >
            <span className="material-symbols-outlined">gavel</span>
            Auto Challan
          </button>
        </nav>
      </div>

      <div className="nav-right">
        <div className="nav-status-pill">
          <span className="status-dot"></span>
          <span className="status-text">AI Engine Active</span>
        </div>

        {/* Dark / Light Mode Toggle Button */}
        <button 
          type="button"
          className="theme-toggle-btn" 
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        {isLoggedIn ? (
          <div className="user-nav-section">
            <div className="user-avatar-pill" title={userEmail}>
              <div className="user-avatar">
                {userEmail ? userEmail[0].toUpperCase() : 'U'}
              </div>
              <span className="user-email-text">{userEmail}</span>
            </div>
            <button className="nav-logout-btn" onClick={onLogout} title="Log Out">
              <span className="material-symbols-outlined">logout</span>
              <span className="logout-text">Logout</span>
            </button>
          </div>
        ) : (
          <button className="nav-login-btn" onClick={onLoginClick}>
            <span className="material-symbols-outlined">login</span>
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
