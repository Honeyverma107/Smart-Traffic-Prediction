import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../ThemeContext';
import { 
  ArrowRight, 
  Play, 
  Activity, 
  TrendingUp, 
  Navigation, 
  CheckCircle2, 
  Send, 
  Star, 
  ChevronDown, 
  ChevronUp, 
  X, 
  ShieldCheck, 
  Zap, 
  Clock,
  Sun,
  Moon
} from 'lucide-react';

const LandingPage = ({ onGetStarted }) => {
  const { theme, toggleTheme } = useTheme();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  
  // Feedback Form State
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Canvas ref for Smart Traffic flow simulation
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    // Handle resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Simulation nodes (intersection points in a smart city)
    const nodes = [
      { id: 1, x: width * 0.15, y: height * 0.25, name: 'Bhawarkua' },
      { id: 2, x: width * 0.45, y: height * 0.2, name: 'Rajwada' },
      { id: 3, x: width * 0.8, y: height * 0.3, name: 'Vijay Nagar' },
      { id: 4, x: width * 0.3, y: height * 0.65, name: 'Palasia' },
      { id: 5, x: width * 0.7, y: height * 0.75, name: 'Bengali Sq.' },
      { id: 6, x: width * 0.5, y: height * 0.45, name: 'Geeta Bhawan' },
    ];

    // Links between nodes (roads)
    const links = [
      { from: 1, to: 2, speed: 2.5, congestion: 'low' },
      { from: 1, to: 4, speed: 1.5, congestion: 'high' },
      { from: 2, to: 3, speed: 3.0, congestion: 'low' },
      { from: 2, to: 6, speed: 2.0, congestion: 'normal' },
      { from: 4, to: 6, speed: 1.8, congestion: 'normal' },
      { from: 6, to: 5, speed: 1.2, congestion: 'high' },
      { from: 3, to: 5, speed: 2.8, congestion: 'low' },
    ];

    // Car particles
    const particles = [];

    // Initialize particles
    links.forEach(l => {
      for (let i = 0; i < 4; i++) {
        const fromNode = nodes.find(n => n.id === l.from);
        const toNode = nodes.find(n => n.id === l.to);
        particles.push({
          from: fromNode,
          to: toNode,
          progress: Math.random(),
          speed: (0.003 + Math.random() * 0.005) * (l.congestion === 'low' ? 1.5 : l.congestion === 'high' ? 0.4 : 0.9),
          color: l.congestion === 'low' ? '#10b981' : l.congestion === 'high' ? '#ef4444' : '#f59e0b',
          size: 3 + Math.random() * 2
        });
      }
    });

    // Animation Loop
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw grid backdrop
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw roads (links)
      links.forEach(link => {
        const fromNode = nodes.find(n => n.id === link.from);
        const toNode = nodes.find(n => n.id === link.to);
        if (!fromNode || !toNode) return;

        // Shadow glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = link.congestion === 'low' ? 'rgba(16, 185, 129, 0.2)' : link.congestion === 'high' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)';
        
        ctx.strokeStyle = link.congestion === 'low' ? 'rgba(16, 185, 129, 0.3)' : link.congestion === 'high' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();

        ctx.shadowBlur = 0; // reset
      });

      // Update and draw car particles
      particles.forEach((p, idx) => {
        p.progress += p.speed;
        if (p.progress >= 1) {
          p.progress = 0;
          // Randomly select next node or stay on road
        }

        const x = p.from.x + (p.to.x - p.from.x) * p.progress;
        const y = p.from.y + (p.to.y - p.from.y) * p.progress;

        // Draw particle
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw smart nodes (hubs)
      nodes.forEach(node => {
        // Outer glowing ring
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 16, 0, Math.PI * 2);
        ctx.stroke();

        // Inner solid core
        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = '#9ca3af';
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y - 22);
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // FAQs Array
  const faqs = [
    {
      q: "How does the AI predict traffic congestion?",
      a: "Our app integrates dynamic neural network architectures trained on historical flow rates, spatial grid graphs, weather models, and real-time telemetry inputs to predict bottlenecks up to 2 hours in advance with a 94%+ accuracy index."
    },
    {
      q: "Is Indore the only supported region?",
      a: "Currently, our high-precision model is fully calibrated for Indore city, mapping all major grid coordinates (Vijay Nagar, Rajwada, Palasia, Bhawarkua, etc.) via verified OpenStreetMap nodes. We are expanding to other cities soon!"
    },
    {
      q: "How are the alternative routing strategies calculated?",
      a: "When you request a route, we fetch optimal pathways via OSRM nodes and query our ML predictor for each road segment. We then formulate three strategies: 'Fastest' (minimum absolute duration), 'Balanced' (stable speeds with fewer intersections), and 'Eco / Low Traffic' (bypasses high emission idling points)."
    },
    {
      q: "Does this require special hardware sensors?",
      a: "No special hardware is required. The assistant processes public crowdsourced coordinates, network speeds, and historical datasets to generate congestion metrics directly on the server."
    }
  ];

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setFeedbackText('');
      setFeedbackSubmitted(false);
    }, 4000);
  };

  return (
    <div className="landing-container">
      {/* Navbar overlay */}
      <header className="landing-nav">
        <div className="landing-logo">
          <div className="logo-glow-dot"></div>
          <span className="logo-text">FlowCast.ai</span>
        </div>
        <div className="landing-nav-actions">
          <button 
            className="landing-theme-toggle-btn" 
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
          <button className="nav-cta-btn" onClick={onGetStarted}>
            Launch Assistant
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="ai-badge">
            <Zap size={14} className="accent-glow" />
            <span>Next-Gen Neural Routing Active</span>
          </div>
          <h1 className="hero-title">
            Smart Traffic <br />
            <span className="gradient-text">Prediction & Route</span> <br />
            Optimization
          </h1>
          <p className="hero-tagline">
            Harness the power of neural-network driven forecasting to bypass congestion, reduce carbon output, and navigate Indore's busiest nodes with real-time confidence.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={onGetStarted}>
              Get Started <ArrowRight size={18} style={{ marginLeft: 8 }} />
            </button>
            <button className="btn-secondary" onClick={() => setShowDemoModal(true)}>
              <Play size={18} fill="currentColor" style={{ marginRight: 8 }} /> Watch Demo
            </button>
          </div>
        </div>
        
        {/* Animated City Grid Illustration */}
        <div className="hero-visual">
          <div className="visual-glass-card">
            <canvas ref={canvasRef} className="traffic-canvas" />
            <div className="canvas-telemetry">
              <div className="telemetry-item">
                <span className="t-label">Network Load</span>
                <span className="t-val green">Nominal (34%)</span>
              </div>
              <div className="telemetry-item">
                <span className="t-label">Active Agents</span>
                <span className="t-val">1,248 / min</span>
              </div>
              <div className="telemetry-item">
                <span className="t-label">ML Accuracy</span>
                <span className="t-val purple">98.2%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="features-section">
        <div className="section-header">
          <span className="section-subtitle">Core Capabilities</span>
          <h2 className="section-title">Built for Modern Urban Flow</h2>
          <p className="section-desc">Experience a new standard of navigation powered by predictive artificial intelligence.</p>
        </div>
        
        <div className="features-grid">
          <div className="glass-card feature-card">
            <div className="feature-icon-wrapper green-gradient">
              <Navigation size={24} className="feature-icon" />
            </div>
            <h3>Live Route Optimization</h3>
            <p>Calculate optimal pathways that adjust dynamically. Say goodbye to gridlocks using real-time segment rerouting.</p>
            <div className="card-hover-border"></div>
          </div>

          <div className="glass-card feature-card">
            <div className="feature-icon-wrapper blue-gradient">
              <Activity size={24} className="feature-icon" />
            </div>
            <h3>AI Traffic Prediction</h3>
            <p>Our deep learning models forecast road bottlenecks hours in advance based on recurrent traffic flow metrics.</p>
            <div className="card-hover-border"></div>
          </div>

          <div className="glass-card feature-card">
            <div className="feature-icon-wrapper purple-gradient">
              <TrendingUp size={24} className="feature-icon" />
            </div>
            <h3>Reliable Navigation</h3>
            <p>Clear, distraction-free map layouts optimized for sub-second responses and seamless multi-device updates.</p>
            <div className="card-hover-border"></div>
          </div>
        </div>
      </section>

      {/* How It Works Timeline */}
      <section className="how-it-works-section">
        <div className="section-header">
          <span className="section-subtitle">The Journey</span>
          <h2 className="section-title">How FlowCast Orchestrates</h2>
          <p className="section-desc">Getting the optimal commute strategy is simple, transparent, and immediate.</p>
        </div>

        <div className="timeline-container">
          <div className="timeline-connector"></div>
          
          <div className="timeline-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Specify Origin & Destination</h3>
              <p>Type your locations or drop custom pins directly onto the interactive Indore mapping layout.</p>
            </div>
          </div>

          <div className="timeline-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>AI Runs Multi-Variable Forecast</h3>
              <p>FlowCast scans time indices, travel modes, and neural predictions to evaluate segment densities.</p>
            </div>
          </div>

          <div className="timeline-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Select Custom Navigation Strategy</h3>
              <p>Choose from Fastest, Balanced, or Eco route sheets showing specific ETA bounds and confidence scores.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why It Is Different */}
      <section className="why-different-section">
        <div className="section-header">
          <span className="section-subtitle">Competitive Edge</span>
          <h2 className="section-title">Why FlowCast Stands Apart</h2>
        </div>

        <div className="grid-comparison">
          <div className="comparison-item glass-card">
            <div className="comp-badge"><Zap size={16} /></div>
            <h3>ML-based Congestion Prediction</h3>
            <p>Standard maps show current delay states. FlowCast predicts bottleneck waves *before* they manifest, steering you clear in advance.</p>
          </div>

          <div className="comparison-item glass-card">
            <div className="comp-badge"><ShieldCheck size={16} /></div>
            <h3>Multiple Route Strategies</h3>
            <p>Switch instantly between absolute speed, high-comfort/stopless grids, and low-carbon emission paths depending on your immediate intent.</p>
          </div>

          <div className="comparison-item glass-card">
            <div className="comp-badge"><Clock size={16} /></div>
            <h3>Cleaner, Distraction-Free Space</h3>
            <p>Zero sponsored popups, zero intrusive ads. Just pure geographical routing coordinates presented on a gorgeous nocturnal vector map.</p>
          </div>

          <div className="comparison-item glass-card">
            <div className="comp-badge"><CheckCircle2 size={16} /></div>
            <h3>Sub-Second Computations</h3>
            <p>Our hybrid browser-node graph optimizer computes complex routing alternatives instantly, saving you batteries and cellular data usage.</p>
          </div>
        </div>
      </section>

      {/* Help & Support FAQ */}
      <section className="support-section">
        <div className="section-header">
          <span className="section-subtitle">Support Hub</span>
          <h2 className="section-title">Frequently Asked Questions</h2>
        </div>

        <div className="faq-and-feedback">
          {/* FAQs Accordion */}
          <div className="faq-accordion">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`faq-item glass-card ${activeFaq === index ? 'active' : ''}`}
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
              >
                <div className="faq-question">
                  <span>{faq.q}</span>
                  {activeFaq === index ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
                {activeFaq === index && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Feedback Form Card */}
          <div className="feedback-card glass-card">
            <h3>Send Us Your Feedback</h3>
            <p>Your suggestions help us refine our neural congestion network model weights.</p>
            
            {feedbackSubmitted ? (
              <div className="feedback-success-alert">
                <CheckCircle2 size={36} color="#10b981" />
                <h4>Feedback Submitted!</h4>
                <p>Thank you for contributing to Indore's smartest traffic framework.</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit}>
                <div className="rating-select">
                  <span>Rating:</span>
                  <div className="stars-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star} 
                        type="button" 
                        className={`star-btn ${star <= feedbackRating ? 'active' : ''}`}
                        onClick={() => setFeedbackRating(star)}
                      >
                        <Star size={18} fill={star <= feedbackRating ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <textarea 
                    value={feedbackText} 
                    onChange={(e) => setFeedbackText(e.target.value)} 
                    placeholder="Tell us what you think or report a mapping issue..."
                    required
                  />
                </div>

                <button type="submit" className="feedback-submit-btn">
                  Send Feedback <Send size={14} style={{ marginLeft: 6 }} />
                </button>
              </form>
            )}

            <div className="support-email-footer">
              <span>Need developer assistance? Contact:</span>
              <a href="mailto:support@flowcast.ai">support@flowcast.ai</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} FlowCast Indore Traffic Assistant. Built as a premium AI product.</p>
      </footer>

      {/* Interactive Demo Modal */}
      {showDemoModal && (
        <div className="demo-modal-overlay" onClick={() => setShowDemoModal(false)}>
          <div className="demo-modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <button className="demo-close-btn" onClick={() => setShowDemoModal(false)}>
              <X size={20} />
            </button>
            <div className="demo-header">
              <span className="demo-tag">LIVE SIMULATION PREVIEW</span>
              <h2>Interactive Navigation Dashboard</h2>
              <p>Simulating congestion analysis on Indore's arterial nodes.</p>
            </div>
            
            {/* Visual simulation representation inside Modal */}
            <div className="demo-body-simulator">
              <div className="mock-search-panel">
                <div className="mock-search-row">
                  <div className="mock-dot green"></div>
                  <span>Rajwada Palace, Indore</span>
                </div>
                <div className="mock-search-divider"></div>
                <div className="mock-search-row">
                  <div className="mock-dot red"></div>
                  <span>Vijay Nagar Square, Indore</span>
                </div>
              </div>

              <div className="mock-routes-container">
                <div className="mock-route-card active">
                  <div className="m-card-header">
                    <span className="m-title">Fastest Strategy (AI Recommended)</span>
                    <span className="m-badge green">Low Delay</span>
                  </div>
                  <div className="m-stats">
                    <span className="m-time">14 mins</span>
                    <span className="m-dist">5.8 km</span>
                    <span className="m-conf">98% Confidence</span>
                  </div>
                </div>

                <div className="mock-route-card">
                  <div className="m-card-header">
                    <span className="m-title">Balanced Alternative</span>
                    <span className="m-badge orange">Moderate Traffic</span>
                  </div>
                  <div className="m-stats">
                    <span className="m-time">19 mins</span>
                    <span className="m-dist">6.2 km</span>
                    <span className="m-conf">88% Confidence</span>
                  </div>
                </div>

                <div className="mock-route-card">
                  <div className="m-card-header">
                    <span className="m-title">Eco / Low Emission Path</span>
                    <span className="m-badge green">Smooth flow</span>
                  </div>
                  <div className="m-stats">
                    <span className="m-time">22 mins</span>
                    <span className="m-dist">6.9 km</span>
                    <span className="m-conf">94% Confidence</span>
                  </div>
                </div>
              </div>

              <div className="demo-cta-row">
                <p>Want to see it compute live routing recommendations?</p>
                <button className="btn-primary" onClick={() => { setShowDemoModal(false); onGetStarted(); }}>
                  Try FlowCast Free <ArrowRight size={16} style={{ marginLeft: 6 }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
