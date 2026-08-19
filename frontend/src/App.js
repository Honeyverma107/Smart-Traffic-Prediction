import React, { useState } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import LoginScreen from './components/LoginScreen';
import MainContent from './components/MainContent';
import SplashScreen from './components/SplashScreen';
import './App.css';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const email = localStorage.getItem('userEmail');
    const token = localStorage.getItem('authToken');
    return Boolean(email && token);
  });

  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem('userEmail') || '';
  });

  const [activeTab, setActiveTab] = useState('landing');
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLogin = (email, token) => {
    if (email) {
      localStorage.setItem('userEmail', email);
      setUserEmail(email);
    }
    if (token) {
      localStorage.setItem('authToken', token);
    }
    setIsLoggedIn(true);
    setShowLoginModal(false);
    setActiveTab('workspace');
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setUserEmail('');
    setActiveTab('landing');
    setShowLoginModal(false);
  };

  const handleStartNavigation = () => {
    if (isLoggedIn) {
      setActiveTab('workspace');
    } else {
      setShowLoginModal(true);
    }
  };

  return (
    <div className="App">
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLoggedIn={isLoggedIn}
        userEmail={userEmail}
        onLogout={handleLogout}
        onLoginClick={() => setShowLoginModal(true)}
      />

      <main className="app-main-content">
        {!isLoggedIn && (showLoginModal || activeTab !== 'landing') ? (
          <LoginScreen onLogin={handleLogin} />
        ) : activeTab === 'landing' ? (
          <LandingPage onStartNavigation={handleStartNavigation} />
        ) : (
          <MainContent onLogout={handleLogout} />
        )}
      </main>
    </div>
  );
}

export default App;