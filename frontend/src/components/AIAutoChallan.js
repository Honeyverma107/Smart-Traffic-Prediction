import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ShieldAlert,
  X,
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  FileSpreadsheet,
  Calendar,
  Bell,
  ChevronDown
} from 'lucide-react';

import DashboardContent from './DashboardContent';
import LiveMonitoring from './LiveMonitoring';
import ViolationManagement from './ViolationManagement';
import ChallanRecords from './ChallanRecords';
import VehicleDatabase from './VehicleDatabase';
import OffenderRegistry from './OffenderRegistry';
import TrafficAnalytics from './TrafficAnalytics';
import TrafficReports from './TrafficReports';
import SystemSettings from './SystemSettings';

const INITIAL_DEMO_RECORDS = [
  {
    id: 'AC-2026-0001',
    challan_id: 'AC-2026-0001',
    vehicle_number: 'MP-09-AB-1234',
    vehicle_type: 'Car',
    violation_type: 'Red Light Violation',
    signal_state: 'RED',
    timestamp: '2026-09-01 10:45:12',
    location: 'Vijay Nagar Junction',
    camera: 'CAM 01',
    fine_amount: 1000,
    status: 'Pending Review',
    tracking_id: 12,
    evidence_video: '/ai_challan_violation_chrome.mp4',
    before_evidence_url: '/media/evidence/AI-CHALLAN-01B5AFD3_before.jpg',
    during_evidence_url: '/media/evidence/AI-CHALLAN-01B5AFD3_during.jpg',
    after_evidence_url: '/media/evidence/AI-CHALLAN-01B5AFD3_after.jpg',
    detection_summary: 'Vehicle MP-09-AB-1234 crossed stop line Y=0.55 while signal was RED.'
  },
  {
    id: 'AC-2026-0002',
    challan_id: 'AC-2026-0002',
    vehicle_number: 'MP-09-CD-5678',
    vehicle_type: 'Car',
    violation_type: 'Red Light Violation',
    signal_state: 'RED',
    timestamp: '2026-09-01 10:50:34',
    location: 'Vijay Nagar Junction',
    camera: 'CAM 01',
    fine_amount: 1000,
    status: 'Approved',
    tracking_id: 13,
    evidence_video: '/ai_challan_violation_chrome.mp4',
    before_evidence_url: '/media/evidence/AI-CHALLAN-0D463851_before.jpg',
    during_evidence_url: '/media/evidence/AI-CHALLAN-0D463851_during.jpg',
    after_evidence_url: '/media/evidence/AI-CHALLAN-0D463851_after.jpg',
    detection_summary: 'Automated ANPR matched MP-09-CD-5678 crossing active RED signal.'
  },
  {
    id: 'AC-2026-0003',
    challan_id: 'AC-2026-0003',
    vehicle_number: 'MP-09-EF-2468',
    vehicle_type: 'Motorcycle',
    violation_type: 'Stop Line Violation',
    signal_state: 'RED',
    timestamp: '2026-09-01 11:02:19',
    location: 'Vijay Nagar Square',
    camera: 'CAM 01',
    fine_amount: 500,
    status: 'Pending Review',
    tracking_id: 14,
    evidence_video: '/ai_challan_violation_chrome.mp4',
    before_evidence_url: '/media/evidence/AI-CHALLAN-1030BB20_before.jpg',
    during_evidence_url: '/media/evidence/AI-CHALLAN-1030BB20_during.jpg',
    after_evidence_url: '/media/evidence/AI-CHALLAN-1030BB20_after.jpg',
    detection_summary: 'Two-wheeler MP-09-EF-2468 overshot zebra crossing stop line threshold.'
  },
  {
    id: 'AC-2026-0004',
    challan_id: 'AC-2026-0004',
    vehicle_number: 'MP-09-GH-1357',
    vehicle_type: 'Car',
    violation_type: 'Red Light Violation',
    signal_state: 'RED',
    timestamp: '2026-09-01 11:10:05',
    location: 'Vijay Nagar Junction',
    camera: 'CAM 01',
    fine_amount: 1000,
    status: 'Issued',
    tracking_id: 15,
    evidence_video: '/ai_challan_violation_chrome.mp4',
    before_evidence_url: '/media/evidence/AI-CHALLAN-13228187_before.jpg',
    during_evidence_url: '/media/evidence/AI-CHALLAN-13228187_during.jpg',
    after_evidence_url: '/media/evidence/AI-CHALLAN-13228187_after.jpg',
    detection_summary: 'Challan AC-2026-0004 issued to MP-09-GH-1357 for red light breach.'
  },
  {
    id: 'AC-2026-0005',
    challan_id: 'AC-2026-0005',
    vehicle_number: 'MP-09-JK-9753',
    vehicle_type: 'SUV',
    violation_type: 'Signal Jump',
    signal_state: 'RED',
    timestamp: '2026-09-01 11:15:40',
    location: 'Vijay Nagar Square',
    camera: 'CAM 01',
    fine_amount: 1500,
    status: 'Pending Review',
    tracking_id: 16,
    evidence_video: '/ai_challan_violation_chrome.mp4',
    before_evidence_url: '/media/evidence/AI-CHALLAN-142ED92A_before.jpg',
    during_evidence_url: '/media/evidence/AI-CHALLAN-142ED92A_during.jpg',
    after_evidence_url: '/media/evidence/AI-CHALLAN-142ED92A_after.jpg',
    detection_summary: 'SUV MP-09-JK-9753 detected accelerating through red light intersection.'
  }
];

const AIAutoChallan = ({ onBackToNavigation }) => {
  const [challans, setChallans] = useState(INITIAL_DEMO_RECORDS);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [signalState, setSignalState] = useState('RED'); // 'RED' or 'GREEN'
  const [selectedViolation, setSelectedViolation] = useState(INITIAL_DEMO_RECORDS[0]);
  const [showChallanModal, setShowChallanModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Standardized Internal Keys initialized to 'live-monitoring'
  const [activeSidebar, setActiveSidebar] = useState('live-monitoring');

  const navigateToTab = (tabKey) => {
    setActiveSidebar(tabKey);
  };

  // Dynamic Date Filter States
  const [timePeriodFilter, setTimePeriodFilter] = useState('This Month');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState('2026-09-30');

  const getFilterLabel = () => {
    if (timePeriodFilter === 'Custom') {
      return `${customStartDate} to ${customEndDate}`;
    }
    return timePeriodFilter;
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

  // Enterprise Control-Room Design Tokens (Light Mode)
  const t = {
    bgApp: '#F5F7FA',
    bgSidebar: '#FFFFFF',
    bgSurface: '#FFFFFF',
    bgElevated: '#F8FAFC',
    border: '#E2E8F0',
    
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    
    primary: '#2563EB',
    primaryBg: 'rgba(37, 99, 235, 0.08)',
    primaryBorder: 'rgba(37, 99, 235, 0.2)',
    
    danger: '#EF4444',
    dangerBg: 'rgba(239, 68, 68, 0.08)',
    dangerBorder: 'rgba(239, 68, 68, 0.25)',
    
    warning: '#F59E0B',
    warningBg: 'rgba(245, 158, 11, 0.08)',
    warningBorder: 'rgba(245, 158, 11, 0.25)',
    
    success: '#10B981',
    successBg: 'rgba(16, 185, 129, 0.08)',
    successBorder: 'rgba(16, 185, 129, 0.25)',
    
    shadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
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
            timePeriodFilter={timePeriodFilter}
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
            navigateToTab={navigateToTab}
            timePeriodFilter={timePeriodFilter}
            setTimePeriodFilter={setTimePeriodFilter}
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
          <DashboardContent
            t={t}
            challans={challans}
            signalState={signalState}
            setSelectedViolation={setSelectedViolation}
          />
        );
    }
  };

  const moduleNavItems = [
    { key: 'live-monitoring', label: 'Live Monitoring', icon: LayoutDashboard },
    { key: 'challan-records', label: 'Challan Records', icon: FileText },
    { key: 'offenders', label: 'Offenders', icon: Users },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'reports', label: 'Reports', icon: FileSpreadsheet }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      width: '100%',
      background: t.bgApp,
      color: t.textPrimary,
      fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxSizing: 'border-box',
      padding: '20px 24px'
    }}>
      {/* 1. TOP HEADER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '16px',
        borderBottom: `1px solid ${t.border}`,
        marginBottom: '16px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0B1630', letterSpacing: '-0.02em' }}>
            AI AUTO-CHALLAN
          </h1>
          <span style={{ fontSize: '0.88rem', color: '#536789', fontWeight: 500, marginTop: '2px', display: 'block' }}>
            Automated violation detection and e-challan generation using AI
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
          {/* Dynamic Date Filter Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FFFFFF',
                border: `1px solid ${t.border}`,
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: '#0B1630',
                boxShadow: t.shadow,
                cursor: 'pointer'
              }}
            >
              <Calendar size={16} color="#0878F9" />
              <span>{getFilterLabel()}</span>
              <ChevronDown size={14} color="#536789" />
            </button>

            {/* Dropdown Menu */}
            {showDateDropdown && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                background: '#FFFFFF',
                border: `1px solid ${t.border}`,
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
                zIndex: 100,
                minWidth: '180px',
                padding: '6px 0',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {['Today', 'This Week', 'This Month', 'This Year', 'Custom Date Range'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      if (opt === 'Custom Date Range') {
                        setShowDateDropdown(false);
                        setShowCustomModal(true);
                      } else {
                        setTimePeriodFilter(opt);
                        setShowDateDropdown(false);
                      }
                    }}
                    style={{
                      padding: '9px 16px',
                      textAlign: 'left',
                      background: (timePeriodFilter === opt || (opt === 'Custom Date Range' && timePeriodFilter === 'Custom')) ? 'rgba(8, 120, 249, 0.08)' : 'transparent',
                      color: (timePeriodFilter === opt || (opt === 'Custom Date Range' && timePeriodFilter === 'Custom')) ? '#0878F9' : '#0B1630',
                      border: 'none',
                      fontWeight: (timePeriodFilter === opt || (opt === 'Custom Date Range' && timePeriodFilter === 'Custom')) ? 700 : 500,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <div style={{
            position: 'relative',
            background: '#FFFFFF',
            border: `1px solid ${t.border}`,
            borderRadius: '8px',
            padding: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: t.shadow,
            cursor: 'pointer'
          }}>
            <Bell size={18} color="#0B1630" />
            <span style={{ position: 'absolute', top: '7px', right: '7px', width: '7px', height: '7px', borderRadius: '50%', background: '#EF4444' }}></span>
          </div>
        </div>
      </div>

      {/* 2. HORIZONTAL NAVIGATION BAR (DIRECTLY BELOW HEADER & ABOVE PAGE CONTENT) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        borderBottom: `1px solid ${t.border}`,
        marginBottom: '20px',
        paddingBottom: '2px',
        overflowX: 'auto'
      }}>
        {moduleNavItems.map((item) => {
          const IconComp = item.icon;
          const currentNormKey = (activeSidebar || '').toLowerCase().trim().replace(/[\s_]+/g, '-');
          const itemNormKey = (item.key || item.label || '').toLowerCase().trim().replace(/[\s_]+/g, '-');
          const isActive = currentNormKey === itemNormKey || 
            (item.key === 'live-monitoring' && (currentNormKey === 'dashboard' || currentNormKey === 'overview'));

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => navigateToTab(item.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: isActive ? 'rgba(8, 120, 249, 0.08)' : 'transparent',
                color: isActive ? '#0878F9' : '#536789',
                borderBottom: isActive ? '3px solid #0878F9' : '3px solid transparent',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <IconComp size={18} color={isActive ? '#0878F9' : '#536789'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. FULL-WIDTH MAIN PAGE CONTENT */}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {renderActiveView()}
      </main>

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
      {showCustomModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowCustomModal(false); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#FFFFFF', border: `1px solid ${t.border}`, borderRadius: '12px', padding: '24px', maxWidth: '380px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0B1630' }}>Custom Date Range</h3>
              <button type="button" onClick={() => setShowCustomModal(false)} style={{ background: 'none', border: 'none', color: '#536789', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#536789', display: 'block', marginBottom: '4px' }}>Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${t.border}`, fontSize: '0.88rem', fontWeight: 600, color: '#0B1630', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#536789', display: 'block', marginBottom: '4px' }}>End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${t.border}`, fontSize: '0.88rem', fontWeight: 600, color: '#0B1630', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                style={{ flex: 1, padding: '9px', borderRadius: '6px', border: `1px solid ${t.border}`, background: '#F8FAFC', color: '#536789', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimePeriodFilter('Custom');
                  setShowCustomModal(false);
                }}
                style={{ flex: 1, padding: '9px', borderRadius: '6px', border: 'none', background: '#0878F9', color: '#FFFFFF', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAutoChallan;
