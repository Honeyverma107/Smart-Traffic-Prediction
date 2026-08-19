import React, { useState, useEffect, useRef, useCallback } from 'react';

const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authTab, setAuthTab] = useState('otp'); // 'otp' or 'password'
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isGsiRendered, setIsGsiRendered] = useState(false);

  const googleBtnRef = useRef(null);

  const showNotification = useCallback((msg, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(null), 7000);
  }, []);

  const handleSendOTP = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      showNotification("Please enter your email address.", true);
      return;
    }
    console.log(`[Frontend SendOTP] Triggered at ${new Date().toISOString()} | Email: '${cleanEmail}'`);
    setEmail(cleanEmail);
    setOtp('');
    setIsLoading(true);
    setLoadingText("Sending verification code...");
    setMessage(null);

    try {
      const response = await fetch('/api/send-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });

      const data = await response.json();
      if (response.ok) {
        setOtpSent(true);
        showNotification(data.message || "Verification code sent successfully.");
      } else {
        throw new Error(data.error || "Unable to send verification code. Please try again.");
      }
    } catch (err) {
      console.error("Backend send-otp error:", err);
      setOtpSent(false);
      showNotification(err.message || "Unable to send verification code. Please try again.", true);
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  const handleVerifyOTP = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    const isOtpEmpty = !cleanOtp;
    const otpLength = cleanOtp.length;
    const timestamp = new Date().toISOString();

    console.log(`[Frontend VerifyOTP] Triggered at ${timestamp} | Target Email: '${cleanEmail}' | OTP Input Length: ${otpLength} | Is OTP State Empty: ${isOtpEmpty}`);

    if (isOtpEmpty) {
      showNotification("Please enter the 6-digit verification code.", true);
      return;
    }
    setIsLoading(true);
    setLoadingText("Verifying your code...");
    setMessage(null);

    try {
      const payload = { email: cleanEmail, otp: cleanOtp };
      console.log(`[Frontend VerifyOTP Payload] Email: '${payload.email}' | OTP Payload Length: ${payload.otp ? payload.otp.length : 0}`);

      const response = await fetch('/api/verify-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userEmail', data.email);
        showNotification(data.message || "Verification successful! Redirecting...");
        setTimeout(() => {
          onLogin(data.email, data.token);
        }, 600);
      } else {
        throw new Error(data.error || "Unable to verify the code. Please try again.");
      }
    } catch (err) {
      console.error("Backend verify-otp error:", err);
      showNotification(err.message || "Unable to verify the code. Please try again.", true);
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  const handlePasswordLogin = () => {
    if (!email || !password) {
      showNotification("Please enter both email and password.", true);
      return;
    }

    if (password !== "khushi") {
      showNotification("Incorrect password. Please try again.", true);
      return;
    }

    const token = `password_session_${Date.now()}`;
    localStorage.setItem('authToken', token);
    localStorage.setItem('userEmail', email);
    showNotification("Login successful!");
    setTimeout(() => {
      onLogin(email, token);
    }, 600);
  };

  // Real Google Sign-In Callback Handler
  const handleGoogleCredentialResponse = useCallback(async (googleResponse) => {
    if (!googleResponse || !googleResponse.credential) {
      showNotification("Failed to receive Google authentication token.", true);
      return;
    }

    const realIdToken = googleResponse.credential;
    setIsLoading(true);
    setLoadingText("Authenticating with Google...");
    setMessage(null);

    try {
      let response;
      try {
        response = await fetch('/api/google-login/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: realIdToken })
        });
      } catch (netErr) {
        response = await fetch('http://127.0.0.1:8000/api/google-login/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: realIdToken })
        });
      }

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userEmail', data.email);
        showNotification(`Signed in as ${data.email}`);
        setTimeout(() => onLogin(data.email, data.token), 600);
      } else {
        throw new Error(data.error || "Google authentication failed.");
      }
    } catch (err) {
      console.error("Backend google-login failed:", err);
      showNotification(err.message || "Failed to verify Google account.", true);
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  }, [onLogin, showNotification]);

  // Initialize Real Google Identity Services (GIS) safely
  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
    const isValidClientId = clientId && clientId.trim() !== '' && clientId !== 'your_google_client_id_here';

    if (!isValidClientId) {
      setIsGsiRendered(false);
      return;
    }

    const setupGoogleSignIn = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId.trim(),
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
            });
            setIsGsiRendered(true);
          }
        } catch (e) {
          console.warn("Google Sign-In initialization warning:", e);
        }
      }
    };

    if (window.google && window.google.accounts) {
      setupGoogleSignIn();
    } else {
      const timer = setInterval(() => {
        if (window.google && window.google.accounts) {
          setupGoogleSignIn();
          clearInterval(timer);
        }
      }, 250);
      return () => clearInterval(timer);
    }
  }, [handleGoogleCredentialResponse]);

  const handleCustomGoogleBtnClick = () => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
    const isValidClientId = clientId && clientId.trim() !== '' && clientId !== 'your_google_client_id_here';

    if (!isValidClientId) {
      showNotification("Please set a valid Google OAuth Client ID in frontend/.env (REACT_APP_GOOGLE_CLIENT_ID).", true);
      return;
    }

    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          if (googleBtnRef.current) {
            const innerBtn = googleBtnRef.current.querySelector('div[role="button"]');
            if (innerBtn) innerBtn.click();
          }
        }
      });
    } else {
      showNotification("Google Identity Services is loading. Please try again.", true);
    }
  };

  return (
    <div id="loginScreen">
      {/* Background Ambient Glows */}
      <div className="login-glow glow-blue"></div>
      <div className="login-glow glow-purple"></div>

      <div className="glass-card login-card">
        <div className="login-logo-container">
          <div className="login-logo">
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>traffic</span>
          </div>
        </div>

        <h2 className="brand-font">SMART TRAFFIC</h2>
        <p className="login-subtitle">Predict Traffic. Choose Smarter Routes.</p>

        {message && (
          <div className={`auth-alert ${isError ? 'error' : 'success'}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {isError ? 'error' : 'check_circle'}
            </span>
            <span>{message}</span>
          </div>
        )}

        {isLoading && (
          <div className="auth-loading-state">
            <span className="loading-spinner"></span>
            <span>{loadingText || 'Processing...'}</span>
          </div>
        )}

        <div className="auth-tabs">
          <button 
            className={`auth-tab ${authTab === 'otp' ? 'active' : ''}`}
            onClick={() => { setAuthTab('otp'); setMessage(null); }}
          >
            OTP Verification
          </button>
          <button 
            className={`auth-tab ${authTab === 'password' ? 'active' : ''}`}
            onClick={() => { setAuthTab('password'); setMessage(null); }}
          >
            Password Login
          </button>
        </div>

        {/* Input Fields */}
        <div className="login-input-container">
          <label>Email Address</label>
          <div className="input-field-wrapper">
            <span className="material-symbols-outlined input-field-icon">mail</span>
            <input
              type="email"
              className="login-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !otpSent && !isLoading && handleSendOTP()}
              disabled={isLoading || (authTab === 'otp' && otpSent)}
            />
          </div>
        </div>

        {authTab === 'password' ? (
          <div className="login-input-container">
            <label>Password</label>
            <div className="input-field-wrapper">
              <span className="material-symbols-outlined input-field-icon">lock</span>
              <input
                type={showPassword ? "text" : "password"}
                className="login-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordLogin()}
                disabled={isLoading}
              />
              <button 
                type="button" 
                className="password-toggle-btn" 
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>
        ) : (
          otpSent && (
            <div className="login-input-container animated-slide">
              <label>6-Digit Verification Code</label>
              <div className="input-field-wrapper">
                <span className="material-symbols-outlined input-field-icon">pin</span>
                <input
                  type="text"
                  maxLength="6"
                  className="login-input otp-field"
                  placeholder="0 0 0 0 0 0"
                  value={otp}
                  autoComplete="one-time-code"
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleVerifyOTP()}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>
          )
        )}

        {/* Submit Buttons */}
        {authTab === 'password' ? (
          <button type="button" className="login-button primary-btn" onClick={handlePasswordLogin} disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        ) : (
          !otpSent ? (
            <button type="button" className="login-button primary-btn" onClick={handleSendOTP} disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Verification OTP'}
            </button>
          ) : (
            <div className="otp-action-group">
              <button type="button" className="login-button primary-btn" onClick={handleVerifyOTP} disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify & Login'}
              </button>
              <button 
                type="button"
                className="change-email-btn"
                onClick={() => { setOtpSent(false); setOtp(''); }}
                disabled={isLoading}
              >
                Change Email Address
              </button>
            </div>
          )
        )}

        <div className="auth-divider">
          <span>or sign in with</span>
        </div>

        {/* Single Google Sign-In Container */}
        <div className="google-auth-wrapper">
          <div ref={googleBtnRef} className="google-btn-container"></div>
          
          {!isGsiRendered && (
            <button 
              type="button"
              className="google-btn" 
              onClick={handleCustomGoogleBtnClick}
              disabled={isLoading}
            >
              <img 
                src="/google.jpg" 
                alt="Google" 
                onError={(e) => { e.target.src = 'https://lh3.googleusercontent.com/COxitspgUX1sW9mO58H1Co1HS5C-1L35J7Meb-CI-Zif2a45sw4tOBglvOKSm2YvDQ'; }} 
              />
              Continue with Google
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;