import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onFinish }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Hold complete intro sequence for 2.0s before starting exit fade-out
    const timer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2000);

    // After 0.4s exit fade-out (total 2.4s), notify parent to unmount splash screen
    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2400);

    return () => {
      clearTimeout(timer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      if (onFinish) onFinish();
    }, 300);
  };

  return (
    <div className={`splash-overlay ${isFadingOut ? 'fade-out' : ''}`}>
      {/* Background Ambient Glow & Neural Network Grid */}
      <div className="splash-bg-glow glow-1"></div>
      <div className="splash-bg-glow glow-2"></div>
      <div className="splash-grid-pattern"></div>

      {/* SVG City Map & Animated Traffic Routes */}
      <div className="splash-map-container">
        <svg className="splash-svg-map" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
          <defs>
            {/* Gradients for animated route lines */}
            <linearGradient id="routeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="routeGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="routeGrad3" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="1" />
              <stop offset="100%" stopColor="#e879f9" stopOpacity="0.4" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Abstract City Grid Roads Base Layer */}
          <g className="city-road-base" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="2" fill="none">
            <line x1="100" y1="150" x2="900" y2="150" />
            <line x1="100" y1="300" x2="900" y2="300" />
            <line x1="100" y1="450" x2="900" y2="450" />
            <line x1="200" y1="50" x2="200" y2="550" />
            <line x1="500" y1="50" x2="500" y2="550" />
            <line x1="800" y1="50" x2="800" y2="550" />
            <circle cx="500" cy="300" r="180" />
            <circle cx="500" cy="300" r="320" />
          </g>

          {/* AI Neural Network Background Node Lines */}
          <g className="ai-network-lines" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1" strokeDasharray="3 5" fill="none">
            <line x1="200" y1="150" x2="350" y2="240" />
            <line x1="350" y1="240" x2="500" y2="150" />
            <line x1="500" y1="150" x2="650" y2="240" />
            <line x1="650" y1="240" x2="800" y2="150" />
            <line x1="200" y1="450" x2="350" y2="360" />
            <line x1="350" y1="360" x2="500" y2="450" />
            <line x1="500" y1="450" x2="650" y2="360" />
            <line x1="650" y1="360" x2="800" y2="450" />
          </g>

          {/* AI Interconnected Nodes */}
          <g className="ai-nodes">
            {[
              { cx: 200, cy: 150 }, { cx: 350, cy: 240 }, { cx: 500, cy: 150 },
              { cx: 650, cy: 240 }, { cx: 800, cy: 150 }, { cx: 200, cy: 450 },
              { cx: 350, cy: 360 }, { cx: 500, cy: 450 }, { cx: 650, cy: 360 }, { cx: 800, cy: 450 }
            ].map((node, i) => (
              <g key={i} className={`ai-node-group node-delay-${i % 4}`}>
                <circle cx={node.cx} cy={node.cy} r="4" fill="#38bdf8" opacity="0.7" />
                <circle cx={node.cx} cy={node.cy} r="12" fill="none" stroke="#38bdf8" strokeWidth="1" className="node-pulse-ring" />
              </g>
            ))}
          </g>

          {/* Active Animated Primary Route Paths */}
          <path
            id="routePath1"
            d="M 100 150 L 350 150 C 450 150, 500 200, 500 300 C 500 400, 550 450, 650 450 L 900 450"
            fill="none"
            stroke="url(#routeGrad1)"
            strokeWidth="4"
            filter="url(#glow)"
            className="animated-route-line route-1"
          />
          <path
            id="routePath2"
            d="M 200 550 L 200 350 C 200 250, 300 150, 500 150 C 700 150, 800 250, 800 350 L 800 550"
            fill="none"
            stroke="url(#routeGrad2)"
            strokeWidth="3.5"
            filter="url(#glow)"
            className="animated-route-line route-2"
          />
          <path
            id="routePath3"
            d="M 100 450 L 350 450 C 420 450, 500 400, 500 300 C 500 200, 580 150, 650 150 L 900 150"
            fill="none"
            stroke="url(#routeGrad3)"
            strokeWidth="3.5"
            filter="url(#glow)"
            className="animated-route-line route-3"
          />

          {/* Moving Traffic Vehicle Dots along paths */}
          <g className="traffic-vehicle-dots">
            <circle r="4" fill="#60a5fa" filter="url(#glow)" className="traffic-dot">
              <animateMotion dur="2.0s" repeatCount="indefinite" path="M 100 150 L 350 150 C 450 150, 500 200, 500 300 C 500 400, 550 450, 650 450 L 900 450" />
            </circle>
            <circle r="3" fill="#38bdf8" filter="url(#glow)" className="traffic-dot">
              <animateMotion dur="2.0s" begin="0.8s" repeatCount="indefinite" path="M 100 150 L 350 150 C 450 150, 500 200, 500 300 C 500 400, 550 450, 650 450 L 900 450" />
            </circle>
            <circle r="4.5" fill="#34d399" filter="url(#glow)" className="traffic-dot">
              <animateMotion dur="2.4s" repeatCount="indefinite" path="M 200 550 L 200 350 C 200 250, 300 150, 500 150 C 700 150, 800 250, 800 350 L 800 550" />
            </circle>
          </g>
        </svg>
      </div>

      {/* Central Content Box */}
      <div className="splash-center-content">
        <div className="splash-logo-wrapper">
          <div className="splash-logo-glow-ring"></div>
          <div className="splash-logo-box">
            <span className="material-symbols-outlined splash-brand-icon">traffic</span>
          </div>
        </div>

        {/* Text Details */}
        <div className="splash-text-container">
          <h1 className="splash-title">SMART TRAFFIC</h1>
          <p className="splash-subtitle">AI-POWERED TRAFFIC PREDICTION</p>
        </div>

        {/* Bottom Loading Bar / Status Indicator */}
        <div className="splash-status-container">
          <div className="splash-progress-track">
            <div className="splash-progress-fill"></div>
          </div>
          <span className="splash-status-text">Initializing AI Intelligence Engine...</span>
        </div>
      </div>

      {/* Skip Button */}
      <button className="splash-skip-btn" onClick={handleSkip} title="Skip intro animation">
        <span>Skip</span>
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  );
};

export default SplashScreen;
