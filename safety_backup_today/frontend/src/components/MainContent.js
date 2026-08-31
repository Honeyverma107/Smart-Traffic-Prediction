import React, { useState, useEffect, useRef } from 'react';
import TrafficMap from './TrafficMap';
import PermissionDialog from './PermissionDialog';
import { indoreLocations } from '../utils/locations';
import flatpickr from 'flatpickr';

const MainContent = ({ onLogout }) => {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [sourceLatLng, setSourceLatLng] = useState(null);
  const [destinationLatLng, setDestinationLatLng] = useState(null);
  const [pinMode, setPinMode] = useState(null); // 'source' or 'destination' or null
  const pinModeRef = useRef(pinMode);
  
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('planner'); // 'planner' or 'signal'

  const datePickerRef = useRef(null);
  const timePickerRef = useRef(null);
  const [isUserModified, setIsUserModified] = useState(false);

  const formatDate = (dateObj) => {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (dateObj) => {
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const initialNow = new Date();
  const [date, setDate] = useState(formatDate(initialNow));
  const [time, setTime] = useState(formatTime(initialNow));

  const [selectedTransport, setSelectedTransport] = useState('car');
  const [trafficError, setTrafficError] = useState('');
  const [showPermissionDialog, setShowPermissionDialog] = useState(true);

  const [routes, setRoutes] = useState([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);

  useEffect(() => {
    pinModeRef.current = pinMode;
  }, [pinMode]);

  // Dynamic Live Clock Effect: Updates displayed date and time every 1 second
  useEffect(() => {
    if (isUserModified || activeWorkspaceTab !== 'planner') return;

    const updateLiveTime = () => {
      const currentTime = new Date();
      const formattedTime = formatTime(currentTime);
      const formattedDate = formatDate(currentTime);
      setTime(formattedTime);
      setDate(formattedDate);

      const timeEl = document.getElementById('time');
      const dateEl = document.getElementById('date');

      if (timePickerRef.current && typeof timePickerRef.current.setDate === 'function' && timeEl) {
        try {
          timePickerRef.current.setDate(currentTime, false);
        } catch (e) {}
      }
      if (datePickerRef.current && typeof datePickerRef.current.setDate === 'function' && dateEl) {
        try {
          datePickerRef.current.setDate(currentTime, false);
        } catch (e) {}
      }
    };

    updateLiveTime();
    const timer = setInterval(updateLiveTime, 1000);

    return () => clearInterval(timer);
  }, [isUserModified, activeWorkspaceTab]);

  useEffect(() => {
    setShowPermissionDialog(true);

    if (activeWorkspaceTab !== 'planner') return;

    const dateElem = document.getElementById('date');
    const timeElem = document.getElementById('time');
    if (!dateElem || !timeElem) return;

    const initialDate = new Date();

    // Initialize flatpickr date & time pickers safely
    try {
      datePickerRef.current = flatpickr(dateElem, {
        dateFormat: "d-m-Y",
        defaultDate: initialDate,
        onChange: (selectedDates, dateStr) => {
          setIsUserModified(true);
          setDate(dateStr.toString());
          clearRoutesState();
        }
      });
    } catch (e) {
      console.warn("Date flatpickr init error:", e);
    }

    try {
      timePickerRef.current = flatpickr(timeElem, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "h:i K",
        defaultDate: initialDate,
        time_24hr: false,
        onChange: (selectedDates, timeStr) => {
          setIsUserModified(true);
          setTime(timeStr);
          clearRoutesState();
        }
      });
    } catch (e) {
      console.warn("Time flatpickr init error:", e);
    }

    return () => {
      if (datePickerRef.current && typeof datePickerRef.current.destroy === 'function') {
        try { datePickerRef.current.destroy(); } catch (e) {}
        datePickerRef.current = null;
      }
      if (timePickerRef.current && typeof timePickerRef.current.destroy === 'function') {
        try { timePickerRef.current.destroy(); } catch (e) {}
        timePickerRef.current = null;
      }
    };
  }, [activeWorkspaceTab]);

  const clearRoutesState = () => {
    setRoutes([]);
    setSelectedRouteIdx(0);
    setTrafficError('');
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setTrafficError("Unable to get current location. Geolocation is not supported by your browser.");
      return;
    }
    setIsLoadingRoutes(true);
    setTrafficError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = new Date(position.timestamp || Date.now()).toISOString();

        console.log(`[MainContent Geolocation Success] Lat: ${latitude}, Lng: ${longitude}, Accuracy: ${accuracy}m, Timestamp: ${timestamp}`);

        const exactCoords = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
        setSourceLatLng(exactCoords);

        let address = `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
          const resp = await fetch(url);
          const data = await resp.json();
          if (data && data.display_name) {
            address = data.display_name;
          }
        } catch (e) {
          console.warn('[MainContent] Reverse geocoding error:', e);
        }

        setSource(address);
        setIsLoadingRoutes(false);
        clearRoutesState();
      },
      (error) => {
        console.warn(`[MainContent Geolocation Error] Code ${error.code}: ${error.message}`);
        setIsLoadingRoutes(false);
        setSourceLatLng(null);
        setTrafficError(`Unable to get current location. ${error.message || 'Please check browser permissions.'}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handlePermission = (allowed, locationData, errorMsg) => {
    setShowPermissionDialog(false);
    if (allowed && locationData) {
      const { latitude, longitude, accuracy, timestamp, address } = locationData;
      const exactCoords = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;

      console.log(`[Permission Callback Success] Lat: ${latitude}, Lng: ${longitude}, Accuracy: ${accuracy}m, Timestamp: ${timestamp}`);

      setSourceLatLng(exactCoords);
      setSource(address || `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
      clearRoutesState();
    } else if (allowed) {
      handleUseCurrentLocation();
    } else if (errorMsg) {
      setTrafficError(`Unable to get current location: ${errorMsg}`);
    }
  };

  const handleTransportChange = (transport) => {
    setSelectedTransport(transport);
    clearRoutesState();
  };

  const swapSourceAndDestination = () => {
    const tempSource = source;
    const tempSourceLatLng = sourceLatLng;

    setSource(destination);
    setSourceLatLng(destinationLatLng);

    setDestination(tempSource);
    setDestinationLatLng(tempSourceLatLng);

    clearRoutesState();
  };

  const parseLatLng = (coords) => coords.split(',').map(Number);

  // Calculate arrival ETA from trip time and route duration in minutes
  const calculateETA = (departureTimeStr, durationMinutes) => {
    try {
      const timePart = departureTimeStr.replace(/AM|PM/i, '').trim();
      let [hours, minutes] = timePart.split(':').map(Number);
      const isPM = /PM/i.test(departureTimeStr);
      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;

      const currentDate = new Date();
      const depDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hours, minutes);
      const etaDate = new Date(depDate.getTime() + durationMinutes * 60000);

      let etaHours = etaDate.getHours();
      const etaMinutes = String(etaDate.getMinutes()).padStart(2, '0');
      const ampm = etaHours >= 12 ? 'PM' : 'AM';
      etaHours = etaHours % 12 || 12;

      return `${etaHours}:${etaMinutes} ${ampm}`;
    } catch (e) {
      return '--:--';
    }
  };

  const geocodePlace = async (place) => {
    if (!place || !place.trim()) {
      throw new Error("Location cannot be empty.");
    }

    const trimmed = place.trim();

    // Direct lat,lng match
    if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(trimmed)) {
      return trimmed;
    }

    // Embedded GPS format: "Location (lat, lng)"
    const gpsMatch = trimmed.match(/\((-?\d+\.\d+),\s*(-?\d+\.\d+)\)/);
    if (gpsMatch) {
      return `${parseFloat(gpsMatch[1]).toFixed(6)},${parseFloat(gpsMatch[2]).toFixed(6)}`;
    }

    // Exact match in indoreLocations dictionary
    if (indoreLocations[trimmed]) {
      return indoreLocations[trimmed];
    }

    // Nominatim geocoding fallback
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1`;
    try {
      const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await resp.json();
      if (data && data.length > 0) {
        return `${data[0].lat},${data[0].lon}`;
      }
    } catch (e) {
      console.error('Geocoding error:', e);
    }

    // Case-insensitive dictionary lookup fallback
    const knownLocations = Object.keys(indoreLocations);
    for (const knownLocation of knownLocations) {
      if (trimmed.toLowerCase() === knownLocation.toLowerCase()) {
        return indoreLocations[knownLocation];
      }
    }

    throw new Error(`Location "${place}" not found. Please try selecting by map pin or choosing from suggestions.`);
  };

  const handleRouteRequest = async () => {
    if (!source || !destination) {
      setTrafficError("Please check your source and destination.");
      return;
    }
    setIsLoadingRoutes(true);
    setTrafficError('');

    try {
      let sourceCoords = sourceLatLng;
      let destinationCoords = destinationLatLng;

      if (!sourceCoords) {
        sourceCoords = await geocodePlace(source);
        setSourceLatLng(sourceCoords);
      }
      if (!destinationCoords) {
        destinationCoords = await geocodePlace(destination);
        setDestinationLatLng(destinationCoords);
      }

      const [sourceLat, sourceLng] = parseLatLng(sourceCoords);
      const [destinationLat, destinationLng] = parseLatLng(destinationCoords);
      const mode = selectedTransport === 'bike' ? 'bike' : selectedTransport === 'walk' ? 'walk' : 'car';

      const finalSourceStr = `${sourceLat},${sourceLng}`;
      const finalDestStr = `${destinationLat},${destinationLng}`;

      console.log(`[Route Request] Exact Source Coords Sent to Backend: '${finalSourceStr}' | Destination: '${finalDestStr}' | Mode: '${mode}'`);

      const apiUrl = '/api/routes/';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      let response;
      const requestBody = JSON.stringify({
        source: finalSourceStr,
        destination: finalDestStr,
        travel_mode: mode,
        date_time: new Date().toISOString()
      });

      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody,
          signal: controller.signal
        });
      } catch (proxyErr) {
        if (controller.signal.aborted) throw proxyErr;
        response = await fetch('http://127.0.0.1:8000/api/routes/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody,
          signal: controller.signal
        });
      }
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setRoutes(data);
          setSelectedRouteIdx(0);
          setTrafficError('');
        } else {
          setTrafficError("No route found between the specified locations.");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setTrafficError(errorData.error || errorData.detail || "Traffic service is temporarily unavailable. Please try again.");
      }
    } catch (err) {
      console.error("Route calculation error:", err);
      if (err.name === 'AbortError') {
        setTrafficError("Traffic calculation timed out. Please try again.");
      } else {
        setTrafficError(err.message || "Unable to calculate routes. Please check your locations.");
      }
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  const getNameFromCords = async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      const resp = await fetch(url);
      const data = await resp.json();
      return data.display_name;
    } catch (error) {
      return null;
    }
  };

  const handleMapClick = async (coords) => {
    let target = pinModeRef.current;
    if (target !== 'source' && target !== 'destination') {
      if (!source) target = 'source';
      else if (!destination) target = 'destination';
      else return; // Don't overwrite pins on click if both exist and pinMode is null
    }

    const [lat, lng] = coords.split(',').map(Number);
    const address = await getNameFromCords(lat, lng) || `${lat.toFixed(6)},${lng.toFixed(6)}`;

    if (target === 'source') {
      setSourceLatLng(coords);
      setSource(address);
      setPinMode(null);
    } else if (target === 'destination') {
      setDestinationLatLng(coords);
      setDestination(address);
      setPinMode(null);
    }

    clearRoutesState();
  };

  const handleSourceInputChange = (val) => {
    setSource(val);
    setSourceLatLng(null);
    clearRoutesState();

    if (val.trim().length > 1) {
      const filtered = Object.keys(indoreLocations).filter(loc => 
        loc.toLowerCase().includes(val.toLowerCase())
      );
      setSourceSuggestions(filtered.slice(0, 5));
    } else {
      setSourceSuggestions([]);
    }
  };

  const handleDestInputChange = (val) => {
    setDestination(val);
    setDestinationLatLng(null);
    clearRoutesState();

    if (val.trim().length > 1) {
      const filtered = Object.keys(indoreLocations).filter(loc => 
        loc.toLowerCase().includes(val.toLowerCase())
      );
      setDestinationSuggestions(filtered.slice(0, 5));
    } else {
      setDestinationSuggestions([]);
    }
  };

  const [signalData, setSignalData] = useState(null);
  const [isLoadingSignal, setIsLoadingSignal] = useState(false);

  // Fetch Live Signal Status & Telemetry
  const fetchSignalTiming = async () => {
    setIsLoadingSignal(true);
    try {
      let resp;
      try {
        resp = await fetch('/api/signal-timing/', { method: 'POST' });
      } catch (e) {
        resp = await fetch('http://127.0.0.1:8000/api/signal-timing/', { method: 'POST' });
      }
      if (resp.ok) {
        const data = await resp.json();
        setSignalData(data);
      }
    } catch (err) {
      console.warn("Signal timing fetch error:", err);
    } finally {
      setIsLoadingSignal(false);
    }
  };

  useEffect(() => {
    fetchSignalTiming();
    const interval = setInterval(fetchSignalTiming, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="mainContent">
      {/* Sidebar Navigation & Control Workspace */}
      <aside className="sidebar glass-panel">
        {/* Workspace Mode Switcher */}
        <div className="workspace-tabs-header">
          <button 
            className={`workspace-tab-btn ${activeWorkspaceTab === 'planner' ? 'active' : ''}`}
            onClick={() => setActiveWorkspaceTab('planner')}
          >
            <span className="material-symbols-outlined icon">explore</span>
            Journey Planner
          </button>
          <button 
            className={`workspace-tab-btn ${activeWorkspaceTab === 'signal' ? 'active' : ''}`}
            onClick={() => { setActiveWorkspaceTab('signal'); fetchSignalTiming(); }}
          >
            <span className="material-symbols-outlined icon" style={{ color: '#ef4444' }}>traffic</span>
            Signal Timing
            <span className="live-dot"></span>
          </button>
        </div>

        {activeWorkspaceTab === 'signal' ? (
          <div className="sidebar-section animated-fade-in">
            <div className="section-header-row">
              <h2 className="section-title">LIVE TRAFFIC SIGNAL STATUS</h2>
              <button className="clear-all-btn" onClick={fetchSignalTiming} disabled={isLoadingSignal}>
                {isLoadingSignal ? 'Updating...' : 'Refresh'}
              </button>
            </div>

            {signalData ? (
              <div className="signal-workspace-container">
                <div className="signal-meta-card glass-card">
                  <div className="meta-row">
                    <span className="meta-label">Intersection:</span>
                    <span className="meta-value">{signalData.intersection}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Cycle Time:</span>
                    <span className="meta-value highlight">{signalData.cycle_time_sec} sec</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Active Phase:</span>
                    <span className="meta-value phase-badge">{signalData.active_phase?.toUpperCase()}</span>
                  </div>
                </div>

                <div className="signal-summary-box">
                  <span className="material-symbols-outlined icon">lightbulb</span>
                  <span>{signalData.recommendation_summary}</span>
                </div>

                {/* 4-Directional Grid */}
                <div className="directional-signals-grid">
                  {Object.entries(signalData.directions || {}).map(([dirKey, dInfo]) => {
                    const isHigh = dInfo.congestion === 'HIGH';
                    const isMed = dInfo.congestion === 'MEDIUM';
                    const badgeClass = isHigh ? 'red' : isMed ? 'orange' : 'green';
                    const counts = dInfo.vehicle_counts || {};

                    return (
                      <div key={dirKey} className={`glass-card direction-card ${signalData.active_phase === dirKey ? 'active-phase' : ''}`}>
                        <div className="dir-header">
                          <div className="dir-name-group">
                            <span className="dir-key-tag">{dirKey.toUpperCase()}</span>
                            <span className="dir-full-name">{dInfo.name}</span>
                          </div>
                          <span className={`traffic-badge ${badgeClass}`}>{dInfo.congestion}</span>
                        </div>

                        <div className="dir-metrics-row">
                          <div className="dir-metric">
                            <span className="lbl">Vehicles</span>
                            <span className="val">{dInfo.total_vehicles}</span>
                          </div>
                          <div className="dir-metric">
                            <span className="lbl">PCE Density</span>
                            <span className="val">{dInfo.pce_volume}</span>
                          </div>
                          <div className="dir-metric">
                            <span className="lbl">Wait Time</span>
                            <span className="val">{dInfo.waiting_time_sec}s</span>
                          </div>
                        </div>

                        {/* Vehicle Count Breakdown Badges */}
                        <div className="vehicle-pills-row">
                          <span className="v-pill">🚗 {counts.car_count || 0}</span>
                          <span className="v-pill">🏍️ {counts.bike_count || 0}</span>
                          <span className="v-pill">🚌 {counts.bus_count || 0}</span>
                          <span className="v-pill">🚚 {counts.truck_count || 0}</span>
                        </div>

                        <div className="recommended-green-box">
                          <div className="green-time-display">
                            <span className="material-symbols-outlined icon green">timer</span>
                            <span>RECOMMENDED GREEN:</span>
                            <span className="green-sec-val">{dInfo.green_time_sec} sec</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Historical + Recent Dataset Provenance Info */}
                <div className="dataset-provenance-card glass-card">
                  <h4 className="card-subhead">DATASET & ML PIPELINE INTEGRATION</h4>
                  <ul className="provenance-list">
                    <li><strong>Historical Traffic:</strong> Indore Survey Records (2022–2024)</li>
                    <li><strong>Recent Traffic:</strong> Indore ITMS Telemetry (2025–2026)</li>
                    <li><strong>Model Weighting:</strong> Exponential Recency Decay ($w \in [0.25, 1.0]$)</li>
                    <li><strong>YOLO Vision:</strong> Real-time Object Tracking</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="auth-loading-state">
                <span className="loading-spinner"></span>
                <span>Calculating dynamic signal timing...</span>
              </div>
            )}
          </div>
        ) : (
          <React.Fragment>
            <div className="sidebar-section">
              <div className="section-header-row">
                <h2 className="section-title">PLAN YOUR JOURNEY</h2>
              {(source || destination) && (
                <button 
                  type="button" 
                  className="clear-all-btn"
                  onClick={() => {
                    setSource('');
                    setDestination('');
                    setSourceLatLng(null);
                    setDestinationLatLng(null);
                    setIsUserModified(false);
                    clearRoutesState();
                  }}
                >
                  Clear
                </button>
              )}
            </div>

          <div className="form-container">
            {/* Source Input */}
            <div className="input-group">
              <label htmlFor="source">
                <span className="material-symbols-outlined label-icon green">trip_origin</span>
                Starting Point
              </label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">search</span>
                <input
                  type="text"
                  id="source"
                  placeholder="Vijay Nagar, Indore..."
                  autoComplete="off"
                  value={source}
                  onChange={(e) => handleSourceInputChange(e.target.value)}
                />
                {source && (
                  <button 
                    type="button" 
                    className="input-clear-btn" 
                    onClick={() => { setSource(''); setSourceLatLng(null); clearRoutesState(); }}
                  >
                    ✕
                  </button>
                )}
                <button 
                  type="button"
                  className="pin-btn"
                  onClick={handleUseCurrentLocation}
                  title="Use My Current GPS Location"
                  style={{ color: '#10b981' }}
                >
                  <span className="material-symbols-outlined">my_location</span>
                </button>
                <button 
                  type="button"
                  className={`pin-btn ${pinMode === 'source' ? 'active' : ''}`}
                  onClick={() => setPinMode(pinMode === 'source' ? null : 'source')}
                  title="Click to place source pin on map"
                >
                  <span className="material-symbols-outlined">location_searching</span>
                </button>
              </div>

              {sourceSuggestions.length > 0 && (
                <div className="autocomplete-dropdown glass-card">
                  {sourceSuggestions.map(loc => (
                    <div 
                      key={loc}
                      className="autocomplete-item"
                      onClick={() => {
                        setSource(loc);
                        setSourceLatLng(indoreLocations[loc]);
                        setSourceSuggestions([]);
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#9ca3af' }}>location_on</span>
                      {loc}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="swap-row">
              <button 
                type="button" 
                className="swap-btn" 
                onClick={swapSourceAndDestination}
                title="Swap Starting Point & Destination"
              >
                <span className="material-symbols-outlined">swap_vert</span>
              </button>
            </div>

            {/* Destination Input */}
            <div className="input-group">
              <label htmlFor="destination">
                <span className="material-symbols-outlined label-icon red">location_on</span>
                Where do you want to go?
              </label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">search</span>
                <input
                  type="text"
                  id="destination"
                  placeholder="Mahalaxmi Nagar, Palasia..."
                  autoComplete="off"
                  value={destination}
                  onChange={(e) => handleDestInputChange(e.target.value)}
                />
                {destination && (
                  <button 
                    type="button" 
                    className="input-clear-btn" 
                    onClick={() => { setDestination(''); setDestinationLatLng(null); clearRoutesState(); }}
                  >
                    ✕
                  </button>
                )}
                <button 
                  type="button"
                  className={`pin-btn ${pinMode === 'destination' ? 'active' : ''}`}
                  onClick={() => setPinMode(pinMode === 'destination' ? null : 'destination')}
                  title="Click to place destination pin on map"
                >
                  <span className="material-symbols-outlined">location_searching</span>
                </button>
              </div>

              {destinationSuggestions.length > 0 && (
                <div className="autocomplete-dropdown glass-card">
                  {destinationSuggestions.map(loc => (
                    <div 
                      key={loc}
                      className="autocomplete-item"
                      onClick={() => {
                        setDestination(loc);
                        setDestinationLatLng(indoreLocations[loc]);
                        setDestinationSuggestions([]);
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#9ca3af' }}>location_on</span>
                      {loc}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date & Time Row */}
            <div className="form-row">
              <div className="input-group">
                <label htmlFor="date">
                  <span className="material-symbols-outlined label-icon">calendar_month</span>
                  Travel Date
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="date"
                    className="flatpickr-input"
                    value={date}
                    readOnly
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="time">
                  <span className="material-symbols-outlined label-icon">schedule</span>
                  Departure Time
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="time"
                    className="flatpickr-input"
                    value={time}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Travel Mode Section */}
        <div className="sidebar-section">
          <h2 className="section-title">TRAVEL MODE</h2>
          <div className="transport-options">
            <button
              type="button"
              className={`transport-btn ${selectedTransport === 'car' ? 'active' : ''}`}
              onClick={() => handleTransportChange('car')}
            >
              <span className="material-symbols-outlined">directions_car</span>
              CAR
            </button>
            <button
              type="button"
              className={`transport-btn ${selectedTransport === 'bike' ? 'active' : ''}`}
              onClick={() => handleTransportChange('bike')}
            >
              <span className="material-symbols-outlined">two_wheeler</span>
              BIKE
            </button>
            <button
              type="button"
              className={`transport-btn ${selectedTransport === 'walk' ? 'active' : ''}`}
              onClick={() => handleTransportChange('walk')}
            >
              <span className="material-symbols-outlined">directions_walk</span>
              WALK
            </button>
          </div>

          <button 
            type="button"
            id="routeBtn" 
            className="optimize-cta-btn"
            onClick={handleRouteRequest} 
            disabled={isLoadingRoutes}
          >
            {isLoadingRoutes ? (
              <>
                <span className="loading-spinner"></span>
                Analyzing traffic...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">auto_awesome</span>
                Optimize Route
              </>
            )}
          </button>
        </div>

        {/* Error Alert Display */}
        {trafficError && (
          <div className="error-card glass-card">
            <span className="material-symbols-outlined error-icon">warning</span>
            <div className="error-text-content">
              <strong>{trafficError}</strong>
              <p>Please verify your starting point and destination or try again.</p>
            </div>
          </div>
        )}

        {/* Empty State before route calculation */}
        {!routes.length && !isLoadingRoutes && !trafficError && (
          <div className="empty-state-card glass-card">
            <div className="empty-state-icon">
              <span className="material-symbols-outlined">map</span>
            </div>
            <h3>Plan your journey</h3>
            <p>
              Enter your starting point and destination to discover optimized routes and traffic conditions.
            </p>
          </div>
        )}

        {/* Loading Indicator Panel */}
        {isLoadingRoutes && (
          <div className="loading-panel glass-card">
            <span className="loading-spinner large"></span>
            <h4>Finding the best route...</h4>
            <p>Processing Random Forest ML models and road network graph...</p>
          </div>
        )}

        {/* Optimized Routes List */}
        {routes.length > 0 && !isLoadingRoutes && (
          <div className="results-panel">
            <div className="results-header-row">
              <h2 className="section-title">RECOMMENDED ROUTES</h2>
              <span className="results-count">{routes.length} Available</span>
            </div>

            <div className="route-cards-list">
              {routes.map((r, idx) => {
                const nameUpper = (r.route_name || '').toUpperCase();
                const displayTitle = nameUpper.includes('FAST')
                  ? 'FASTEST ROUTE' 
                  : nameUpper.includes('BALANC')
                    ? 'BALANCED ROUTE' 
                    : 'LOW-TRAFFIC ROUTE';
                
                // STRICT Traffic Status Color mapping from existing API response (predicted_congestion or congestion_level):
                // LOW -> Green (green)
                // NORMAL / MEDIUM -> Yellow/Orange (orange)
                // HIGH -> Red (red)
                const rawCong = (r.predicted_congestion || r.congestion_level || 'low').toString().toLowerCase();
                const isGreen = rawCong.includes('low') || rawCong.includes('smooth');
                const isRed = rawCong.includes('high') || rawCong.includes('heavy');
                
                const congClass = isGreen ? 'green' : isRed ? 'red' : 'orange';
                const congLabel = isGreen ? '🟢 LOW' : isRed ? '🔴 HIGH' : '🟡 NORMAL / MEDIUM';
                
                const displayTimeMin = (r.total_time_min && r.total_time_min > 0) ? r.total_time_min : 1;
                const routeETA = calculateETA(time, displayTimeMin);
                const delayVal = r.delay_min !== undefined ? r.delay_min : 0;

                // Traffic Insight message based on actual backend metrics
                const aiInsight = r.right_time_reason || (
                  congClass === 'green'
                    ? "Traffic is currently expected to remain low on this route."
                    : congClass === 'orange'
                      ? "Normal traffic congestion predicted along primary segments."
                      : "Heavy congestion is predicted on parts of this route."
                );

                return (
                  <div
                    key={idx}
                    className={`glass-card route-card route-${idx} ${idx === selectedRouteIdx ? 'selected' : ''}`}
                    onClick={() => setSelectedRouteIdx(idx)}
                  >
                    <div className="card-top-bar">
                      <div className="route-title-group">
                        <span className="route-title">{displayTitle}</span>
                        {r.recommended && <span className="ai-badge">AI RECOMMENDED</span>}
                      </div>
                      <span className={`traffic-badge ${congClass}`}>
                        {congLabel}
                      </span>
                    </div>

                    <div className="card-metrics-grid">
                      <div className="metric-item">
                        <span className="metric-val">{displayTimeMin} <span className="unit">min</span></span>
                        <span className="metric-lbl">Duration</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-val">{r.total_distance_km} <span className="unit">km</span></span>
                        <span className="metric-lbl">Distance</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-val">{routeETA}</span>
                        <span className="metric-lbl">ETA</span>
                      </div>
                      {delayVal !== undefined && (
                        <div className="metric-item">
                          <span className={`metric-val ${delayVal > 0 ? 'delay-red' : 'delay-green'}`}>
                            +{delayVal} <span className="unit">min</span>
                          </span>
                          <span className="metric-lbl">Delay</span>
                        </div>
                      )}
                    </div>

                    {/* Right Time To Go & Future Traffic Range Forecast Panel */}
                    {r.right_time_to_go && (() => {
                      const bestForecastItem = Array.isArray(r.traffic_forecast) && r.traffic_forecast.length > 0
                        ? (r.right_time_to_go === 'Leave Now' 
                            ? r.traffic_forecast[0] 
                            : (r.traffic_forecast.find(f => f.departure_time === r.right_time_to_go) || r.traffic_forecast[0]))
                        : null;

                      return (
                        <div className="right-time-container">
                          {/* RIGHT TIME TO GO SUMMARY CARD */}
                          <div className="right-time-card">
                            <div className="right-time-header">
                              <span className="material-symbols-outlined icon">schedule</span>
                              <span className="rt-title">RIGHT TIME TO GO</span>
                              <span className="right-time-badge">{r.right_time_to_go}</span>
                            </div>

                            <div className="right-time-details-grid">
                              <div className="rt-detail-item">
                                <span className="lbl">Best time:</span>
                                <span className="val highlight-green">{r.right_time_to_go}</span>
                              </div>
                              <div className="rt-detail-item">
                                <span className="lbl">Current traffic:</span>
                                <span className={`val cong-tag ${(r.predicted_congestion || 'low').toLowerCase()}`}>
                                  {r.predicted_congestion || 'LOW'}
                                </span>
                              </div>
                              <div className="rt-detail-item">
                                <span className="lbl">Expected traffic ({r.right_time_to_go === 'Leave Now' ? 'Now' : r.right_time_to_go}):</span>
                                <span className={`val cong-tag ${(bestForecastItem?.traffic_level || r.predicted_congestion || 'low').toLowerCase()}`}>
                                  {bestForecastItem?.traffic_level || r.predicted_congestion || 'LOW'}
                                </span>
                              </div>
                              <div className="rt-detail-item">
                                <span className="lbl">Expected vehicles:</span>
                                <span className="val vehicle-range-highlight">
                                  {bestForecastItem?.vehicle_count_range
                                    ? `${bestForecastItem.vehicle_count_range.min}–${bestForecastItem.vehicle_count_range.max} vehicles`
                                    : `${r.current_vehicle_count || 0} vehicles`}
                                </span>
                              </div>
                              <div className="rt-detail-item">
                                <span className="lbl">Current vehicles:</span>
                                <span className="val">{r.current_vehicle_count || 0} vehicles</span>
                              </div>
                              <div className="rt-detail-item">
                                <span className="lbl">Expected travel time:</span>
                                <span className="val">{bestForecastItem ? `${bestForecastItem.estimated_travel_time_min} min` : `${r.total_time_min} min`}</span>
                              </div>
                              <div className="rt-detail-item">
                                <span className="lbl">Current travel time:</span>
                                <span className="val">{r.total_time_min} min</span>
                              </div>
                              <div className="rt-detail-item">
                                <span className="lbl">Estimated saving:</span>
                                <span className="val saving-highlight">
                                  {r.estimated_saving_min > 0 ? `${r.estimated_saving_min} min` : '0 min (Leave Now)'}
                                </span>
                              </div>
                            </div>

                            {r.right_time_reason && (
                              <p className="right-time-reason-text">{r.right_time_reason}</p>
                            )}
                          </div>

                          {/* TRAFFIC FORECAST VISUAL TIMELINE CARDS */}
                          {Array.isArray(r.traffic_forecast) && r.traffic_forecast.length > 0 && (
                            <div className="traffic-forecast-container">
                              <div className="forecast-header-row">
                                <span className="forecast-title">
                                  <span className="material-symbols-outlined icon">timeline</span>
                                  TRAFFIC FORECAST TIMELINE
                                </span>
                                <span className="forecast-subtitle">Upcoming slots</span>
                              </div>

                              <div className="forecast-timeline-track">
                                {r.traffic_forecast.map((fc, fIdx) => {
                                  const isBestTime = r.right_time_to_go === fc.departure_time || (r.right_time_to_go === 'Leave Now' && fc.start_offset_min === 0);
                                  const timeOffset = fc.start_offset_min === 0 ? "NOW" : `+${fc.start_offset_min} min`;
                                  
                                  const rawLvl = (fc.traffic_level || 'LOW').toString().toLowerCase();
                                  let badgeClass = 'green';
                                  let badgeLabel = '🟢 LOW';
                                  let subMsg = 'Light Traffic';

                                  if (rawLvl.includes('high') || rawLvl.includes('heavy')) {
                                    badgeClass = 'red';
                                    badgeLabel = '🔴 HIGH';
                                    subMsg = 'Heavy Congestion';
                                  } else if (rawLvl.includes('normal') || rawLvl.includes('medium') || rawLvl.includes('moderate')) {
                                    badgeClass = 'orange';
                                    badgeLabel = '🟡 MEDIUM';
                                    subMsg = 'Moderate Flow';
                                  } else {
                                    badgeClass = 'green';
                                    badgeLabel = '🟢 LOW';
                                    subMsg = 'Smooth Traffic';
                                  }

                                  const rangeStr = fc.vehicle_count_range 
                                    ? `${fc.vehicle_count_range.min}–${fc.vehicle_count_range.max}` 
                                    : `${fc.predicted_vehicle_count}`;

                                  return (
                                    <div 
                                      key={fIdx} 
                                      className={`forecast-card-item ${badgeClass} ${isBestTime ? 'is-best-time' : ''}`}
                                    >
                                      {isBestTime && (
                                        <div className="best-time-ribbon">
                                          <span className="material-symbols-outlined star-icon">check_circle</span>
                                          BEST TIME TO GO
                                        </div>
                                      )}

                                      <div className="fc-card-time-block">
                                        <span className="fc-time-offset">{timeOffset}</span>
                                        <span className="fc-clock-time">{fc.departure_time}</span>
                                      </div>

                                      <div className={`fc-status-badge ${badgeClass}`}>
                                        {badgeLabel}
                                      </div>

                                      <div className="fc-card-metrics">
                                        <span className="fc-vehicle-range">{rangeStr} vehicles</span>
                                        <span className="fc-duration-val">⏱️ {fc.estimated_travel_time_min} min</span>
                                      </div>

                                      <span className="fc-sub-msg">{subMsg}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* AI Traffic Intelligence Section */}
                    <div className="ai-insight-box">
                      <span className="material-symbols-outlined spark-icon">psychology</span>
                      <span>{aiInsight}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </React.Fragment>
    )}
  </aside>

      {/* Main Interactive Leaflet Map Panel */}
      <TrafficMap
        routes={routes}
        selectedRouteIdx={selectedRouteIdx}
        sourceLatLng={sourceLatLng}
        destinationLatLng={destinationLatLng}
        pinMode={pinMode}
        onRouteClick={(idx) => setSelectedRouteIdx(idx)}
        onMapClick={(coords) => handleMapClick(coords)}
      />

      {/* Permission dialog popup */}
      {showPermissionDialog && (
        <PermissionDialog onPermission={handlePermission} />
      )}
    </div>
  );
};

export default MainContent;
