import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import LoginScreen from './components/LoginScreen';
import MainContent from './components/MainContent';
import { ThemeProvider } from './ThemeContext';
import './App.css';

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setShowAuth(false);
  };

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