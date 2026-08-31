import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ShieldAlert, 
  Camera, 
  X, 
  LayoutDashboard, 
  Video, 
  FileText, 
  Database, 
  Users, 
  BarChart3, 
  FileSpreadsheet, 
  Settings, 
  Clock, 
  Sun,
  Moon,
  ArrowLeft,
  MapPin
} from 'lucide-react';
import { useTheme } from '../ThemeContext';

import DashboardContent from './DashboardContent';
import LiveMonitoring from './LiveMonitoring';
import ViolationManagement from './ViolationManagement';
import ChallanRecords from './ChallanRecords';
import VehicleDatabase from './VehicleDatabase';
import OffenderRegistry from './OffenderRegistry';
import TrafficAnalytics from './TrafficAnalytics';
import TrafficReports from './TrafficReports';
import SystemSettings from './SystemSettings';

const sidebarNavItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'live-monitoring', label: 'Live Monitoring', icon: Video },
  { key: 'violations', label: 'Violations', icon: ShieldAlert },
  { key: 'challan-records', label: 'Challan Records', icon: FileText },
  { key: 'vehicle-database', label: 'Vehicle Database', icon: Database },
  { key: 'offenders', label: 'Offenders', icon: Users },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'reports', label: 'Reports', icon: FileSpreadsheet },
  { key: 'system-settings', label: 'System Settings', icon: Settings },
];

const AIAutoChallan = ({ onBackToNavigation }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [challans, setChallans] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [signalState, setSignalState] = useState('RED'); // 'RED' or 'GREEN'
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [showChallanModal, setShowChallanModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Standardized Internal Keys initialized to 'live-monitoring'
  const [activeSidebar, setActiveSidebar] = useState('live-monitoring');

  const navigateToTab = (tabKey) => {
    setActiveSidebar(tabKey);
  };

  // Search & Filter States for Modules
  const [searchQuery, setSearchQuery] = useState('');
  const [filterViolationType, setFilterViolationType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedVehicleHistory, setSelectedVehicleHistory] = useState(null);

  // Video feed state & ref
  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(false);

  // Live Clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Programmatic Video Playback for Live Monitoring
  useEffect(() => {
    if (activeSidebar === 'live-monitoring' && videoRef.current) {
      videoRef.current.muted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("[Video] Autoplay prevented:", err);
        });
      }
    }
  }, [activeSidebar]);

  const handleVideoCanPlay = () => {
    setVideoError(false);
  };

  const handleVideoError = (e) => {
    console.error("[Video] Stream error:", e);
    setVideoError(true);
  };

  const fetchChallans = async () => {
    try {
      const res = await fetch('/api/violations/');
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.challans)) {
        setChallans(data.challans);
        if (data.challans.length > 0) {
          setSelectedViolation(data.challans[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch challan records:', err);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, []);

  const handleScanVideo = async (overrideSignal = signalState) => {
    try {
      const res = await fetch('/api/violations/process/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_path: 'ai_challan_violation.mp4',
          signal_state: overrideSignal,
          stop_line_y_ratio: 0.55
        })
      });
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.challans)) {
        setChallans(data.challans);
        if (data.new_challans && data.new_challans.length > 0) {
          setSelectedViolation(data.new_challans[0]);
        } else if (data.challans.length > 0) {
          setSelectedViolation(data.challans[0]);
        }
      }
    } catch (err) {
      console.error('Failed to process video for auto challan:', err);
    }
  };

  const handleToggleSignal = (newState) => {
    setSignalState(newState);
    if (isAnalyzing) {
      handleScanVideo(newState);
    }
  };

  const currentViolation = selectedViolation || (challans.length > 0 ? challans[0] : null);
  const isViolationAlertActive = signalState === 'RED' && isAnalyzing && currentViolation !== null;

  // Derived Vehicle Intelligence Data
  const vehicleDatabase = useMemo(() => {
    const map = {};
    challans.forEach(c => {
      const vNum = c.vehicle_number || 'UNKNOWN';
      if (!map[vNum]) {
        map[vNum] = {
          vehicle_number: vNum,
          vehicle_type: c.vehicle_type || 'Car',
          total_violations: 0,
          total_challans: 0,
          total_fine: 0,
          last_violation: c.timestamp,
          last_seen: c.timestamp,
          status: c.status || 'PENDING REVIEW',
          records: []
        };
      }
      map[vNum].total_violations += 1;
      map[vNum].total_challans += 1;
      map[vNum].total_fine += (c.fine_amount || 1000);
      map[vNum].records.push(c);
    });
    return Object.values(map);
  }, [challans]);

  // Derived Repeat Offenders List
  const repeatOffenders = useMemo(() => {
    return vehicleDatabase
      .filter(v => v.total_violations >= 1)
      .sort((a, b) => b.total_violations - a.total_violations);
  }, [vehicleDatabase]);

  // Filtered Challans List
  const filteredChallans = useMemo(() => {
    return challans.filter(item => {
      const matchQuery = searchQuery === '' || 
        (item.vehicle_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.challan_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.location || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchType = filterViolationType === 'ALL' || 
        (item.violation_type || '').toUpperCase().includes(filterViolationType.toUpperCase());

      const matchStatus = filterStatus === 'ALL' || 
        (item.status || '').toUpperCase().includes(filterStatus.toUpperCase());

      return matchQuery && matchType && matchStatus;
    });
  }, [challans, searchQuery, filterViolationType, filterStatus]);

  // Download CSV Handler for Reports
  const handleDownloadCSV = (reportName) => {
    if (!challans.length) {
      alert("No data available to export.");
      return;
    }
    const headers = ["Challan ID", "Vehicle Number", "Vehicle Type", "Violation Type", "Signal State", "Timestamp", "Location", "Fine Amount", "Status"];
    const rows = challans.map(c => [
      c.challan_id || '',
      c.vehicle_number || '',
      c.vehicle_type || '',
      c.violation_type || '',
      c.signal_state || '',
      c.timestamp || '',
      c.location || '',
      c.fine_amount || 1000,
      c.status || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentTabObj = sidebarNavItems.find(item => item.key === activeSidebar);
  const currentTabLabel = currentTabObj ? currentTabObj.label : 'Live Monitoring';

  // Enterprise Design Tokens
  const t = {
    bgApp: isDark ? '#0B0F14' : '#F5F7FA',
    bgSidebar: isDark ? '#0F172A' : '#FFFFFF',
    bgSurface: isDark ? '#111820' : '#FFFFFF',
    bgElevated: isDark ? '#161F29' : '#F8FAFC',
    border: isDark ? '#26313D' : '#E2E8F0',
    
    textPrimary: isDark ? '#F1F5F9' : '#172033',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    
    primary: isDark ? '#3B82F6' : '#2563EB',
    primaryBg: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.08)',
    primaryBorder: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(37, 99, 235, 0.2)',
    
    danger: '#DC2626',
    dangerBg: isDark ? 'rgba(220, 38, 38, 0.08)' : 'rgba(220, 38, 38, 0.06)',
    dangerBorder: isDark ? 'rgba(220, 38, 38, 0.25)' : 'rgba(220, 38, 38, 0.2)',
    
    warning: '#D97706',
    warningBg: isDark ? 'rgba(217, 119, 6, 0.08)' : 'rgba(217, 119, 6, 0.06)',
    warningBorder: isDark ? 'rgba(217, 119, 6, 0.25)' : 'rgba(217, 119, 6, 0.2)',
    
    success: '#059669',
    successBg: isDark ? 'rgba(5, 150, 105, 0.08)' : 'rgba(5, 150, 105, 0.06)',
    successBorder: isDark ? 'rgba(5, 150, 105, 0.25)' : 'rgba(5, 150, 105, 0.2)',
    
    shadow: isDark ? '0 2px 6px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
  };

  // HELPER METHOD TO RENDER ACTIVE VIEW COMPONENT
  const renderActiveView = () => {
    const key = (activeSidebar || '').toLowerCase().trim().replace(/[\s_]+/g, '-');
    switch (key) {
      case 'dashboard':
        return (
          <DashboardContent
            t={t}
            challans={challans}
            signalState={signalState}
            setSelectedViolation={setSelectedViolation}
          />
        );

      case 'live-monitoring':
      case 'livemonitoring':
        return (
          <LiveMonitoring
            t={t}
            challans={challans}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing}
            signalState={signalState}
            handleToggleSignal={handleToggleSignal}
            handleScanVideo={handleScanVideo}
            currentViolation={currentViolation}
            selectedViolation={selectedViolation}
            isViolationAlertActive={isViolationAlertActive}
            currentTime={currentTime}
            videoRef={videoRef}
            videoError={videoError}
            handleVideoCanPlay={handleVideoCanPlay}
            handleVideoError={handleVideoError}
            setSelectedViolation={setSelectedViolation}
            setShowChallanModal={setShowChallanModal}
            navigateToTab={navigateToTab}
          />
        );

      case 'violations':
      case 'violation':
        return (
          <ViolationManagement
            t={t}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterViolationType={filterViolationType}
            setFilterViolationType={setFilterViolationType}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filteredChallans={filteredChallans}
            setSelectedViolation={setSelectedViolation}
            setShowChallanModal={setShowChallanModal}
          />
        );

      case 'challan-records':
      case 'challanrecords':
      case 'challans':
      case 'challan':
        return (
          <ChallanRecords
            t={t}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredChallans={filteredChallans}
            setSelectedViolation={setSelectedViolation}
            setShowChallanModal={setShowChallanModal}
          />
        );

      case 'vehicle-database':
      case 'vehicledatabase':
      case 'vehicles':
      case 'vehicle':
        return (
          <VehicleDatabase
            t={t}
            vehicleDatabase={vehicleDatabase}
            setSelectedVehicleHistory={setSelectedVehicleHistory}
          />
        );

      case 'offenders':
      case 'offender':
        return (
          <OffenderRegistry
            t={t}
            repeatOffenders={repeatOffenders}
            setSelectedVehicleHistory={setSelectedVehicleHistory}
          />
        );

      case 'analytics':
      case 'analytic':
        return (
          <TrafficAnalytics
            t={t}
            challans={challans}
          />
        );

      case 'reports':
      case 'report':
        return (
          <TrafficReports
            t={t}
            handleDownloadCSV={handleDownloadCSV}
          />
        );

      case 'system-settings':
      case 'systemsettings':
      case 'settings':
        return (
          <SystemSettings
            t={t}
          />
        );

      default:
        return (
          <LiveMonitoring
            t={t}
            challans={challans}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing}
            signalState={signalState}
            handleToggleSignal={handleToggleSignal}
            handleScanVideo={handleScanVideo}
            currentViolation={currentViolation}
            selectedViolation={selectedViolation}
            isViolationAlertActive={isViolationAlertActive}
            currentTime={currentTime}
            videoRef={videoRef}
            videoError={videoError}
            handleVideoCanPlay={handleVideoCanPlay}
            handleVideoError={handleVideoError}
            setSelectedViolation={setSelectedViolation}
            setShowChallanModal={setShowChallanModal}
            navigateToTab={navigateToTab}
          />
        );
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      width: '100%',
      background: t.bgApp,
      color: t.textPrimary,
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      transition: 'background-color 0.2s ease, color 0.2s ease',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <aside style={{
        width: '230px',
        background: t.bgSidebar,
        borderRight: `1px solid ${t.border}`,
        display: 'flex',
        flexDirection: 'column',
        justify: 'space-between',
        padding: '16px 12px',
        boxSizing: 'border-box',
        flexShrink: 0,
        transition: 'all 0.2s ease',
        zIndex: 50,
        pointerEvents: 'auto',
        position: 'relative'
      }}>
        <div>
          {/* Logo Brand Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '4px 8px 16px 8px',
            borderBottom: `1px solid ${t.border}`,
            marginBottom: '16px'
          }}>
            <div style={{
              background: t.primaryBg,
              border: `1px solid ${t.primaryBorder}`,
              padding: '7px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justify: 'center'
            }}>
              <ShieldAlert size={18} color={t.primary} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, letterSpacing: '0.2px', color: t.textPrimary }}>
                AUTO-CHALLAN
              </h2>
              <span style={{ fontSize: '0.6rem', color: t.textMuted, fontWeight: 500, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                AI Enforcement Engine
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px', pointerEvents: 'auto' }}>
            {sidebarNavItems.map((item) => {
              const IconComp = item.icon;
              const currentNormKey = (activeSidebar || '').toLowerCase().trim().replace(/[\s_]+/g, '-');
              const itemNormKey = (item.key || item.label || '').toLowerCase().trim().replace(/[\s_]+/g, '-');
              const isActive = currentNormKey === itemNormKey;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => navigateToTab(item.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: isActive ? t.primaryBg : 'transparent',
                    color: isActive ? t.primary : t.textSecondary,
                    borderLeft: isActive ? `3px solid ${t.primary}` : '3px solid transparent',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    width: '100%',
                    boxSizing: 'border-box',
                    pointerEvents: 'auto'
                  }}
                >
                  <IconComp size={16} color={isActive ? t.primary : t.textMuted} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Status Info */}
        <div style={{
          background: t.bgElevated,
          border: `1px solid ${t.border}`,
          padding: '12px',
          borderRadius: '6px',
          marginTop: '16px'
        }}>
          <span style={{ fontSize: '0.6rem', color: t.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '6px' }}>
            SYSTEM HEALTH
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.success }}></span>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: t.textPrimary }}>
              Operational
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT CONTAINER */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', height: '100%' }}>
        {/* HEADER */}
        <header style={{
          background: t.bgSidebar,
          borderBottom: `1px solid ${t.border}`,
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          gap: '16px',
          boxShadow: t.shadow,
          flexShrink: 0
        }}>
          {/* Header Left Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: t.bgElevated,
              padding: '7px',
              borderRadius: '6px',
              border: `1px solid ${t.border}`,
              display: 'flex',
              alignItems: 'center'
            }}>
              <Camera size={18} color={t.textMuted} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: t.textPrimary, letterSpacing: '0.2px' }}>
                {currentTabLabel}
              </h1>
              <span style={{ fontSize: '0.74rem', color: t.textSecondary }}>
                Traffic Enforcement Command Center
              </span>
            </div>
          </div>

          {/* Dynamic Status Indicator */}
          <div>
            <span style={{
              background: isViolationAlertActive ? t.dangerBg : t.successBg,
              border: `1px solid ${isViolationAlertActive ? t.dangerBorder : t.successBorder}`,
              color: isViolationAlertActive ? t.danger : t.success,
              fontSize: '0.76rem',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isViolationAlertActive ? t.danger : t.success
              }}></span>
              {isViolationAlertActive ? 'RED LIGHT VIOLATION DETECTED' : 'SIGNAL NORMAL — NO VIOLATION'}
            </span>
          </div>

          {/* Header Right Widgets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.76rem',
              color: t.textSecondary,
              background: t.bgElevated,
              padding: '5px 10px',
              borderRadius: '6px',
              border: `1px solid ${t.border}`
            }}>
              <MapPin size={13} color={t.textMuted} />
              <span>Indore, Vijay Nagar Junction</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.76rem',
              color: t.textSecondary,
              background: t.bgElevated,
              padding: '5px 10px',
              borderRadius: '6px',
              border: `1px solid ${t.border}`
            }}>
              <Clock size={13} color={t.textMuted} />
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                background: t.bgElevated,
                border: `1px solid ${t.border}`,
                color: t.textPrimary,
                fontWeight: 500,
                fontSize: '0.76rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {isDark ? <Sun size={14} color="#D97706" /> : <Moon size={14} color={t.primary} />}
              <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>

            {/* Back to Route Navigation */}
            <button
              type="button"
              onClick={onBackToNavigation}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                background: t.primaryBg,
                border: `1px solid ${t.primaryBorder}`,
                color: t.primary,
                fontWeight: 600,
                fontSize: '0.76rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Route Navigation</span>
            </button>
          </div>
        </header>

        {/* MAIN MODULE VIEW RENDERING */}
        <main style={{ padding: '20px 24px', flex: 1, overflowY: 'auto', boxSizing: 'border-box' }}>
          {renderActiveView()}
        </main>
      </div>

      {/* VEHICLE HISTORY DRAWER / MODAL */}
      {selectedVehicleHistory && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setSelectedVehicleHistory(null); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '24px', maxWidth: '520px', width: '100%', color: t.textPrimary, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: `1px solid ${t.border}`, paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: t.primary }}>VEHICLE INTELLIGENCE HISTORY</h3>
                <span style={{ fontSize: '0.72rem', color: t.textMuted }}>{selectedVehicleHistory.vehicle_number} ({selectedVehicleHistory.vehicle_type})</span>
              </div>
              <button type="button" onClick={() => setSelectedVehicleHistory(null)} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px', fontSize: '0.78rem' }}>
              <div style={{ background: t.bgElevated, padding: '8px', borderRadius: '6px', border: `1px solid ${t.border}` }}><span style={{ fontSize: '0.64rem', color: t.textMuted, display: 'block' }}>Violations</span><strong style={{ color: t.danger }}>{selectedVehicleHistory.total_violations}</strong></div>
              <div style={{ background: t.bgElevated, padding: '8px', borderRadius: '6px', border: `1px solid ${t.border}` }}><span style={{ fontSize: '0.64rem', color: t.textMuted, display: 'block' }}>Challans</span><strong>{selectedVehicleHistory.total_challans}</strong></div>
              <div style={{ background: t.bgElevated, padding: '8px', borderRadius: '6px', border: `1px solid ${t.border}` }}><span style={{ fontSize: '0.64rem', color: t.textMuted, display: 'block' }}>Total Fine</span><strong style={{ color: t.danger }}>₹{selectedVehicleHistory.total_fine}</strong></div>
            </div>

            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: t.textMuted, display: 'block', marginBottom: '8px' }}>RECORDED INFRACTIONS:</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
              {selectedVehicleHistory.records.map((rec) => (
                <div key={rec.id || rec.challan_id} style={{ background: t.bgElevated, padding: '8px 10px', borderRadius: '4px', border: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span>{rec.challan_id} — <strong style={{ color: t.danger }}>{rec.violation_type}</strong></span>
                  <span style={{ color: t.textMuted }}>{rec.timestamp}</span>
                </div>
              ))}
            </div>

            <button type="button" onClick={() => setSelectedVehicleHistory(null)} style={{ width: '100%', marginTop: '16px', padding: '9px', borderRadius: '6px', background: t.primary, color: '#ffffff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.82rem' }}>CLOSE INTELLIGENCE FILE</button>
          </div>
        </div>
      )}

      {/* CHALLAN INSPECTION MODAL */}
      {showChallanModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowChallanModal(false); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '24px', maxWidth: '520px', width: '100%', color: t.textPrimary, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: `1px solid ${t.border}`, paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} color={t.danger} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: t.textPrimary }}>OFFICIAL AI TRAFFIC CHALLAN</h3>
                  <span style={{ fontSize: '0.66rem', color: t.textMuted }}>Smart City Traffic Command Enforcement</span>
                </div>
              </div>
              <button type="button" onClick={() => setShowChallanModal(false)} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', padding: '4px' }}><X size={18} /></button>
            </div>

            {currentViolation ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ background: t.bgElevated, padding: '8px', borderRadius: '6px', border: `1px solid ${t.border}` }}><span style={{ color: t.textMuted, fontSize: '0.65rem', display: 'block' }}>Challan ID</span><strong style={{ color: t.primary }}>{currentViolation.challan_id || 'CH-2026-8942'}</strong></div>
                  <div style={{ background: t.bgElevated, padding: '8px', borderRadius: '6px', border: `1px solid ${t.border}` }}><span style={{ color: t.textMuted, fontSize: '0.65rem', display: 'block' }}>Registered Vehicle</span><strong style={{ color: t.textPrimary }}>{currentViolation.vehicle_number || 'MP-09-AB-1234'}</strong></div>
                  <div style={{ background: t.bgElevated, padding: '8px', borderRadius: '6px', border: `1px solid ${t.border}` }}><span style={{ color: t.textMuted, fontSize: '0.65rem', display: 'block' }}>Vehicle Type</span><strong style={{ color: t.textPrimary }}>{currentViolation.vehicle_type || 'Car'}</strong></div>
                  <div style={{ background: t.bgElevated, padding: '8px', borderRadius: '6px', border: `1px solid ${t.border}` }}><span style={{ color: t.textMuted, fontSize: '0.65rem', display: 'block' }}>Violation Type</span><strong style={{ color: t.danger }}>{currentViolation.violation_type || 'RED LIGHT VIOLATION'}</strong></div>
                  <div style={{ background: t.bgElevated, padding: '8px', borderRadius: '6px', border: `1px solid ${t.border}` }}><span style={{ color: t.textMuted, fontSize: '0.65rem', display: 'block' }}>Date & Time</span><strong style={{ color: t.textPrimary }}>{currentViolation.timestamp || 'Today'}</strong></div>
                  <div style={{ background: t.bgElevated, padding: '8px', borderRadius: '6px', border: `1px solid ${t.border}` }}><span style={{ color: t.textMuted, fontSize: '0.65rem', display: 'block' }}>Location</span><strong style={{ color: t.textPrimary }}>{currentViolation.location || 'Vijay Nagar Junction'}</strong></div>
                  <div style={{ background: t.bgElevated, padding: '8px', borderRadius: '6px', border: `1px solid ${t.border}` }}><span style={{ color: t.textMuted, fontSize: '0.65rem', display: 'block' }}>Signal State</span><strong style={{ color: t.danger }}>🔴 {currentViolation.signal_state || 'RED'} (CROSSED)</strong></div>
                  <div style={{ background: t.bgElevated, padding: '8px', borderRadius: '6px', border: `1px solid ${t.border}` }}><span style={{ color: t.textMuted, fontSize: '0.65rem', display: 'block' }}>Fine Penalty</span><strong style={{ color: t.danger, fontSize: '1rem' }}>₹{currentViolation.fine_amount || 1000}</strong></div>
                </div>

                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.72rem', display: 'block', marginBottom: '4px', color: t.textMuted }}>AI DETECTION SUMMARY:</span>
                  <div style={{ background: t.bgElevated, padding: '8px 10px', borderRadius: '6px', border: `1px solid ${t.border}`, fontSize: '0.76rem', color: t.textPrimary, lineHeight: 1.3 }}>{currentViolation.detection_summary || "Vehicle crossed stop line while traffic signal was RED."}</div>
                </div>

                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.72rem', display: 'block', marginBottom: '6px', color: t.textMuted }}>OFFICIAL EVIDENCE ATTACHMENT:</span>
                  <div style={{ borderRadius: '6px', overflow: 'hidden', border: `1px solid ${t.border}`, background: '#000000' }}>
                    <img src={currentViolation.during_evidence_url || currentViolation.evidence_image_url || '/media/evidence/demo_evidence.jpg'} alt="Official Evidence" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block' }} onError={(e) => { e.target.src = '/media/evidence/demo_evidence.jpg'; }} />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: t.textMuted, fontSize: '0.85rem' }}>No active violation selected to preview.</div>
            )}

            <button type="button" onClick={() => setShowChallanModal(false)} style={{ width: '100%', marginTop: '16px', padding: '9px', borderRadius: '6px', background: t.primary, color: '#ffffff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.82rem' }}>CLOSE CHALLAN PREVIEW</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAutoChallan;
