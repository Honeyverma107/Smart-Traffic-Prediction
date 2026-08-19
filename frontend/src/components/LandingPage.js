import React, { useState } from 'react';
import './LandingPage.css';

const LandingPage = ({ onStartNavigation }) => {
  // State for FAQ accordion toggle
  const [expandedFaq, setExpandedFaq] = useState(null);

  // State for Feedback form
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;
    console.log('User Feedback Submitted:', {
      rating,
      name: feedbackName,
      email: feedbackEmail,
      message: feedbackMessage,
      timestamp: new Date().toISOString()
    });
    setFeedbackSubmitted(true);
  };

  const resetFeedbackForm = () => {
    setFeedbackSubmitted(false);
    setFeedbackMessage('');
    setFeedbackName('');
    setFeedbackEmail('');
    setRating(5);
  };

  const faqItems = [
    {
      q: "How does the traffic prediction work?",
      a: "The system utilizes Machine Learning models trained on historical traffic pattern data, segment speeds, time of day, and day of week features to forecast congestion levels across road segments before you depart."
    },
    {
      q: "What data does the system use?",
      a: "The project uses road network graphs, historical traffic velocity logs, time-based pattern distributions, and vehicle counts extracted via computer vision."
    },
    {
      q: "How does vehicle detection contribute to traffic prediction?",
      a: "Computer vision object detection counts and classifies vehicles (cars, motorcycles, buses, trucks) from demonstration video inputs, providing density observations to update route congestion estimates."
    },
    {
      q: "What is the 'Right Time to Go' feature?",
      a: "The 'Right Time to Go' algorithm evaluates candidate departure windows across a 1-2 hour horizon using historical traffic curves and current observations to recommend departure times that minimize overall commute duration."
    },
    {
      q: "Does the system use Google Maps or Google Traffic API?",
      a: "No. The system operates independently using open-source network topology and custom-trained machine learning models for complete data privacy and architectural autonomy."
    },
    {
      q: "Is the traffic video real-time?",
      a: "The current demonstration uses a project traffic video as a simulation/demo source for vehicle detection. It should not be interpreted as a live CCTV feed."
    },
    {
      q: "Which routes can the system analyze?",
      a: "The system supports route queries across the entire mapped urban road network (Indore Metro Region), computing Fastest, Balanced, and Low-Traffic route options."
    }
  ];

  return (
    <div className="landing-container">
      {/* Ambient Background Glows */}
      <div className="landing-ambient-glow glow-1"></div>
      <div className="landing-ambient-glow glow-2"></div>

      {/* ==========================================================================
         1. HERO SECTION
         ========================================================================== */}
      <section className="hero-section">
        {/* Subtle SVG Grid Lines Canvas Background */}
        <svg className="hero-bg-canvas" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <g stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" fill="none">
            <line x1="0" y1="200" x2="1200" y2="200" />
            <line x1="0" y1="400" x2="1200" y2="400" />
            <line x1="0" y1="600" x2="1200" y2="600" />
            <line x1="300" y1="0" x2="300" y2="800" />
            <line x1="600" y1="0" x2="600" y2="800" />
            <line x1="900" y1="0" x2="900" y2="800" />
          </g>
          {/* Animated Route Curve */}
          <path
            d="M 100 650 Q 400 200, 600 400 T 1100 150"
            fill="none"
            stroke="rgba(56, 189, 248, 0.2)"
            strokeWidth="3"
            strokeDasharray="10 10"
          />
        </svg>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot"></span>
            <span>AI-POWERED TRAFFIC INTELLIGENCE & ROUTE OPTIMIZATION</span>
          </div>

          <h1 className="hero-title">
            Smart Traffic Prediction <br />
            <span className="gradient-text">& Route Optimization</span>
          </h1>

          <p className="hero-subtitle">
            Predict traffic congestion, compare route conditions, and choose a better time to travel using machine learning, traffic-pattern analysis, and vehicle detection.
          </p>

          <div className="hero-cta-group">
            <button className="cta-button primary-cta" onClick={onStartNavigation}>
              <span className="material-symbols-outlined">near_me</span>
              Get Started
            </button>
            <button className="cta-button secondary-cta" onClick={() => scrollToSection('capabilitiesSection')}>
              <span className="material-symbols-outlined">explore</span>
              Explore Capabilities
            </button>
          </div>
        </div>
      </section>

      {/* ==========================================================================
         2. CORE CAPABILITIES SECTION
         ========================================================================== */}
      <section id="capabilitiesSection" className="capabilities-section">
        <div className="landing-section-header">
          <div className="landing-section-badge">CORE CAPABILITIES</div>
          <h2 className="landing-section-title">Built for Smarter Urban Mobility</h2>
          <p className="landing-section-subtitle">
            Explore the core functional features engineered into the Smart Traffic platform.
          </p>
        </div>

        <div className="capabilities-grid">
          <div className="overview-glass-card capability-card">
            <div className="card-icon-box cyan">
              <span className="material-symbols-outlined">auto_graph</span>
            </div>
            <h3 className="card-title">AI Traffic Prediction</h3>
            <p className="card-text">
              Machine Learning models analyze historical traffic patterns, time attributes, and road segment features to predict congestion levels prior to your trip.
            </p>
          </div>

          <div className="overview-glass-card capability-card">
            <div className="card-icon-box emerald">
              <span className="material-symbols-outlined">alt_route</span>
            </div>
            <h3 className="card-title">Multi-Route Analysis</h3>
            <p className="card-text">
              Evaluate alternative route options with live color-coded segment speed and delay overlays.
            </p>
          </div>

          <div className="overview-glass-card capability-card">
            <div className="card-icon-box violet">
              <span className="material-symbols-outlined">directions_car</span>
            </div>
            <h3 className="card-title">Vehicle Detection</h3>
            <p className="card-text">
              Automated vehicle classification extracts count metrics for cars, bikes, buses, and trucks from demonstration traffic sources.
            </p>
            <span className="card-notice-tag">
              <span className="material-symbols-outlined">info</span> Demo Traffic Source
            </span>
          </div>

          <div className="overview-glass-card capability-card">
            <div className="card-icon-box amber">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <h3 className="card-title">Right Time to Go</h3>
            <p className="card-text">
              Analyzes historical congestion trends combined with recent traffic observations to recommend the most efficient departure window for your route.
            </p>
          </div>

          <div className="overview-glass-card capability-card">
            <div className="card-icon-box blue">
              <span className="material-symbols-outlined">traffic</span>
            </div>
            <h3 className="card-title">Dynamic Signal Timing</h3>
            <p className="card-text">
              Calculates adaptive green light phase durations for intersections based on real-time vehicle queue density to optimize traffic flow.
            </p>
          </div>

          <div className="overview-glass-card capability-card">
            <div className="card-icon-box rose">
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <h3 className="card-title">Traffic Pattern Analysis</h3>
            <p className="card-text">
              Evaluates historical speed and volume dataset metrics to model congestion variations across peak rush hours and off-peak times.
            </p>
          </div>
        </div>
      </section>

      {/* ==========================================================================
         3. DEMO VIDEO SECTION
         ========================================================================== */}
      <section id="demoVideoSection" className="demo-section">
        <div className="landing-section-header">
          <div className="landing-section-badge">SYSTEM DEMO</div>
          <h2 className="landing-section-title">See the System in Action</h2>
          <p className="landing-section-subtitle">
            Traffic Detection & Prediction Demonstration
          </p>
        </div>

        <div className="demo-card-container">
          <div className="demo-video-wrapper">
            <video
              className="demo-video-player"
              controls
              loop
              muted
              playsInline
              src="/traffic_video.mp4"
            >
              Your browser does not support the video tag.
            </video>
          </div>

          <div className="demo-notice-bar">
            <div className="demo-badge-group">
              <span className="demo-badge amber">
                <span className="material-symbols-outlined">movie</span> Demo Traffic Source
              </span>
            </div>
            <p className="demo-disclaimer">
              Notice: The current demonstration uses a project traffic video as a simulation/demo source for vehicle detection. It should not be interpreted as a live CCTV feed.
            </p>
          </div>
        </div>
      </section>

      {/* ==========================================================================
         4. FAQ SECTION
         ========================================================================== */}
      <section id="faqSection" className="faq-section">
        <div className="landing-section-header">
          <div className="landing-section-badge">QUESTIONS & ANSWERS</div>
          <h2 className="landing-section-title">Frequently Asked Questions</h2>
          <p className="landing-section-subtitle">
            Clear details regarding project technology, data sources, and capabilities.
          </p>
        </div>

        <div className="faq-list">
          {faqItems.map((item, index) => (
            <div key={index} className="faq-item">
              <button className="faq-question-btn" onClick={() => toggleFaq(index)}>
                <span>{item.q}</span>
                <span className={`material-symbols-outlined faq-icon ${expandedFaq === index ? 'expanded' : ''}`}>
                  expand_more
                </span>
              </button>
              {expandedFaq === index && (
                <div className="faq-answer">
                  <p>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ==========================================================================
         5. USER FEEDBACK SECTION
         ========================================================================== */}
      <section id="feedbackSection" className="feedback-section">
        <div className="landing-section-header">
          <div className="landing-section-badge">USER INPUT</div>
          <h2 className="landing-section-title">Send Us Your Feedback</h2>
          <p className="landing-section-subtitle">
            Your feedback helps us improve the Smart Traffic Prediction experience.
          </p>
        </div>

        <div className="overview-glass-card feedback-card">
          {!feedbackSubmitted ? (
            <form className="feedback-form" onSubmit={handleFeedbackSubmit}>
              <div className="rating-select-group">
                <span className="rating-label">Rate Your Experience</span>
                <div className="star-rating-box">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      className={`star-btn ${(hoverRating || rating) >= star ? 'active' : ''}`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    >
                      <span className="material-symbols-outlined">star</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="feedback-input-row">
                <div className="feedback-field-group">
                  <label htmlFor="fb-name">Your Name (Optional)</label>
                  <input
                    id="fb-name"
                    type="text"
                    className="feedback-input"
                    placeholder="John Doe"
                    value={feedbackName}
                    onChange={(e) => setFeedbackName(e.target.value)}
                  />
                </div>

                <div className="feedback-field-group">
                  <label htmlFor="fb-email">Your Email (Optional)</label>
                  <input
                    id="fb-email"
                    type="email"
                    className="feedback-input"
                    placeholder="john@example.com"
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="feedback-field-group">
                <label htmlFor="fb-message">Your Feedback / Suggestion *</label>
                <textarea
                  id="fb-message"
                  className="feedback-textarea"
                  placeholder="Share your thoughts about route accuracy, feature ideas, or user experience..."
                  required
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                />
              </div>

              <button type="submit" className="cta-button primary-cta feedback-submit-btn">
                <span className="material-symbols-outlined">send</span>
                Submit Feedback
              </button>
            </form>
          ) : (
            <div className="feedback-success-card">
              <div className="success-check-icon">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <h3 className="success-title">Thank You for Your Feedback!</h3>
              <p className="success-desc">
                Your response has been recorded. We appreciate your insights as we continue optimizing our Smart Traffic Prediction algorithms.
              </p>
              <button className="cta-button secondary-cta" onClick={resetFeedbackForm}>
                Send Another Response
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ==========================================================================
         6. PROFESSIONAL FOOTER
         ========================================================================== */}
      <footer className="overview-footer">
        <div className="footer-content-inner">
          <div className="footer-brand-col">
            <div className="footer-logo-row">
              <div className="footer-logo-box">
                <span className="material-symbols-outlined">traffic</span>
              </div>
              <span className="footer-brand-name">Smart Traffic Prediction</span>
            </div>
            <p className="footer-brand-desc">
              AI-powered traffic analysis and route optimization for smarter urban mobility. Predict gridlock, optimize departure timing, and select ideal commute routes.
            </p>
            <div className="footer-tech-stack-row">
              <span className="tech-badge">React 18</span>
              <span className="tech-badge">Python Django</span>
              <span className="tech-badge">Traffic Intelligence</span>
              <span className="tech-badge">OpenStreetMap</span>
            </div>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-col-title">Navigation</h4>
            <button className="footer-link" onClick={() => scrollToSection('capabilitiesSection')}>Capabilities</button>
            <button className="footer-link" onClick={() => scrollToSection('demoVideoSection')}>System Demo</button>
            <button className="footer-link" onClick={() => scrollToSection('faqSection')}>FAQ</button>
            <button className="footer-link" onClick={() => scrollToSection('feedbackSection')}>Send Feedback</button>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-col-title">Actions</h4>
            <button className="footer-link" onClick={onStartNavigation}>Start Navigation</button>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <span>© 2026 Smart Traffic Prediction. All rights reserved.</span>
          <span>Built for Smarter Urban Mobility & Traffic Intelligence.</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
