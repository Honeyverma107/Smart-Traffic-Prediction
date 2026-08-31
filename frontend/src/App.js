import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import LoginScreen from './components/LoginScreen';
import MainContent from './components/MainContent';
import SplashScreen from './components/SplashScreen';
import { ThemeProvider } from './ThemeContext';
import './App.css';

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const savedUser = localStorage.getItem('userEmail') || localStorage.getItem('authToken') || localStorage.getItem('user');
    return !!savedUser;
  });
  const [showAuth, setShowAuth] = useState(false);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const handleLogin = (userData) => {
    if (userData && userData.email) {
      localStorage.setItem('userEmail', userData.email);
    } else {
      localStorage.setItem('userEmail', 'user@smarttraffic.ai');
    }
    setIsLoggedIn(true);
    setShowAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('auth_user');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');

    try {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }
    } catch (e) {
      console.log("Google session cleanup error:", e);
    }

    setIsLoggedIn(false);
    setShowAuth(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <div className="App">
      {isLoggedIn ? (
        <MainContent onLogout={handleLogout} />
      ) : showAuth ? (
        <LoginScreen onLogin={handleLogin} onBackToLanding={() => setShowAuth(false)} />
      ) : (
        <LandingPage onGetStarted={() => setShowAuth(true)} />
      )}
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