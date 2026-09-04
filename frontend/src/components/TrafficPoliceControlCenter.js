import React, { useState, useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import {
  ShieldAlert,
  Radio,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Users,
  Bell,
  Activity,
  ChevronRight,
  X,
  Sparkles,
  ArrowLeft,
  Navigation,
  FileText,
  TrendingUp,
  Shield,
  Clock,
  Zap,
  Check,
  RefreshCw
} from 'lucide-react';

import './TrafficPoliceControlCenter.css';
import AIAutoChallan from './AIAutoChallan';
import TrafficReports from './TrafficReports';


const TOMTOM_API_KEY = (process.env.REACT_APP_TOMTOM_API_KEY || '7SrnWdqzHqr6ntJOpASDreuH4wIsqCaA').trim();

const TrafficPoliceControlCenter = ({ onBackToNavigation }) => {
  // Dynamic State Management (Zero hardcoded/mock arrays)
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alerts, setAlerts] = useState([]);
  const [units, setUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedDispatchUnit, setSelectedDispatchUnit] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState('');
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);


  // Toast Notification Helper
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch alerts and units from Django API with live polling
  const fetchApiData = async (isManual = false) => {
    if (isManual) setIsLoading(true);
    try {
      const [alertsRes, unitsRes] = await Promise.all([
        fetch('/api/traffic-police/alerts/'),
        fetch('/api/traffic-police/units/')
      ]);

      let loadedAlerts = [];
      let loadedUnits = [];

      if (alertsRes.ok) {
        const data = await alertsRes.json();
        loadedAlerts = data && Array.isArray(data.alerts) ? data.alerts : [];
      }
      if (unitsRes.ok) {
        const data = await unitsRes.json();
        loadedUnits = data && Array.isArray(data.units) ? data.units : [];
      }

      setAlerts(loadedAlerts);
      setUnits(loadedUnits);
      setFetchError(null);
      setLastUpdatedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error("Traffic Police API fetch error:", err);
      setFetchError("Unable to load traffic alerts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and 5-second polling interval for real-time alert updates
  useEffect(() => {
    fetchApiData(true);
    const interval = setInterval(() => {
      fetchApiData(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Map Initialization & TomTom Orbis Map Updates
  const initTomTomMap = () => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      setIsMapLoading(true);
      setMapError(null);

      const tomtomOrbisStyle = {
        version: 8,
        name: 'TomTom Orbis Light Map',
        sources: {
          'tomtom-orbis-tiles': {
            type: 'raster',
            tiles: [
              `https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`
            ],
            tileSize: 256,
            attribution: '&copy; TomTom Orbis Maps'
          }
        },
        layers: [
          {
            id: 'tomtom-orbis-raster',
            type: 'raster',
            source: 'tomtom-orbis-tiles',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      };

      try {
        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: tomtomOrbisStyle,
          center: [75.885, 22.735],
          zoom: 13,
          attributionControl: true
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-left');

        map.on('load', () => {
          setIsMapLoading(false);
          setMapError(null);
          setTimeout(() => {
            if (mapInstanceRef.current) mapInstanceRef.current.resize();
          }, 100);
        });

        map.on('error', (e) => {
          console.error("TomTom Orbis Map load error:", e);
          if (!mapInstanceRef.current || isMapLoading) {
            setIsMapLoading(false);
            setMapError("Unable to load TomTom map.");
          }
        });

        mapInstanceRef.current = map;
      } catch (err) {
        console.error("TomTom map creation error:", err);
        setIsMapLoading(false);
        setMapError("Unable to load TomTom map.");
      }
    } else {
      setTimeout(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.resize();
      }, 100);
    }
  };

  useEffect(() => {
    if (activeTab === 'traffic-map' || activeTab === 'dashboard') {
      initTomTomMap();

      // Render Alert Markers on TomTom Orbis Map
      const map = mapInstanceRef.current;
      if (map) {
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        alerts.forEach(alert => {
          const coords = alert.coordinates || [22.7533, 75.8937];
          const lat = coords[0];
          const lng = coords[1];
          const isHigh = alert.traffic_level === 'HIGH';
          const isResolved = alert.status === 'RESOLVED';
          const color = isResolved ? '#10b981' : isHigh ? '#ef4444' : '#f59e0b';

          const el = document.createElement('div');
          el.className = 'police-map-marker';
          el.style.cursor = 'pointer';
          el.innerHTML = `
            <div class="marker-pulse-wrapper">
              ${!isResolved ? `<div class="marker-ping" style="background: ${color}"></div>` : ''}
              <div class="marker-pin" style="background: ${color}">
                <span class="marker-text">${(alert.location || 'Corridor').split(' ')[0]}</span>
              </div>
            </div>
          `;

          el.addEventListener('click', (e) => {
            e.stopPropagation();
            setSelectedAlert(alert);
          });

          try {
            const marker = new maplibregl.Marker({ element: el })
              .setLngLat([lng, lat])
              .addTo(map);

            markersRef.current.push(marker);
          } catch (mErr) {
            console.error("Error adding TomTom map marker:", mErr);
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, alerts]);



  // Dynamic KPI Calculations strictly derived from backend database response
  const activeAlertsCount = alerts.filter(a => a.status !== 'RESOLVED').length;
  const highTrafficZonesCount = alerts.filter(a => a.traffic_level === 'HIGH' && a.status !== 'RESOLVED').length;
  const alertsResolvedCount = alerts.filter(a => a.status === 'RESOLVED').length;
  const totalAlertsCount = alerts.length;

  // Status Badge CSS Resolver
  const getStatusBadge = (status) => {
    switch (status) {
      case 'NEW':
        return { label: '● NEW', className: 'badge-status-new' };
      case 'ALERT SENT':
        return { label: '● ALERT SENT', className: 'badge-status-sent' };
      case 'ACKNOWLEDGED':
        return { label: '● ACKNOWLEDGED', className: 'badge-status-acknowledged' };
      case 'OFFICER DISPATCHED':
        return { label: '● OFFICER DISPATCHED', className: 'badge-status-dispatched' };
      case 'RESOLVED':
        return { label: '● RESOLVED', className: 'badge-status-resolved' };
      default:
        return { label: `● ${status || 'ACTIVE'}`, className: 'badge-status-default' };
    }
  };

  // Action Handlers connecting to Backend Database
  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await fetch(`/api/traffic-police/alerts/${alertId}/status/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACKNOWLEDGED' })
      });
      triggerToast(`Alert #${alertId} ACKNOWLEDGED by Traffic Command Center.`);
      fetchApiData(false);
    } catch (e) {
      console.error("Status update error:", e);
    }

    setAlerts(prev => prev.map(a => a.alert_id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a));
    if (selectedAlert && selectedAlert.alert_id === alertId) {
      setSelectedAlert(prev => ({ ...prev, status: 'ACKNOWLEDGED' }));
    }
  };

  const handleOpenDispatchModal = (alert) => {
    setSelectedAlert(alert);
    setShowDispatchModal(true);
    const availableUnit = units.find(u => u.status === 'Available');
    if (availableUnit) {
      setSelectedDispatchUnit(availableUnit.unit_code);
    } else if (units.length > 0) {
      setSelectedDispatchUnit(units[0].unit_code);
    }
  };

  const handleConfirmDispatch = async () => {
    if (!selectedAlert || !selectedDispatchUnit) return;

    try {
      await fetch('/api/traffic-police/dispatch/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_code: selectedDispatchUnit,
          alert_id: selectedAlert.alert_id,
          action: 'dispatch'
        })
      });
      triggerToast(`🚨 ${selectedDispatchUnit} DISPATCHED to ${selectedAlert.location}.`);
      fetchApiData(false);
    } catch (e) {
      console.error("Dispatch API error:", e);
    }

    setAlerts(prev => prev.map(a => a.alert_id === selectedAlert.alert_id ? {
      ...a,
      status: 'OFFICER DISPATCHED',
      assigned_unit: selectedDispatchUnit
    } : a));

    setShowDispatchModal(false);
  };

  const handleResolveAlert = async (alertId) => {
    try {
      const res = await fetch(`/api/traffic-police/alerts/${alertId}/status/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED' })
      });
      if (res.ok) {
        triggerToast(`✓ Alert #${alertId} marked as RESOLVED.`);
        fetchApiData(false);
      }
    } catch (e) {
      console.error("Resolve alert error:", e);
    }

    setAlerts(prev => prev.map(a => a.alert_id === alertId ? { ...a, status: 'RESOLVED' } : a));
    if (selectedAlert && selectedAlert.alert_id === alertId) {
      setSelectedAlert(prev => ({ ...prev, status: 'RESOLVED' }));
    }
  };

  // Filter Active Unresolved Alerts
  const activeUnresolvedAlerts = alerts.filter(a => a.status !== 'RESOLVED');

  // Derive highest traffic vehicle load dynamically from backend alerts
  const currentHighestVehicles = activeUnresolvedAlerts.length > 0 
    ? Math.max(...activeUnresolvedAlerts.map(a => a.vehicle_count || 0))
    : 0;

  const highestTrafficLevel = activeUnresolvedAlerts.length > 0
    ? (activeUnresolvedAlerts.some(a => a.traffic_level === 'HIGH') ? 'HIGH' : 'MEDIUM')
    : 'NORMAL';

  const trafficLoadPercent = highestTrafficLevel === 'HIGH' ? 86 : highestTrafficLevel === 'MEDIUM' ? 55 : 25;

  return (
    <div className="police-dashboard-container">
      {/* TOAST NOTIFICATION BANNER */}
      {toastMessage && (
        <div className="police-toast-notification animate-slide-down">
          <ShieldAlert size={18} className="toast-icon" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* LEFT SIDE NAVIGATION */}
      <aside className="police-sidebar">
        <div className="police-brand-header">
          <div className="police-badge-logo">
            <Shield size={22} color="#2563eb" />
          </div>
          <div>
            <h1 className="police-brand-title">TRAFFIC POLICE</h1>
            <span className="police-brand-subtitle">INDORE COMMAND CENTER</span>
          </div>
        </div>

        <nav className="police-nav-menu">
          <button
            type="button"
            className={`police-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity size={17} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`police-nav-item ${activeTab === 'live-alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('live-alerts')}
          >
            <ShieldAlert size={17} />
            <span>Live Alerts</span>
            {activeAlertsCount > 0 && <span className="nav-badge red">{activeAlertsCount}</span>}
          </button>

          <button
            type="button"
            className={`police-nav-item ${activeTab === 'auto-challan' ? 'active' : ''}`}
            onClick={() => setActiveTab('auto-challan')}
          >
            <Sparkles size={17} color="#2563eb" />
            <span>AI Auto-Challan</span>
          </button>


          <button
            type="button"
            className={`police-nav-item ${activeTab === 'traffic-map' ? 'active' : ''}`}
            onClick={() => setActiveTab('traffic-map')}
          >
            <Navigation size={17} />
            <span>Traffic Map</span>
          </button>

          <button
            type="button"
            className={`police-nav-item ${activeTab === 'police-units' ? 'active' : ''}`}
            onClick={() => setActiveTab('police-units')}
          >
            <Users size={17} />
            <span>Police Units</span>
            <span className="nav-badge blue">{units.filter(u => u.status === 'Available').length}</span>
          </button>

          <button
            type="button"
            className={`police-nav-item ${activeTab === 'incident-history' ? 'active' : ''}`}
            onClick={() => setActiveTab('incident-history')}
          >
            <FileText size={17} />
            <span>Incident History</span>
          </button>

          <button
            type="button"
            className={`police-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <TrendingUp size={17} />
            <span>Reports & Analytics</span>
          </button>
        </nav>

        <div className="police-sidebar-footer">
          {onBackToNavigation && (
            <button type="button" className="back-to-nav-btn" onClick={onBackToNavigation}>
              <ArrowLeft size={15} />
              <span>Back to Navigation</span>
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="police-main-content">
        {/* DASHBOARD HEADER */}
        <header className="police-header">
          <div className="header-title-group">
            <h2>TRAFFIC POLICE COMMAND CENTER</h2>
            <span className="header-breadcrumbs">AI-powered real-time traffic monitoring & incident response</span>
          </div>

          <div className="header-actions-group">
            <button 
              type="button" 
              className="last-updated-pill"
              onClick={() => fetchApiData(true)}
              style={{ cursor: 'pointer', background: '#ffffff' }}
              title="Refresh backend alert data"
            >
              <RefreshCw size={13} color="#2563eb" />
              <span>Refresh Data</span>
            </button>

            <div className="system-status-pill">
              <span className="status-dot-online"></span>
              <span>● System Online</span>
            </div>

            <div className="last-updated-pill">
              <Clock size={13} color="#64748b" />
              <span>Last updated: {lastUpdatedTime || 'Live'}</span>
            </div>

            <div className="notifications-popover-wrapper">
              <button
                type="button"
                className="notifications-trigger-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={17} />
                <span className="notif-count">{activeAlertsCount}</span>
              </button>

              {showNotifications && (
                <div className="notifications-popover animate-fade-in">
                  <div className="notif-header">
                    <span>Recent Notifications</span>
                    <button onClick={() => setShowNotifications(false)}><X size={14} /></button>
                  </div>
                  <div className="notif-list">
                    {alerts.length === 0 ? (
                      <div style={{ padding: '16px', fontSize: '0.78rem', color: '#64748b', textAlign: 'center' }}>No notifications</div>
                    ) : (
                      alerts.slice(0, 4).map(a => (
                        <div key={a.id} className="notif-item" onClick={() => { setSelectedAlert(a); setShowNotifications(false); }}>
                          <ShieldAlert size={14} color={a.traffic_level === 'HIGH' ? '#ef4444' : '#f59e0b'} />
                          <div>
                            <div className="notif-title">{a.location || `${a.source} → ${a.destination}`}</div>
                            <div className="notif-time">{a.detected_at} • {a.traffic_level}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* DASHBOARD BODY */}
        <div className="police-body-scrollable">
          {isLoading ? (
            <div className="loading-state-box" style={{ padding: '60px 20px', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div className="spinner-glow" style={{ margin: '0 auto 16px auto', width: '36px', height: '36px', border: '3px solid rgba(37, 99, 235, 0.1)', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Loading Traffic Police Data...</h4>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>Fetching real-time alert database records...</p>
            </div>
          ) : fetchError ? (
            <div className="error-state-box" style={{ padding: '40px 20px', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <ShieldAlert size={36} color="#ef4444" style={{ margin: '0 auto 12px auto' }} />
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#ef4444' }}>Unable to load traffic alerts</h4>
              <p style={{ margin: '6px 0 16px 0', fontSize: '0.8rem', color: '#64748b' }}>{fetchError}</p>
              <button type="button" className="view-details-btn" onClick={() => fetchApiData(true)} style={{ margin: '0 auto' }}>
                Retry Connection
              </button>
            </div>
          ) : (
            <>
              {/* VIEW 1: DASHBOARD OVERVIEW */}
              {activeTab === 'dashboard' && (
                <>
                  {/* TOP OVERVIEW METRIC CARDS */}
                  <section className="kpi-cards-grid">
                    <div className="kpi-card card-high-traffic">
                      <div className="kpi-top-row">
                        <div className="kpi-icon-box red">
                          <ShieldAlert size={20} />
                        </div>
                        <span className="kpi-badge-pill red">HIGH SEVERITY</span>
                      </div>
                      <div className="kpi-content">
                        <span className="kpi-value">{String(highTrafficZonesCount).padStart(2, '0')}</span>
                        <span className="kpi-label">🔴 HIGH TRAFFIC ALERTS</span>
                        <span className="kpi-subtext">Active high congestion alerts</span>
                      </div>
                    </div>

                    <div className="kpi-card card-active-incidents">
                      <div className="kpi-top-row">
                        <div className="kpi-icon-box orange">
                          <AlertTriangle size={20} />
                        </div>
                        <span className="kpi-badge-pill orange">REQUIRES ACTION</span>
                      </div>
                      <div className="kpi-content">
                        <span className="kpi-value">{String(activeAlertsCount).padStart(2, '0')}</span>
                        <span className="kpi-label">🚨 ACTIVE ALERTS</span>
                        <span className="kpi-subtext">Unresolved alerts requiring attention</span>
                      </div>
                    </div>

                    <div className="kpi-card card-resolved">
                      <div className="kpi-top-row">
                        <div className="kpi-icon-box green">
                          <CheckCircle2 size={20} />
                        </div>
                        <span className="kpi-badge-pill green">HANDLED</span>
                      </div>
                      <div className="kpi-content">
                        <span className="kpi-value">{String(alertsResolvedCount).padStart(2, '0')}</span>
                        <span className="kpi-label">✓ RESOLVED</span>
                        <span className="kpi-subtext">Handled & resolved incidents</span>
                      </div>
                    </div>

                    <div className="kpi-card card-monitored">
                      <div className="kpi-top-row">
                        <div className="kpi-icon-box blue">
                          <Radio size={20} />
                        </div>
                        <span className="kpi-badge-pill blue">TOTAL RECORDS</span>
                      </div>
                      <div className="kpi-content">
                        <span className="kpi-value">{String(totalAlertsCount).padStart(2, '0')}</span>
                        <span className="kpi-label">🚦 TOTAL ALERTS</span>
                        <span className="kpi-subtext">Total database alert records</span>
                      </div>
                    </div>
                  </section>

                  <div className="dashboard-grid-layout">
                    {/* LEFT COL: LIVE TRAFFIC ALERTS */}
                    <div className="alerts-panel-column">
                      <div className="panel-card-header">
                        <div className="header-title-flex">
                          <ShieldAlert size={18} color="#ef4444" />
                          <h3>LIVE TRAFFIC ALERTS</h3>
                        </div>
                        <span className="live-stream-badge">AI REAL-TIME FEED</span>
                      </div>

                      <div className="alerts-cards-list">
                        {activeUnresolvedAlerts.length === 0 ? (
                          <div className="empty-alert-state">
                            <CheckCircle2 size={36} color="#10b981" />
                            <h4>✓ ALL CLEAR</h4>
                            <p>No active traffic police alerts. The system is monitoring traffic continuously.</p>
                          </div>
                        ) : (
                          activeUnresolvedAlerts.map(alert => {
                            const badge = getStatusBadge(alert.status);
                            return (
                              <div key={alert.id} className="alert-item-card high-severity">
                                <div className="alert-card-top-row">
                                  <div className="alert-title-group">
                                    <span className="alert-pulse-dot red"></span>
                                    <div>
                                      <h4 className="alert-location-name">🚨 {alert.traffic_level} TRAFFIC</h4>
                                      <span className="alert-route-path">{alert.source || 'Origin'} → {alert.destination || 'Destination'}</span>
                                    </div>
                                  </div>
                                  <span className="alert-notif-status">✓ Message sent to Traffic Police</span>
                                </div>

                                <div className="alert-metrics-row">
                                  <div className="metric-chip">
                                    <span className="lbl">Detected Vehicles</span>
                                    <span className="val">{alert.vehicle_count} Vehicles</span>
                                  </div>
                                  <div className="metric-chip">
                                    <span className="lbl">ML Prediction</span>
                                    <span className="val red">{alert.traffic_level} Congestion</span>
                                  </div>
                                  <div className="metric-chip">
                                    <span className="lbl">Time</span>
                                    <span className="val">{alert.detected_at}</span>
                                  </div>
                                </div>

                                <div className="alert-card-footer">
                                  <span className={`status-pill-badge ${badge.className}`}>{badge.label}</span>
                                  <div className="alert-actions-group">
                                    <button
                                      type="button"
                                      className="view-details-btn"
                                      onClick={() => setSelectedAlert(alert)}
                                    >
                                      <span>View Details</span>
                                      <ChevronRight size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      className="resolve-mini-btn"
                                      onClick={() => handleResolveAlert(alert.alert_id)}
                                    >
                                      <Check size={13} />
                                      <span>Resolve</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* RIGHT COL: TRAFFIC STATUS & LOAD GAUGE */}
                    <div className="map-and-units-column">
                      <div className="traffic-status-panel-card">
                        <div className="panel-card-header">
                          <div className="header-title-flex">
                            <Zap size={18} color="#2563eb" />
                            <h3>TRAFFIC STATUS</h3>
                          </div>
                          <span className={`gauge-status-badge ${highestTrafficLevel === 'HIGH' ? 'red' : 'green'}`}>
                            {highestTrafficLevel} LOAD
                          </span>
                        </div>

                        <div className="traffic-load-body">
                          {activeUnresolvedAlerts.length === 0 ? (
                            <div style={{ padding: '16px', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
                              No current traffic data available
                            </div>
                          ) : (
                            <>
                              <div className="load-meter-header">
                                <span className="meter-lbl">TRAFFIC LOAD CAPACITY</span>
                                <span className={`meter-val ${highestTrafficLevel === 'HIGH' ? 'red' : 'green'}`}>{trafficLoadPercent}%</span>
                              </div>

                              <div className="load-progress-bar-track">
                                <div className={`load-progress-bar-fill ${highestTrafficLevel === 'HIGH' ? 'red' : 'green'}`} style={{ width: `${trafficLoadPercent}%` }}></div>
                              </div>

                              <div className="load-details-grid">
                                <div className="load-stat-box">
                                  <span className="lbl">Current Level</span>
                                  <span className={`val ${highestTrafficLevel === 'HIGH' ? 'red' : 'green'}`}>{highestTrafficLevel}</span>
                                </div>
                                <div className="load-stat-box">
                                  <span className="lbl">Vehicles Counted</span>
                                  <span className="val">{currentHighestVehicles} Vehicles</span>
                                </div>
                                <div className="load-stat-box">
                                  <span className="lbl">Active Alerts</span>
                                  <span className="val">{activeAlertsCount} Alerts</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="units-panel-card">
                        <div className="panel-card-header">
                          <div className="header-title-flex">
                            <Activity size={18} color="#2563eb" />
                            <h3>LIVE TRAFFIC MONITORING</h3>
                          </div>
                          <span className="unit-count-txt">{alerts.length} Records</span>
                        </div>

                        <div className="police-units-list">
                          {alerts.length === 0 ? (
                            <div style={{ padding: '16px', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
                              No active routes being monitored.
                            </div>
                          ) : (
                            alerts.map((r, i) => (
                              <div key={i} className="monitored-route-row">
                                <div className="route-info-flex">
                                  <Navigation size={14} color="#2563eb" />
                                  <span className="route-name-txt">{r.source || r.location} → {r.destination || 'Corridor'}</span>
                                </div>
                                <div className="route-status-flex">
                                  <span className={`traffic-level-tag ${(r.traffic_level || 'NORMAL').toLowerCase()}`}>
                                    ● {r.traffic_level}
                                  </span>
                                  <span className="route-count-txt">{r.vehicle_count} vehicles</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TRAFFIC ALERT HISTORY SUMMARY ON DASHBOARD */}
                  <section className="incidents-table-section" style={{ marginTop: '24px' }}>
                    <div className="panel-card-header">
                      <div className="header-title-flex">
                        <Clock size={18} color="#2563eb" />
                        <h3>TRAFFIC ALERT HISTORY</h3>
                      </div>
                      <span className="unit-count-txt">{alerts.length} Timeline Records</span>
                    </div>

                    <div className="alert-timeline-list">
                      {alerts.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.84rem' }}>
                          No traffic alert history recorded yet.
                        </div>
                      ) : (
                        alerts.map((incident, i) => {
                          const badge = getStatusBadge(incident.status);
                          const isResolved = incident.status === 'RESOLVED';
                          return (
                            <div key={incident.id} className="timeline-item-row">
                              <div className="timeline-marker-col">
                                <span className={`timeline-dot ${isResolved ? 'resolved' : 'active'}`}></span>
                                {i < alerts.length - 1 && <span className="timeline-line"></span>}
                              </div>

                              <div className="timeline-content-card">
                                <div className="timeline-card-header">
                                  <span className="timeline-time-txt">● {incident.detected_at}</span>
                                  <span className={`severity-badge ${(incident.traffic_level || 'HIGH').toLowerCase()}`}>
                                    {incident.traffic_level}
                                  </span>
                                </div>
                                <div className="timeline-route-txt">
                                  {incident.source || 'Origin'} → {incident.destination || 'Destination'} ({incident.location})
                                </div>
                                <div className="timeline-footer-row">
                                  <span className="timeline-count">{incident.vehicle_count} Vehicles</span>
                                  <span className={`status-pill-badge ${badge.className}`}>{badge.label}</span>
                                  <button
                                    type="button"
                                    className="table-view-btn"
                                    onClick={() => setSelectedAlert(incident)}
                                  >
                                    View Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </section>
                </>
              )}

              {/* VIEW 2: LIVE ALERTS ONLY */}
              {activeTab === 'live-alerts' && (
                <div className="alerts-panel-column" style={{ width: '100%' }}>
                  <div className="panel-card-header">
                    <div className="header-title-flex">
                      <ShieldAlert size={18} color="#ef4444" />
                      <h3>LIVE TRAFFIC ALERTS</h3>
                    </div>
                    <span className="live-stream-badge">AI REAL-TIME FEED</span>
                  </div>

                  <div className="alerts-cards-list" style={{ marginTop: '12px' }}>
                    {activeUnresolvedAlerts.length === 0 ? (
                      <div className="empty-alert-state" style={{ background: '#ffffff', padding: '40px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <CheckCircle2 size={36} color="#10b981" />
                        <h4>✓ ALL CLEAR</h4>
                        <p>No active traffic police alerts. The system is monitoring traffic continuously.</p>
                      </div>
                    ) : (
                      activeUnresolvedAlerts.map(alert => {
                        const badge = getStatusBadge(alert.status);
                        return (
                          <div key={alert.id} className="alert-item-card high-severity" style={{ marginBottom: '12px' }}>
                            <div className="alert-card-top-row">
                              <div className="alert-title-group">
                                <span className="alert-pulse-dot red"></span>
                                <div>
                                  <h4 className="alert-location-name">🚨 {alert.traffic_level} TRAFFIC</h4>
                                  <span className="alert-route-path">{alert.source || 'Origin'} → {alert.destination || 'Destination'}</span>
                                </div>
                              </div>
                              <span className="alert-notif-status">✓ Message sent to Traffic Police</span>
                            </div>

                            <div className="alert-metrics-row">
                              <div className="metric-chip">
                                <span className="lbl">Detected Vehicles</span>
                                <span className="val">{alert.vehicle_count} Vehicles</span>
                              </div>
                              <div className="metric-chip">
                                <span className="lbl">ML Prediction</span>
                                <span className="val red">{alert.traffic_level} Congestion</span>
                              </div>
                              <div className="metric-chip">
                                <span className="lbl">Time</span>
                                <span className="val">{alert.detected_at}</span>
                              </div>
                            </div>

                            <div className="alert-card-footer">
                              <span className={`status-pill-badge ${badge.className}`}>{badge.label}</span>
                              <div className="alert-actions-group">
                                <button
                                  type="button"
                                  className="view-details-btn"
                                  onClick={() => setSelectedAlert(alert)}
                                >
                                  <span>View Details</span>
                                  <ChevronRight size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="resolve-mini-btn"
                                  onClick={() => handleResolveAlert(alert.alert_id)}
                                >
                                  <Check size={13} />
                                  <span>Resolve</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* VIEW 3: AI AUTO-CHALLAN MODULE ONLY */}
              {activeTab === 'auto-challan' && (
                <div className="police-auto-challan-container" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <AIAutoChallan />
                </div>
              )}

              {/* VIEW 4: TRAFFIC MAP ONLY (TOMTOM ORBIS ENGINE) */}
              {activeTab === 'traffic-map' && (
                <div className="full-map-view-container">
                  <div className="panel-card-header">
                    <div className="header-title-flex">
                      <Navigation size={20} color="#2563eb" />
                      <h3>CITY-WIDE LIVE TRAFFIC CONTROL MAP (TOMTOM ORBIS)</h3>
                    </div>
                    <span className="unit-count-txt" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                      TOMTOM ORBIS MAP ENGINE
                    </span>
                  </div>
                  <div className="full-map-wrapper" style={{ position: 'relative' }}>
                    {isMapLoading && (
                      <div className="tomtom-map-overlay-box loading" style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10,
                        background: '#ffffff',
                        padding: '16px 24px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div className="spinner-glow" style={{ width: '22px', height: '22px', border: '3px solid rgba(37, 99, 235, 0.15)', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#2563eb' }}>Loading TomTom map...</span>
                      </div>
                    )}

                    {mapError && (
                      <div className="tomtom-map-overlay-box error" style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10,
                        background: '#ffffff',
                        padding: '16px 24px',
                        borderRadius: '12px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <AlertTriangle size={20} color="#ef4444" />
                        <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ef4444' }}>{mapError}</span>
                      </div>
                    )}

                    <div ref={mapContainerRef} className="police-leaflet-container full-height" />
                  </div>
                </div>
              )}

              {/* VIEW 5: POLICE UNITS ONLY */}
              {activeTab === 'police-units' && (
                <div className="police-units-view-container">
                  <div className="panel-card-header">
                    <div className="header-title-flex">
                      <Users size={20} color="#2563eb" />
                      <h3>TRAFFIC POLICE PATROL & UNIT MANAGEMENT</h3>
                    </div>
                  </div>
                  <div className="units-grid-display">
                    {units.length === 0 ? (
                      <div style={{ padding: '30px', fontSize: '0.84rem', color: '#64748b', textAlign: 'center' }}>
                        No patrol units registered in database.
                      </div>
                    ) : (
                      units.map(unit => (
                        <div key={unit.id} className="unit-detail-card">
                          <div className="unit-card-header">
                            <Shield size={24} color="#2563eb" />
                            <div>
                              <h4>{unit.unit_code}</h4>
                              <span>{unit.officer_name}</span>
                            </div>
                            <span className={`unit-status-pill ${unit.status.toLowerCase()}`}>
                              ● {unit.status}
                            </span>
                          </div>
                          <div className="unit-card-body">
                            <div className="unit-detail-row">
                              <MapPin size={14} />
                              <span>Stationed: {unit.location}</span>
                            </div>
                            <div className="unit-detail-row">
                              <Radio size={14} />
                              <span>Assigned Alert: {unit.current_alert_id || 'None'}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* VIEW 6: INCIDENT HISTORY ONLY */}
              {activeTab === 'incident-history' && (
                <section className="incidents-table-section">
                  <div className="panel-card-header">
                    <div className="header-title-flex">
                      <Clock size={18} color="#2563eb" />
                      <h3>TRAFFIC ALERT HISTORY</h3>
                    </div>
                    <span className="unit-count-txt">{alerts.length} Timeline Records</span>
                  </div>

                  <div className="alert-timeline-list">
                    {alerts.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.84rem' }}>
                        No traffic alert history recorded yet.
                      </div>
                    ) : (
                      alerts.map((incident, i) => {
                        const badge = getStatusBadge(incident.status);
                        const isResolved = incident.status === 'RESOLVED';
                        return (
                          <div key={incident.id} className="timeline-item-row">
                            <div className="timeline-marker-col">
                              <span className={`timeline-dot ${isResolved ? 'resolved' : 'active'}`}></span>
                              {i < alerts.length - 1 && <span className="timeline-line"></span>}
                            </div>

                            <div className="timeline-content-card">
                              <div className="timeline-card-header">
                                <span className="timeline-time-txt">● {incident.detected_at}</span>
                                <span className={`severity-badge ${(incident.traffic_level || 'HIGH').toLowerCase()}`}>
                                  {incident.traffic_level}
                                </span>
                              </div>
                              <div className="timeline-route-txt">
                                {incident.source || 'Origin'} → {incident.destination || 'Destination'} ({incident.location})
                              </div>
                              <div className="timeline-footer-row">
                                <span className="timeline-count">{incident.vehicle_count} Vehicles</span>
                                <span className={`status-pill-badge ${badge.className}`}>{badge.label}</span>
                                <button
                                  type="button"
                                  className="table-view-btn"
                                  onClick={() => setSelectedAlert(incident)}
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              )}

              {/* VIEW 7: REPORTS & ANALYTICS ONLY */}
              {activeTab === 'reports' && (
                <div className="police-reports-container" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
                  <TrafficReports 
                    t={{
                      bgSurface: '#ffffff',
                      bgElevated: '#f8fafc',
                      border: '#e2e8f0',
                      textPrimary: '#0f172a',
                      textSecondary: '#475569',
                      textMuted: '#94a3b8',
                      primary: '#2563eb',
                      primaryBg: 'rgba(37, 99, 235, 0.1)',
                      primaryBorder: 'rgba(37, 99, 235, 0.3)',
                      success: '#10b981',
                      warning: '#f59e0b',
                      danger: '#ef4444',
                      shadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }} 
                    handleDownloadCSV={(reportTitle) => {
                      let csvContent = "data:text/csv;charset=utf-8,ID,Timestamp,Location,Traffic_Level,Vehicle_Count,Status\n";
                      alerts.forEach(a => {
                        csvContent += `"${a.id}","${a.detected_at}","${a.location}","${a.traffic_level}","${a.vehicle_count}","${a.status}"\n`;
                      });
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `${reportTitle.replace(/[\s/]+/g, '_')}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }} 
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* DYNAMIC ALERT DETAILS MODAL */}
      {selectedAlert && (
        <div className="police-modal-overlay animate-fade-in">
          <div className="police-alert-modal-content animate-slide-up">
            <div className="modal-header-row">
              <div className="modal-title-group">
                <span className="modal-alert-icon">🚨</span>
                <div>
                  <h3>TRAFFIC INCIDENT</h3>
                  <span className="modal-subtitle">Route: {selectedAlert.source || 'Origin'} → {selectedAlert.destination || 'Destination'}</span>
                </div>
              </div>
              <button type="button" className="close-modal-btn" onClick={() => setSelectedAlert(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-content">
              {/* DETAILS GRID */}
              <div className="modal-details-grid">
                <div className="detail-item">
                  <span className="detail-lbl">Route</span>
                  <span className="detail-val">{selectedAlert.source || 'Origin'} → {selectedAlert.destination || 'Destination'}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-lbl">Location</span>
                  <span className="detail-val">{selectedAlert.location}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-lbl">Traffic Level</span>
                  <span className="detail-val red">{selectedAlert.traffic_level}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-lbl">Vehicle Count</span>
                  <span className="detail-val">{selectedAlert.vehicle_count} Vehicles</span>
                </div>

                <div className="detail-item">
                  <span className="detail-lbl">Prediction Time</span>
                  <span className="detail-val">{selectedAlert.detected_at}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-lbl">Notification</span>
                  <span className="detail-val green" style={{ fontWeight: 800 }}>✓ Message sent to Traffic Police</span>
                </div>

                <div className="detail-item">
                  <span className="detail-lbl">Status</span>
                  <span className={`status-pill-badge ${getStatusBadge(selectedAlert.status).className}`}>
                    {getStatusBadge(selectedAlert.status).label}
                  </span>
                </div>
              </div>

              {/* REASON & RECOMMENDED ACTION */}
              <div className="ai-recommendation-card">
                <div className="ai-card-title">
                  <Sparkles size={16} color="#2563eb" />
                  <span>AI TRAFFIC REASON & RECOMMENDED ACTION</span>
                </div>
                <p className="ai-recommendation-text">
                  "{selectedAlert.recommended_action || 'High congestion predicted by AI traffic model. Traffic management intervention recommended.'}"
                </p>
              </div>
            </div>

            {/* INTERACTIVE ACTION BUTTONS */}
            <div className="modal-action-buttons" style={{ display: 'flex', gap: '10px' }}>
              {selectedAlert.status !== 'RESOLVED' ? (
                <>
                  {selectedAlert.status === 'ALERT SENT' && (
                    <button
                      type="button"
                      className="view-details-btn"
                      onClick={() => handleAcknowledgeAlert(selectedAlert.alert_id)}
                    >
                      <span>Acknowledge</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="view-details-btn"
                    style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', border: '1px solid rgba(37, 99, 235, 0.3)' }}
                    onClick={() => handleOpenDispatchModal(selectedAlert)}
                  >
                    <span>Dispatch Patrol</span>
                  </button>
                  <button
                    type="button"
                    className="modal-action-btn resolve"
                    onClick={() => handleResolveAlert(selectedAlert.alert_id)}
                  >
                    <CheckCircle2 size={16} />
                    <span>Mark as Resolved</span>
                  </button>
                </>
              ) : (
                <div style={{ padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem' }}>
                  ✓ Incident Resolved
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH OFFICER MODAL */}
      {showDispatchModal && selectedAlert && (
        <div className="police-modal-overlay animate-fade-in">
          <div className="police-alert-modal-content animate-slide-up" style={{ maxWidth: '440px' }}>
            <div className="modal-header-row">
              <div className="modal-title-group">
                <Users size={20} color="#2563eb" />
                <h3>DISPATCH PATROL UNIT</h3>
              </div>
              <button type="button" className="close-modal-btn" onClick={() => setShowDispatchModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-content">
              <p style={{ fontSize: '0.84rem', color: '#475569', margin: 0 }}>
                Select available traffic police patrol unit to dispatch to <strong>{selectedAlert.location}</strong>:
              </p>

              <select
                value={selectedDispatchUnit}
                onChange={(e) => setSelectedDispatchUnit(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  background: '#f8fafc'
                }}
              >
                {units.map(u => (
                  <option key={u.id} value={u.unit_code}>
                    {u.unit_code} — {u.officer_name} ({u.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-action-buttons" style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="view-details-btn"
                onClick={() => setShowDispatchModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-action-btn resolve"
                onClick={handleConfirmDispatch}
                style={{ background: '#2563eb' }}
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrafficPoliceControlCenter;
