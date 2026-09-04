import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import LoginScreen from './components/LoginScreen';
import MainContent from './components/MainContent';
import SplashScreen from './components/SplashScreen';
import TrafficPoliceControlCenter from './components/TrafficPoliceControlCenter';
import Navbar from './components/Navbar';
import { ThemeProvider } from './ThemeContext';
import './App.css';

// Layout 1: Normal User / Public Application Layout
function PublicUserLayout({ 
  activeTab, 
  setActiveTab, 
  isLoggedIn, 
  userEmail, 
  userRole, 
  onLogout, 
  onLoginClick, 
  onOpenTrafficPolice 
}) {
  return (
    <div className="public-user-layout" style={{ width: '100%', height: '100%' }}>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isLoggedIn={isLoggedIn}
        userEmail={userEmail}
        userRole={userRole}
        onLogout={onLogout}
        onLoginClick={onLoginClick}
      />
      {activeTab === 'workspace' ? (
        <MainContent initialViewTab="navigation" onLogout={onLogout} />
      ) : (
        <LandingPage 
          onGetStarted={() => setActiveTab('workspace')} 
          onOpenTrafficPolice={onOpenTrafficPolice}
        />
      )}
    </div>
  );
}

// Layout 2: Traffic Police Application Layout (with Traffic Police Sidebar)
function TrafficPoliceLayout({ onBackToNavigation }) {
  return (
    <div className="traffic-police-layout" style={{ width: '100%', height: '100%' }}>
      <TrafficPoliceControlCenter onBackToNavigation={onBackToNavigation} />
    </div>
  );
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('landing');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || 'USER');

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const savedUser = localStorage.getItem('userEmail') || localStorage.getItem('authToken') || localStorage.getItem('user');
    return !!savedUser;
  });
  const [showAuth, setShowAuth] = useState(false);
  const [initialAuthRole, setInitialAuthRole] = useState('USER');

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const handleLogin = (param1, param2, role) => {
    let email = 'user@smarttraffic.ai';
    if (typeof param1 === 'string') {
      email = param1;
    } else if (param1 && param1.email) {
      email = param1.email;
    }
    const finalRole = role || (param1 && param1.role) || 'USER';

    localStorage.setItem('userEmail', email);
    localStorage.setItem('userRole', finalRole);
    setIsLoggedIn(true);
    setUserRole(finalRole);
    setShowAuth(false);

    if (finalRole === 'TRAFFIC_POLICE') {
      setActiveTab('traffic-police');
    } else {
      setActiveTab('workspace');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('auth_user');
    sessionStorage.clear();

    try {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }
    } catch (e) {
      console.log("Google session cleanup error:", e);
    }

    setIsLoggedIn(false);
    setUserRole('USER');
    setShowAuth(false);
    setActiveTab('landing');
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  const userEmail = localStorage.getItem('userEmail') || 'user@smarttraffic.ai';
  const isTrafficPolice = isLoggedIn && userRole === 'TRAFFIC_POLICE';
  const isTrafficPoliceRoute = activeTab === 'traffic-police' || activeTab === 'challan';
  const isTrafficPoliceView = isTrafficPoliceRoute && isTrafficPolice;

  // ROUTE & LAYOUT SEPARATION:
  // 1. Auth Modal / Login Screen (No sidebars mounted)
  if (showAuth) {
    return (
      <div className="App">
        <LoginScreen 
          initialRole={initialAuthRole} 
          onLogin={handleLogin} 
          onBackToLanding={() => setShowAuth(false)} 
        />
      </div>
    );
  }

  // 2. Traffic Police Application Layout (Mounted ONLY for authenticated Traffic Police on traffic-police routes)
  if (isTrafficPoliceView) {
    return (
      <div className="App">
        <TrafficPoliceLayout onBackToNavigation={() => setActiveTab('landing')} />
      </div>
    );
  }

  // 3. Normal User / Public Application Layout (Overview, Navigation, Route Planning)
  return (
    <div className="App">
      <PublicUserLayout 
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'workspace' && !isLoggedIn) {
            setInitialAuthRole('USER');
            setShowAuth(true);
            setActiveTab('landing');
          } else if ((tab === 'traffic-police' || tab === 'challan') && !isTrafficPolice) {
            setInitialAuthRole('TRAFFIC_POLICE');
            setShowAuth(true);
          } else {
            setShowAuth(false);
            setActiveTab(tab);
          }
        }}
        isLoggedIn={isLoggedIn}
        userEmail={userEmail}
        userRole={userRole}
        onLogout={handleLogout}
        onLoginClick={() => {
          setInitialAuthRole('USER');
          setShowAuth(true);
        }}
        onOpenTrafficPolice={() => {
          if (isTrafficPolice) {
            setActiveTab('traffic-police');
          } else {
            setInitialAuthRole('TRAFFIC_POLICE');
            setShowAuth(true);
          }
        }}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;