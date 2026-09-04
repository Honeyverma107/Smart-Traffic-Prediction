import React from 'react';
import './Navbar.css';


const Navbar = ({ activeTab, setActiveTab, isLoggedIn, userEmail, userRole, onLogout, onLoginClick }) => {
  const isTrafficPolice = isLoggedIn && userRole === 'TRAFFIC_POLICE';

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
        </nav>


      </div>

      <div className="nav-right">
        <div className="nav-status-pill">
          <span className="status-dot"></span>
          <span className="status-text">AI Engine Active</span>
        </div>

        {isLoggedIn ? (
          <div className="user-nav-section">
            <div className="user-avatar-pill" title={`${userEmail} (${isTrafficPolice ? 'Traffic Police' : 'User'})`}>
              <div className="user-avatar" style={{ background: isTrafficPolice ? '#2563eb' : 'var(--primary)' }}>
                {userEmail ? userEmail[0].toUpperCase() : 'U'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                <span className="user-email-text">{userEmail}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: isTrafficPolice ? '#2563eb' : '#059669', textTransform: 'uppercase' }}>
                  {isTrafficPolice ? '👮 TRAFFIC POLICE' : '👤 USER'}
                </span>
              </div>
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
