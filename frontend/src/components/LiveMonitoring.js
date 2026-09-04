import React from 'react';
import { Camera, AlertTriangle, Play, Square, Cpu, Eye, Send, Activity, FileText, CheckCircle2, Clock } from 'lucide-react';

const LiveMonitoring = ({
  t,
  challans,
  isAnalyzing,
  setIsAnalyzing,
  signalState,
  handleToggleSignal,
  handleScanVideo,
  currentViolation,
  selectedViolation,
  isViolationAlertActive,
  currentTime,
  videoRef,
  videoError,
  handleVideoCanPlay,
  handleVideoError,
  setSelectedViolation,
  setShowChallanModal,
  navigateToTab,
  timePeriodFilter = 'This Month'
}) => {
  // DYNAMIC PERIOD METRICS DRIVEN BY HEADER CALENDAR FILTER
  const periodMetrics = {
    'Today': { total: 95, redLight: 33, pending: 22 },
    'This Week': { total: 680, redLight: 224, pending: 142 },
    'This Month': { total: challans.length > 0 ? challans.length : 2842, redLight: 910, pending: 542 },
    'This Year': { total: 32450, redLight: 9735, pending: 5900 },
    'Custom': { total: 1420, redLight: 482, pending: 310 }
  };
  const activeMetrics = periodMetrics[timePeriodFilter] || periodMetrics['This Month'];

  return (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <div style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: '10px' }}>
      <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: t.textPrimary }}>
        LIVE MONITORING & REAL-TIME AI ENFORCEMENT
      </h2>
      <span style={{ fontSize: '0.78rem', color: t.textSecondary }}>Vijay Nagar Junction Camera 01 Surveillance & Automated Violation Engine</span>
    </div>

    {/* Compact Status Bar */}
    <div style={{
      background: t.bgSurface,
      border: `1px solid ${t.border}`,
      borderRadius: '8px',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '0.78rem',
      boxShadow: t.shadow
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Activity size={15} color={t.success} />
        <span style={{ fontWeight: 600, color: t.textPrimary }}>SYSTEM OPERATIONAL</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: t.textSecondary, fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.success }}></span>
          <span>Camera Online</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.success }}></span>
          <span>AI Detection Active</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.success }}></span>
          <span>ANPR Connected</span>
        </div>
        <div style={{ color: t.textMuted }}>
          Last Event: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>

    {/* KPI Summary Cards Driven by Date Range */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
      <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '16px', boxShadow: t.shadow, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.65rem', color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>TOTAL AI CHALLANS</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: t.textPrimary, marginTop: '4px' }}>{activeMetrics.total.toLocaleString()}</div>
          <span style={{ fontSize: '0.7rem', color: t.textSecondary, marginTop: '2px', display: 'block' }}>Total Processed Records ({timePeriodFilter})</span>
        </div>
        <div style={{ background: t.bgElevated, padding: '7px', borderRadius: '6px', border: `1px solid ${t.border}` }}><FileText size={16} color={t.textMuted} /></div>
      </div>

      <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '16px', boxShadow: t.shadow, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.65rem', color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>RED LIGHT VIOLATIONS</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: t.textPrimary, marginTop: '4px' }}>{activeMetrics.redLight.toLocaleString()}</div>
          <span style={{ fontSize: '0.7rem', color: t.textSecondary, marginTop: '2px', display: 'block' }}>Detected Infractions ({timePeriodFilter})</span>
        </div>
        <div style={{ background: t.dangerBg, padding: '7px', borderRadius: '6px', border: `1px solid ${t.dangerBorder}` }}><AlertTriangle size={16} color={t.danger} /></div>
      </div>

      <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '16px', boxShadow: t.shadow, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.65rem', color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>PENDING AI REVIEW</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: t.textPrimary, marginTop: '4px' }}>{activeMetrics.pending.toLocaleString()}</div>
          <span style={{ fontSize: '0.7rem', color: t.textSecondary, marginTop: '2px', display: 'block' }}>Awaiting Verification ({timePeriodFilter})</span>
        </div>
        <div style={{ background: t.warningBg, padding: '7px', borderRadius: '6px', border: `1px solid ${t.warningBorder}` }}><Clock size={16} color={t.warning} /></div>
      </div>

      <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '16px', boxShadow: t.shadow, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.65rem', color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>ANPR ENGINE</span>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: t.success, marginTop: '6px' }}>ACTIVE</div>
          <span style={{ fontSize: '0.7rem', color: t.textSecondary, marginTop: '2px', display: 'block' }}>Automatic Number Plate Recognition Active</span>
        </div>
        <div style={{ background: t.successBg, padding: '7px', borderRadius: '6px', border: `1px solid ${t.successBorder}` }}><CheckCircle2 size={16} color={t.success} /></div>
      </div>
    </div>

    {/* Main 2-Column Command Layout */}
    <div style={{ display: 'grid', gridTemplateColumns: '60% 38%', gap: '2%', alignItems: 'start' }}>
      {/* Left Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Live Surveillance Player */}
        <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '16px', boxShadow: t.shadow }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={16} color={t.textMuted} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: t.textPrimary }}>CAM-01 | VIJAY NAGAR JUNCTION</span>
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: t.successBg, color: t.success, border: `1px solid ${t.successBorder}`, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.success }}></span> LIVE
            </span>
          </div>

          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '6px', overflow: 'hidden', background: '#080C14', border: `1px solid ${t.border}` }}>
            <video
              ref={videoRef}
              src="/ai_challan_violation_chrome.mp4"
              controls
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onCanPlay={handleVideoCanPlay}
              onLoadedData={handleVideoCanPlay}
              onError={handleVideoError}
              style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            >
              <source src="/ai_challan_violation_chrome.mp4" type="video/mp4" />
              <source src="/media/ai_challan_violation_chrome.mp4" type="video/mp4" />
            </video>

            {videoError && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: t.bgElevated, color: t.textSecondary, gap: '8px', padding: '20px', textAlign: 'center' }}>
                <AlertTriangle size={28} color={t.warning} />
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: t.textPrimary }}>Camera Feed Unavailable</span>
                <span style={{ fontSize: '0.72rem', color: t.textMuted, maxWidth: '300px' }}>Unable to stream video from <code>/ai_challan_violation.mp4</code>.</span>
                <button type="button" onClick={() => { handleVideoCanPlay(); if (videoRef.current) { videoRef.current.load(); videoRef.current.play().catch(() => {}); } }} style={{ marginTop: '4px', padding: '5px 12px', borderRadius: '4px', background: t.primaryBg, border: `1px solid ${t.primaryBorder}`, color: t.primary, fontWeight: 700, fontSize: '0.74rem', cursor: 'pointer' }}>Retry Feed Connection</button>
              </div>
            )}

            <div style={{ position: 'absolute', top: '55%', left: 0, right: 0, height: '2px', background: signalState === 'RED' ? t.danger : t.success, zIndex: 2, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '10px' }}>
              <span style={{ background: signalState === 'RED' ? t.danger : t.success, color: '#ffffff', fontSize: '0.58rem', fontWeight: 700, padding: '2px 6px', borderRadius: '3px', transform: 'translateY(-50%)', pointerEvents: 'auto' }}>STOP LINE Y=0.55</span>
            </div>

            {isViolationAlertActive && (
              <div style={{ position: 'absolute', top: '38%', left: '26%', width: '175px', height: '100px', border: `1.5px solid ${t.danger}`, borderRadius: '4px', zIndex: 3, pointerEvents: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px' }}>
                <span style={{ background: t.danger, color: '#ffffff', fontSize: '0.58rem', fontWeight: 700, padding: '1px 5px', borderRadius: '2px', alignSelf: 'flex-start' }}>RED LIGHT VIOLATION (Track #{currentViolation?.tracking_id || 17})</span>
                <span style={{ background: 'rgba(0, 0, 0, 0.85)', color: '#ffffff', fontSize: '0.56rem', fontWeight: 500, padding: '1px 5px', borderRadius: '2px', alignSelf: 'flex-end' }}>{currentViolation?.vehicle_type || 'Car'}</span>
              </div>
            )}

            <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0, 0, 0, 0.75)', padding: '3px 8px', borderRadius: '4px', color: '#ffffff', fontSize: '0.64rem', fontWeight: 500, zIndex: 4, pointerEvents: 'none' }}>
              CAM 01 — VIJAY NAGAR SQUARE
            </div>
          </div>
        </div>

        {/* Signal & Analysis Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '14px', boxShadow: t.shadow }}>
            <span style={{ fontSize: '0.64rem', fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>SIGNAL CONTROL</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => handleToggleSignal('RED')} style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: signalState === 'RED' ? `1px solid ${t.danger}` : `1px solid ${t.border}`, background: signalState === 'RED' ? t.danger : t.bgElevated, color: signalState === 'RED' ? '#ffffff' : t.textSecondary, fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer' }}>🔴 Red Signal</button>
              <button type="button" onClick={() => handleToggleSignal('GREEN')} style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: signalState === 'GREEN' ? `1px solid ${t.success}` : `1px solid ${t.border}`, background: signalState === 'GREEN' ? t.success : t.bgElevated, color: signalState === 'GREEN' ? '#ffffff' : t.textSecondary, fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer' }}>🟢 Green Signal</button>
            </div>
          </div>

          <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '14px', boxShadow: t.shadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.64rem', fontWeight: 600, color: t.textMuted, textTransform: 'uppercase' }}>ANALYSIS</span>
              <span style={{ fontSize: '0.64rem', fontWeight: 700, color: isAnalyzing ? t.success : t.warning }}>{isAnalyzing ? '● Analysis Active' : '○ Analysis Stopped'}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => { setIsAnalyzing(true); handleScanVideo(signalState); }} style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: isAnalyzing ? `1px solid ${t.primary}` : `1px solid ${t.border}`, background: isAnalyzing ? t.primary : t.bgElevated, color: isAnalyzing ? '#ffffff' : t.textSecondary, fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Play size={12} /> Start Analysis</button>
              <button type="button" onClick={() => setIsAnalyzing(false)} style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: !isAnalyzing ? `1px solid ${t.warning}` : `1px solid ${t.border}`, background: !isAnalyzing ? t.warning : t.bgElevated, color: !isAnalyzing ? '#ffffff' : t.textSecondary, fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Square size={12} /> Stop Analysis</button>
            </div>
          </div>
        </div>

        {/* AI Detection Summary */}
        <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', boxShadow: t.shadow }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            <div style={{ background: t.bgElevated, padding: '7px', borderRadius: '6px', border: `1px solid ${t.border}` }}><Cpu size={16} color={t.textMuted} /></div>
            <div>
              <span style={{ fontSize: '0.64rem', color: t.textMuted, fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>AI DETECTION SUMMARY</span>
              <div style={{ fontSize: '0.8rem', fontWeight: 500, marginTop: '2px', color: t.textPrimary, lineHeight: 1.3 }}>{currentViolation?.detection_summary || "System monitoring live camera feed. No violations detected."}</div>
              <div style={{ fontSize: '0.68rem', color: t.textMuted, marginTop: '3px' }}>Confidence: 96.4%</div>
            </div>
          </div>
          {currentViolation && (
            <span style={{ background: t.successBg, color: t.success, border: `1px solid ${t.successBorder}`, fontSize: '0.64rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', flexShrink: 0 }}>CONFIRMED</span>
          )}
        </div>

        {/* Challan Generated Panel */}
        <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '16px', boxShadow: t.shadow }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: t.textPrimary }}>CHALLAN GENERATED</span>
            <span style={{ background: t.warningBg, color: t.warning, fontSize: '0.64rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', border: `1px solid ${t.warningBorder}` }}>{currentViolation?.status || 'PENDING REVIEW'}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem', marginBottom: '14px' }}>
            <div><span style={{ color: t.textMuted, fontSize: '0.68rem' }}>Challan ID:</span> <strong style={{ color: t.primary, display: 'block' }}>{currentViolation?.challan_id || 'N/A'}</strong></div>
            <div><span style={{ color: t.textMuted, fontSize: '0.68rem' }}>Date & Time:</span> <strong style={{ display: 'block', color: t.textPrimary }}>{currentViolation?.timestamp || 'Today'}</strong></div>
            <div><span style={{ color: t.textMuted, fontSize: '0.68rem' }}>Vehicle Number:</span> <strong style={{ display: 'block', color: t.textPrimary }}>{currentViolation?.vehicle_number || 'Demo ANPR'}</strong></div>
            <div><span style={{ color: t.textMuted, fontSize: '0.68rem' }}>Vehicle Type:</span> <strong style={{ display: 'block', color: t.textPrimary }}>{currentViolation?.vehicle_type || 'Car'}</strong></div>
            <div><span style={{ color: t.textMuted, fontSize: '0.68rem' }}>Violation:</span> <strong style={{ color: t.danger, display: 'block' }}>{currentViolation?.violation_type || 'RED LIGHT VIOLATION'}</strong></div>
            <div><span style={{ color: t.textMuted, fontSize: '0.68rem' }}>Fine Amount:</span> <strong style={{ color: t.danger, fontSize: '0.95rem', display: 'block' }}>₹{currentViolation?.fine_amount || 1000}</strong></div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={() => { if (currentViolation) setShowChallanModal(true); }} disabled={!currentViolation} style={{ flex: 1, padding: '8px', borderRadius: '6px', background: currentViolation ? t.primary : t.bgElevated, color: currentViolation ? '#ffffff' : t.textMuted, fontWeight: 700, fontSize: '0.78rem', border: 'none', cursor: currentViolation ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><Eye size={14} /> VIEW CHALLAN</button>
            <button type="button" onClick={() => alert(`Official Challan sent to registered owner of ${currentViolation?.vehicle_number || 'MP-09-AB-1234'}`)} disabled={!currentViolation} style={{ flex: 1, padding: '8px', borderRadius: '6px', background: t.bgElevated, border: `1px solid ${t.border}`, color: t.textPrimary, fontWeight: 500, fontSize: '0.78rem', cursor: currentViolation ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><Send size={14} /> SEND TO OWNER</button>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Violation Details */}
        <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '16px', boxShadow: t.shadow }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} color={currentViolation ? t.danger : t.textMuted} />
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: currentViolation ? t.textPrimary : t.textMuted }}>{currentViolation ? 'VIOLATION DETECTED' : 'NO ACTIVE INCIDENT'}</span>
            </div>
            {currentViolation && (
              <span style={{ background: t.dangerBg, color: t.danger, fontSize: '0.64rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', border: `1px solid ${t.dangerBorder}` }}>CONFIRMED</span>
            )}
          </div>

          {currentViolation ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${t.border}` }}><span style={{ color: t.textMuted, fontSize: '0.72rem' }}>Violation Type:</span><strong style={{ color: t.danger }}>{currentViolation.violation_type}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${t.border}` }}><span style={{ color: t.textMuted, fontSize: '0.72rem' }}>Location:</span><strong style={{ color: t.textPrimary }}>{currentViolation.location}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${t.border}` }}><span style={{ color: t.textMuted, fontSize: '0.72rem' }}>Date & Time:</span><strong style={{ color: t.textPrimary }}>{currentViolation.timestamp}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${t.border}` }}><span style={{ color: t.textMuted, fontSize: '0.72rem' }}>Signal State:</span><strong style={{ color: t.danger }}>🔴 {currentViolation.signal_state} (CROSSED)</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${t.border}` }}><span style={{ color: t.textMuted, fontSize: '0.72rem' }}>Vehicle Number:</span><strong style={{ color: t.primary }}>{currentViolation.vehicle_number}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${t.border}` }}><span style={{ color: t.textMuted, fontSize: '0.72rem' }}>Vehicle Type / Track ID:</span><strong style={{ color: t.textPrimary }}>{currentViolation.vehicle_type} (#{currentViolation.tracking_id})</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><span style={{ color: t.textMuted, fontSize: '0.72rem' }}>Detection Confidence:</span><strong style={{ color: t.success }}>94.2%</strong></div>
            </div>
          ) : (
            <div style={{ padding: '16px', textAlign: 'center', color: t.textMuted, fontSize: '0.8rem' }}>No active incident recorded. Start analysis with RED signal to detect line crossings.</div>
          )}
        </div>

        {/* Evidence Snapshots */}
        <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '16px', boxShadow: t.shadow }}>
          <span style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '10px', display: 'block', color: t.textPrimary }}>📸 EVIDENCE SNAPSHOTS</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div style={{ background: t.bgElevated, borderRadius: '6px', overflow: 'hidden', border: `1px solid ${t.border}`, textAlign: 'center' }}>
              <img src={currentViolation?.before_evidence_url || currentViolation?.evidence_image_url || '/media/evidence/demo_evidence.jpg'} alt="Before Violation" style={{ width: '100%', height: '72px', objectFit: 'cover', display: 'block' }} onError={(e) => { e.target.src = '/media/evidence/demo_evidence.jpg'; }} />
              <span style={{ fontSize: '0.58rem', fontWeight: 500, color: t.textMuted, display: 'block', padding: '4px' }}>BEFORE</span>
            </div>
            <div style={{ background: t.bgElevated, borderRadius: '6px', overflow: 'hidden', border: `1.5px solid ${t.danger}`, textAlign: 'center' }}>
              <img src={currentViolation?.during_evidence_url || currentViolation?.evidence_image_url || '/media/evidence/demo_evidence.jpg'} alt="During Violation" style={{ width: '100%', height: '72px', objectFit: 'cover', display: 'block' }} onError={(e) => { e.target.src = '/media/evidence/demo_evidence.jpg'; }} />
              <span style={{ fontSize: '0.58rem', fontWeight: 700, color: t.danger, display: 'block', padding: '4px' }}>DURING</span>
            </div>
            <div style={{ background: t.bgElevated, borderRadius: '6px', overflow: 'hidden', border: `1px solid ${t.border}`, textAlign: 'center' }}>
              <img src={currentViolation?.after_evidence_url || currentViolation?.evidence_image_url || '/media/evidence/demo_evidence.jpg'} alt="After Violation" style={{ width: '100%', height: '72px', objectFit: 'cover', display: 'block' }} onError={(e) => { e.target.src = '/media/evidence/demo_evidence.jpg'; }} />
              <span style={{ fontSize: '0.58rem', fontWeight: 500, color: t.textMuted, display: 'block', padding: '4px' }}>AFTER</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Data Table */}
    <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '16px 20px', boxShadow: t.shadow }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} color={t.textMuted} />
          <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: t.textPrimary }}>RECENT AI VIOLATION RECORDS</h3>
        </div>
        <button type="button" onClick={() => navigateToTab && navigateToTab('violations')} style={{ background: 'none', border: 'none', color: t.primary, fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer' }}>View All →</button>
      </div>

      {challans.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: 'left', color: t.textMuted }}>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Challan ID</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Vehicle</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Signal</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Timestamp</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Location</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {challans.slice(0, 5).map((row) => {
                const isSelected = selectedViolation?.challan_id === row.challan_id;
                return (
                  <tr key={row.id || row.challan_id} onClick={() => setSelectedViolation(row)} style={{ borderBottom: `1px solid ${t.border}`, background: isSelected ? t.primaryBg : 'transparent', cursor: 'pointer', transition: 'background-color 0.15s ease' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: t.primary }}>{row.challan_id}</td>
                    <td style={{ padding: '8px 10px', color: t.textPrimary, fontWeight: 500 }}>#{row.tracking_id} ({row.vehicle_number})</td>
                    <td style={{ padding: '8px 10px', color: t.textPrimary }}>{row.vehicle_type}</td>
                    <td style={{ padding: '8px 10px', color: t.danger, fontWeight: 700 }}>🔴 {row.signal_state}</td>
                    <td style={{ padding: '8px 10px', color: t.textSecondary }}>{row.timestamp}</td>
                    <td style={{ padding: '8px 10px', color: t.textPrimary }}>{row.location}</td>
                    <td style={{ padding: '8px 10px' }}><span style={{ background: t.warningBg, color: t.warning, fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${t.warningBorder}` }}>{row.status}</span></td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedViolation(row); setShowChallanModal(true); }} style={{ background: t.bgElevated, color: t.textPrimary, border: `1px solid ${t.border}`, borderRadius: '4px', padding: '4px 10px', fontSize: '0.7rem', fontWeight: 500, cursor: 'pointer' }}>Inspect</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', color: t.textMuted, fontSize: '0.8rem' }}>No recent violations recorded.</div>
      )}
    </div>
  </div>
  );
};

export default LiveMonitoring;
