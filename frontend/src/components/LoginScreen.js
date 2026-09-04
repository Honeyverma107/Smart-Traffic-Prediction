import React, { useState, useEffect, useRef, useCallback } from 'react';

const LoginScreen = ({ onLogin, onBackToLanding, initialRole = 'USER' }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [selectedRole, setSelectedRole] = useState(initialRole); // 'USER' or 'TRAFFIC_POLICE'

  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isGsiRendered, setIsGsiRendered] = useState(false);

  const googleBtnRef = useRef(null);


  const showNotification = useCallback((msg, error = false) => {
    let text = "Google sign-in failed. Please try again.";
    if (typeof msg === 'string' && msg.trim() && msg !== 'undefined' && msg !== 'null') {
      text = msg;
    } else if (msg && typeof msg === 'object') {
      text = msg.message || msg.error || (typeof msg.toString === 'function' && msg.toString() !== '[object Object]' ? msg.toString() : "Google sign-in failed.");
    }
    if (text === 'undefined' || text === 'null') {
      text = "Google sign-in failed. Please try again.";
    }
    setMessage(text);
    setIsError(error);
    setTimeout(() => setMessage(null), 7000);
  }, []);

  const getValidatedClientId = useCallback(() => {
    const raw = (process.env.REACT_APP_GOOGLE_CLIENT_ID || '').toString();
    const cleaned = raw.replace(/['"]/g, '').trim();
    if (
      !cleaned ||
      cleaned === 'undefined' ||
      cleaned === 'null' ||
      cleaned === 'your_google_client_id_here'
    ) {
      return null;
    }
    return cleaned;
  }, []);

  const safeFetchJson = async (endpointPath, bodyData) => {
    const payload = JSON.stringify(bodyData);
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };

    let response;
    try {
      response = await fetch(endpointPath, { method: 'POST', headers, body: payload });
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.includes("application/json")) {
        throw new Error("Proxy fallback needed");
      }
    } catch (proxyErr) {
      try {
        const fullUrl = `http://127.0.0.1:8000${endpointPath}`;
        response = await fetch(fullUrl, { method: 'POST', headers, body: payload });
      } catch (directErr) {
        throw new Error("Unable to connect to backend server. Please verify Django is running at http://127.0.0.1:8000.");
      }
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const htmlText = await response.text();
      console.error(`Non-JSON response from ${endpointPath}:`, htmlText.slice(0, 200));
      throw new Error(`Server returned non-JSON response (${response.status}). Please verify Django backend service.`);
    }

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  };

  const handleSendOTP = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      showNotification("Please enter your email address.", true);
      return;
    }
    setEmail(cleanEmail);
    setOtp('');
    setIsLoading(true);
    setLoadingText("Sending verification code...");
    setMessage(null);

    try {
      const { ok, data } = await safeFetchJson('/api/send-otp/', { email: cleanEmail });
      if (ok) {
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

    if (!cleanOtp) {
      showNotification("Please enter the 6-digit verification code.", true);
      return;
    }
    setIsLoading(true);
    setLoadingText("Verifying your code...");
    setMessage(null);

    try {
      const { ok, data } = await safeFetchJson('/api/verify-otp/', { email: cleanEmail, otp: cleanOtp });
      if (ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userEmail', data.email);
        showNotification(data.message || "Verification successful! Redirecting...");
        setTimeout(() => {
          if (typeof onLogin === 'function') {
            onLogin(data.email, data.token, selectedRole);
          }
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
      const { ok, data } = await safeFetchJson('/api/google-login/', { token: realIdToken });
      if (ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userEmail', data.email);
        showNotification(`Signed in as ${data.email}`);
        setTimeout(() => {
          if (typeof onLogin === 'function') {
            onLogin(data.email, data.token, selectedRole);
          }
        }, 600);
      } else {

        throw new Error(data?.error || "Google authentication failed.");
      }
    } catch (err) {
      console.error("Backend google-login failed:", err);
      showNotification(err?.message || "Failed to verify Google account.", true);
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  }, [onLogin, showNotification, selectedRole]);


  useEffect(() => {
    const clientId = getValidatedClientId();
    const currentOrigin = window.location.origin;

    console.log("[Google OAuth Debug] REACT_APP_GOOGLE_CLIENT_ID loaded:", clientId ? `${clientId.slice(0, 15)}...` : 'NOT CONFIGURED');
    console.log("[Google OAuth Debug] Current App Origin (must match Authorized JS Origin in Google Console):", currentOrigin);

    if (!clientId) {
      console.warn("[Google OAuth Warning] Invalid or missing REACT_APP_GOOGLE_CLIENT_ID in environment.");
      setIsGsiRendered(false);
      return;
    }

    const setupGoogleSignIn = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
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
            console.log("[Google OAuth Success] Official Google Sign-In button rendered successfully.");
          }
        } catch (e) {
          console.warn("Google Sign-In initialization warning:", e);
        }
      }
    };

    // Ensure GIS script is present in DOM
    const scriptId = 'google-gsi-client-script';
    let scriptTag = document.getElementById(scriptId);

    if (!scriptTag && (!window.google || !window.google.accounts)) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.src = 'https://accounts.google.com/gsi/client';
      scriptTag.async = true;
      scriptTag.defer = true;
      scriptTag.onload = () => {
        console.log("[Google OAuth] Dynamic GSI script loaded.");
        setupGoogleSignIn();
      };
      document.head.appendChild(scriptTag);
    } else {
      setupGoogleSignIn();
    }

    const timer = setInterval(() => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        setupGoogleSignIn();
        clearInterval(timer);
      }
    }, 250);

    return () => clearInterval(timer);
  }, [handleGoogleCredentialResponse, getValidatedClientId]);

  const handleCustomGoogleBtnClick = () => {
    const clientId = getValidatedClientId();

    if (!clientId) {
      showNotification("Google Sign-In Client ID is not configured in frontend/.env. Please use Email OTP.", true);
      return;
    }

    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        console.log("[Google OAuth] Triggering Google prompt/authorization flow...");
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            const reason = notification.getNotDisplayedReason() || 'suppressed';
            console.warn("[Google OAuth Warning] OneTap prompt not displayed reason:", reason);
            showNotification("Google sign-in prompt blocked by browser. Please use Email OTP login.", true);
          } else if (notification.isSkippedMoment()) {
            const reason = notification.getSkippedReason() || 'skipped';
            console.warn("[Google OAuth Warning] OneTap skipped reason:", reason);
          }
        });
      } catch (err) {
        console.error("Google prompt error:", err);
        showNotification(err?.message || "Failed to initialize Google Sign-In.", true);
      }
    } else {
      showNotification("Google Identity Services is initializing. Please wait a moment...", true);
    }
  };

  return (
    <div id="loginScreen">
      {/* Background AI Smart-City & Traffic Network Layer */}
      <div className="login-bg-grid"></div>
      
      {/* City Skyline & Traffic Network SVG Artwork */}
      <div className="login-bg-routes-svg">
        <svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" className="bg-traffic-routes">
          {/* Faint City Skyline Silhouettes */}
          <path d="M 0 900 L 0 720 L 60 720 L 60 680 L 110 680 L 110 740 L 180 740 L 180 620 L 240 620 L 240 750 L 320 750 L 320 900 Z" fill="var(--skyline-fill)" opacity="0.12" />
          <path d="M 1080 900 L 1080 700 L 1140 700 L 1140 640 L 1220 640 L 1220 760 L 1300 760 L 1300 680 L 1400 680 L 1400 900 Z" fill="var(--skyline-fill)" opacity="0.12" />

          {/* Glowing Animated Route Curves */}
          <path d="M -100 350 Q 350 150 700 500 T 1500 650" fill="none" stroke="url(#routeGrad1)" strokeWidth="2.5" strokeDasharray="6 8" className="animated-bg-path-1" />
          <path d="M -100 650 Q 450 750 800 300 T 1500 250" fill="none" stroke="url(#routeGrad2)" strokeWidth="2.5" strokeDasharray="4 6" className="animated-bg-path-2" />

          {/* Node Pin Accents */}
          <circle cx="350" cy="240" r="6" fill="#10b981" opacity="0.75" />
          <circle cx="350" cy="240" r="14" fill="none" stroke="#10b981" opacity="0.3" />
          
          <circle cx="1050" cy="620" r="6" fill="#ef4444" opacity="0.75" />
          <circle cx="1050" cy="620" r="14" fill="none" stroke="#ef4444" opacity="0.3" />

          <defs>
            <linearGradient id="routeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="routeGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="login-glow glow-blue"></div>
      <div className="login-glow glow-purple"></div>

      {onBackToLanding && (
        <button type="button" className="auth-back-btn" onClick={onBackToLanding} title="Back to Home">
          <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '6px' }}>arrow_back</span> Back
        </button>
      )}

      <div className="auth-card-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
        <div className="glass-card login-card">
          {/* Minimal Traffic Light Symbol */}
          <div className="traffic-light-symbol">
            <span className="traffic-dot red"></span>
            <span className="traffic-dot yellow"></span>
            <span className="traffic-dot green pulse"></span>
          </div>

          <div className="login-brand-meta">
            <h4 className="brand-font login-brand-title">SMART TRAFFIC</h4>
            <p className="login-subtitle">AI-Powered Traffic Forecasting & Route Optimizer</p>
          </div>

          {/* AI Traffic Status Indicator */}
          <div className="ai-traffic-status-pill">
            <span className="status-live-dot"></span>
            <span>AI Traffic Intelligence Active</span>
          </div>

          <h2 className="login-card-heading">Sign In</h2>

          {/* Decorative Route Accent Line with Endpoint Dots */}
          <div className="decorative-route-line">
            <span className="route-badge-dot source" title="Source"></span>
            <span className="route-badge-path"></span>
            <span className="route-badge-dot dest" title="Destination"></span>
          </div>

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

          {/* Role Selector Pill Toggle */}
          <div className="login-role-selector" style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', margin: '16px 0', width: '100%' }}>
            <button
              type="button"
              className={`role-btn ${selectedRole === 'USER' ? 'active' : ''}`}
              onClick={() => setSelectedRole('USER')}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '9px',
                border: selectedRole === 'USER' ? '1.5px solid #2563eb' : '1px solid transparent',
                fontSize: '0.82rem',
                fontWeight: 800,
                background: selectedRole === 'USER' ? '#ffffff' : 'transparent',
                color: selectedRole === 'USER' ? '#2563eb' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>👤</span>
              <span>Commuter / User</span>
            </button>
            <button
              type="button"
              className={`role-btn ${selectedRole === 'TRAFFIC_POLICE' ? 'active' : ''}`}
              onClick={() => setSelectedRole('TRAFFIC_POLICE')}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '9px',
                border: selectedRole === 'TRAFFIC_POLICE' ? '1.5px solid #2563eb' : '1px solid transparent',
                fontSize: '0.82rem',
                fontWeight: 800,
                background: selectedRole === 'TRAFFIC_POLICE' ? '#ffffff' : 'transparent',
                color: selectedRole === 'TRAFFIC_POLICE' ? '#2563eb' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>👮</span>
              <span>Traffic Police</span>
            </button>
          </div>

          {/* Input Fields */}

          <div className="login-input-container">

            <label style={{ display: 'block', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Email Address</label>
            <div className="input-field-wrapper" style={{ position: 'relative' }}>
              <span className="material-symbols-outlined input-field-icon" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '20px', color: 'var(--text-muted)' }}>mail</span>
              <input
                type="email"
                className="login-input"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !otpSent && !isLoading && handleSendOTP()}
                disabled={isLoading || otpSent}
                style={{ width: '100%', paddingLeft: '44px', height: '52px', borderRadius: '12px', fontSize: '0.92rem' }}
              />
            </div>
          </div>

          {otpSent && (
            <div className="login-input-container animated-slide" style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>6-Digit Verification Code</label>
              <div className="input-field-wrapper" style={{ position: 'relative' }}>
                <span className="material-symbols-outlined input-field-icon" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '20px', color: 'var(--text-muted)' }}>pin</span>
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
                  style={{ width: '100%', paddingLeft: '44px', height: '52px', borderRadius: '12px', fontSize: '0.92rem' }}
                />
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          {!otpSent ? (
            <button type="button" className="login-button primary-btn" onClick={handleSendOTP} disabled={isLoading} style={{ height: '52px', borderRadius: '12px', fontSize: '0.95rem' }}>
              {isLoading ? 'Sending OTP...' : 'Send Verification OTP'}
            </button>
          ) : (
            <div className="otp-action-group">
              <button type="button" className="login-button primary-btn" onClick={handleVerifyOTP} disabled={isLoading} style={{ height: '52px', borderRadius: '12px', fontSize: '0.95rem' }}>
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
          )}

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          {/* Single Google Sign-In Container */}
          <div className="google-auth-wrapper">
            <div 
              ref={googleBtnRef} 
              className="google-btn-container"
              style={{ 
                display: isGsiRendered ? 'flex' : 'none', 
                justifyContent: 'center', 
                width: '100%',
                minHeight: '52px'
              }}
            ></div>
            
            {!isGsiRendered && (
              <button 
                type="button"
                className="google-btn google-login-btn" 
                onClick={handleCustomGoogleBtnClick}
                disabled={isLoading}
                style={{ height: '52px', borderRadius: '12px', fontSize: '0.92rem' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  className="google-login-icon"
                  style={{ width: '18px', height: '18px', minWidth: '18px', minHeight: '18px', flexShrink: 0, marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }}
                >
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isLoading ? 'Signing in...' : 'Continue with Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Trust & Security Section */}
        <div className="auth-trust-footer">
          <p className="trust-badges">🛡️ Secure &bull; Reliable &bull; Intelligent</p>
          <p className="trust-tagline">Smarter Routes, Better Journeys</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
