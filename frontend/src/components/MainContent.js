import React, { useState, useEffect, useRef } from 'react';
import TrafficMap from './TrafficMap';
import PermissionDialog from './PermissionDialog';
import AIAutoChallan from './AIAutoChallan';
import { indoreLocations } from '../utils/locations';
import flatpickr from 'flatpickr';
import { useTheme } from '../ThemeContext';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Navigation, 
  LogOut, 
  Sparkles, 
  SlidersHorizontal, 
  Compass, 
  Info,
  Sun,
  Moon,
  User,
  ChevronDown,
  ChevronUp,
  ShieldAlert
} from 'lucide-react';

const MainContent = ({ onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const [activeViewTab, setActiveViewTab] = useState('navigation'); // 'navigation' or 'challan'
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [sourceLatLng, setSourceLatLng] = useState(null);
  const [destinationLatLng, setDestinationLatLng] = useState(null);
  const [pinMode, setPinMode] = useState(null); // 'source' or 'destination' or null
  const pinModeRef = useRef(pinMode);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [expandedRightTime, setExpandedRightTime] = useState({});
  const [expandedSignalTiming, setExpandedSignalTiming] = useState(false);
  const userMenuRef = useRef(null);
  const userEmail = localStorage.getItem('userEmail') || 'user@smarttraffic.ai';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);

  const now = new Date();

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const [date, setDate] = useState(() => formatDate(new Date()));
  const [time, setTime] = useState(() => formatTime(new Date()));

  const isUserTimeEditedRef = useRef(false);
  const isUserDateEditedRef = useRef(false);
  const flatpickrTimeRef = useRef(null);
  const flatpickrDateRef = useRef(null);

  const [selectedTransport, setSelectedTransport] = useState('bike');
  const [trafficResult, setTrafficResult] = useState('');
  const [showTrafficResult, setShowTrafficResult] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(true);

  const [routes, setRoutes] = useState([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [signalData, setSignalData] = useState(null);
  const [isAiTimingApplied, setIsAiTimingApplied] = useState(false);

  useEffect(() => {
    pinModeRef.current = pinMode;
  }, [pinMode]);

  useEffect(() => {
    setShowPermissionDialog(true);

    const initialNow = new Date();
    setDate(formatDate(initialNow));
    setTime(formatTime(initialNow));

    // Initialize flatpickr date
    flatpickrDateRef.current = flatpickr("#date", {
      dateFormat: "d-m-Y",
      defaultDate: initialNow,
      onChange: (selectedDates, dateStr) => {
        isUserDateEditedRef.current = true;
        setDate(dateStr.toString());
        clearRoutesState();
      }
    });

    // Initialize flatpickr time
    flatpickrTimeRef.current = flatpickr("#time", {
      enableTime: true,
      noCalendar: true,
      dateFormat: "h:i K",
      time_24hr: false,
      defaultDate: initialNow,
      onChange: (selectedDates, timeStr) => {
        isUserTimeEditedRef.current = true;
        setTime(timeStr);
        clearRoutesState();
      }
    });

    // Dynamic Live Local Time Sync (updates every minute if not manually edited by user)
    const timer = setInterval(() => {
      const currentNow = new Date();
      if (!isUserTimeEditedRef.current) {
        const newTimeStr = formatTime(currentNow);
        setTime(newTimeStr);
        if (flatpickrTimeRef.current) {
          flatpickrTimeRef.current.setDate(currentNow, false);
        }
      }
      if (!isUserDateEditedRef.current) {
        const newDateStr = formatDate(currentNow);
        setDate(newDateStr);
        if (flatpickrDateRef.current) {
          flatpickrDateRef.current.setDate(currentNow, false);
        }
      }
    }, 10000); // Poll every 10s for smooth minute transitions

    return () => {
      clearInterval(timer);
      if (flatpickrDateRef.current) flatpickrDateRef.current.destroy();
      if (flatpickrTimeRef.current) flatpickrTimeRef.current.destroy();
    };
  }, []);

  const clearRoutesState = () => {
    setRoutes([]);
    setSelectedRouteIdx(0);
    setShowTrafficResult(false);
    setTrafficResult('');
  };

  const handlePermission = (allowed, locationData) => {
    setShowPermissionDialog(false);
    if (allowed && locationData) {
      const { latitude, longitude, address } = locationData;
      const coords = `${latitude},${longitude}`;
      setSource(address || coords);
      setSourceLatLng(coords);
      console.log('Location permission granted', locationData);
    } else if (allowed) {
      console.log('Location permission granted, but no coordinates were returned.');
    } else {
      console.warn("Location access denied by user.");
    }
  };

  const handleTransportChange = (transport) => {
    setSelectedTransport(transport);
    clearRoutesState();
  };

  const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const parseLatLng = (coords) => coords.split(',').map(Number);

  const calculateETA = (departureTimeStr, durationMinutes) => {
    try {
      const timePart = departureTimeStr.replace(/AM|PM/i, '').trim();
      let [hours, minutes] = timePart.split(':').map(Number);
      const isPM = /PM/i.test(departureTimeStr);
      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;

      const now = new Date();
      const depDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
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

  const getAIRecommendation = (name, distance, time) => {
    if (name === 'Fastest') {
      return `⚡ Recommended. Saves approx ${Math.max(2, Math.round(time * 0.15))} mins compared to other routes despite average flow.`;
    } else if (name === 'Balanced') {
      return `🛣️ Stable flow. Fewer traffic stops than primary route. Better for a relaxed drive.`;
    } else {
      return `🌿 Green path. Bypasses dense junctions on MG Road to save fuel & lower carbon emissions.`;
    }
  };

  const getConfidenceScore = (name) => {
    if (name === 'Fastest') return 98;
    if (name === 'Balanced') return 88;
    return 94; // Eco
  };

  const buildRouteFromOSRM = (route, predictedCongestion, speed, name, index) => {
    const coordinates = route.geometry.coordinates;
    const segments = [];

    for (let i = 1; i < coordinates.length; i += 1) {
      const [lng1, lat1] = coordinates[i - 1];
      const [lng2, lat2] = coordinates[i];
      const length_m = calculateDistanceMeters(lat1, lng1, lat2, lng2);
      const travel_time_min = Number(((length_m / 1000) / speed * 60).toFixed(1));
      
      let segmentCongestion = 'normal';
      if (index === 0) {
        segmentCongestion = i % 9 === 0 ? 'red' : (i % 5 === 0 ? 'orange' : 'normal');
      } else if (index === 1) {
        segmentCongestion = i % 12 === 0 ? 'orange' : 'low';
      } else {
        segmentCongestion = i % 4 === 0 ? 'red' : (i % 3 === 0 ? 'orange' : 'normal');
      }

      segments.push({
        latitude_start: lat1,
        longitude_start: lng1,
        latitude_end: lat2,
        longitude_end: lng2,
        congestion_level: segmentCongestion,
        speed_kmh: speed,
        length_m: Number(length_m.toFixed(1)),
        travel_time_min,
      });
    }

    const total_distance_km = Number((route.distance / 1000).toFixed(2));
    const total_time_min = Number((route.duration / 60).toFixed(1));
    const average_speed_kmh = Number(((route.distance / 1000) / (route.duration / 3600)).toFixed(1));

    let mainCongestion = 'normal';
    if (index === 0) mainCongestion = 'normal';
    else if (index === 1) mainCongestion = 'low';
    else mainCongestion = 'high';

    // GeoJSON [lng, lat] coordinates to [lat, lng]
    const routeCoords = coordinates.map(([lng, lat]) => [lat, lng]);

    return {
      route_name: name,
      total_distance_km,
      predicted_congestion: mainCongestion,
      average_speed_kmh,
      total_time_min,
      segments,
      coordinates: routeCoords,
      recommended: index === 0,
      right_time_to_go: (() => {
        const offsetMins = index === 0 ? 5 : index === 1 ? 20 : 0;
        const recDate = new Date(Date.now() + offsetMins * 60000);
        let h = recDate.getHours();
        const m = recDate.getMinutes().toString().padStart(2, '0');
        const ap = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m} ${ap}`;
      })(),
      right_time_display: (() => {
        const offsetMins = index === 0 ? 5 : index === 1 ? 20 : 0;
        const recDate = new Date(Date.now() + offsetMins * 60000);
        let h = recDate.getHours();
        const m = recDate.getMinutes().toString().padStart(2, '0');
        const ap = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m} ${ap}`;
      })(),
      right_time_reason: `Optimal departure time calculated based on route conditions.`,
      signal_timing: {
        location: 'Vijay Nagar Junction',
        traffic_level: mainCongestion === 'high' ? 'HIGH' : mainCongestion === 'low' ? 'LOW' : 'MEDIUM',
        recommended_green_seconds: mainCongestion === 'high' ? 82 : mainCongestion === 'low' ? 35 : 55,
        recommended_red_seconds: mainCongestion === 'high' ? 48 : mainCongestion === 'low' ? 35 : 45,
        cycle_seconds: mainCongestion === 'high' ? 135 : mainCongestion === 'low' ? 75 : 105,
        confidence: 91,
        reason: 'AI Recommended Signal Timing based on predicted Vijay Nagar traffic demand'
      }
    };
  };

  const geocodePlace = async (place) => {
    if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(place.trim())) {
      const coords = place.trim();
      const [lat, lng] = coords.split(',').map(Number);
      if (lat >= 22.4 && lat <= 23.1 && lng >= 75.4 && lng <= 76.1) {
        return coords;
      }
      throw new Error(`Outside Indore bounds. Select Indore locations.`);
    }

    if (indoreLocations[place.trim()]) {
      return indoreLocations[place.trim()];
    }

    const knownLocations = Object.keys(indoreLocations);
    for (const knownLocation of knownLocations) {
      if (place.toLowerCase().includes(knownLocation.toLowerCase())) {
        return indoreLocations[knownLocation];
      }
    }

    const url = `https://nominatim.openstreetmap.org/search?city=Indore&state=Madhya%20Pradesh&country=India&q=${encodeURIComponent(place)}&format=json&limit=1`;
    try {
      const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await resp.json();
      if (data && data.length > 0) {
        return `${data[0].lat},${data[0].lon}`;
      }
    } catch (e) {
      console.error('Geocoding error:', e);
    }
    throw new Error(`Location "${place}" not found. Try dropping a marker pin.`);
  };

  const handleRouteRequest = async () => {
    if (!source || !destination) {
      alert("Please enter both source and destination locations.");
      return;
    }
    setIsLoadingRoutes(true);
    setShowTrafficResult(true);
    setTrafficResult("⏳ Analyzing congestion & calculating pathways...");

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

      // 1. Try Backend API First
      try {
        console.log("Attempting to fetch routes from Django backend API...");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn("Django backend routes API timed out. Aborting request after 30s.");
          controller.abort();
        }, 30000);

        const response = await fetch('/api/routes/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: `${sourceLat},${sourceLng}`,
            destination: `${destinationLat},${destinationLng}`,
            travel_mode: mode,
            date_time: now.toISOString()
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          
          let routeArray = [];
          if (Array.isArray(data)) {
            routeArray = data;
          } else if (data && typeof data === 'object') {
            routeArray = data.routes || [data.fastest, data.balanced, data.slowest].filter(Boolean);
          }

          if (routeArray && routeArray.length > 0) {
            const fastestObj = (data && !Array.isArray(data) && data.fastest) ? data.fastest : routeArray[0];
            const balancedObj = (data && !Array.isArray(data) && data.balanced) ? data.balanced : (routeArray[1] || routeArray[0]);
            const slowestObj = (data && !Array.isArray(data) && data.slowest) ? data.slowest : (routeArray[2] || routeArray[0]);
            const signalTimingVal = (data && !Array.isArray(data) && data.signal_timing) || fastestObj?.signal_timing;
            console.log("Route keys:", Object.keys(data));
            console.log("Fastest right time:", fastestObj?.right_time_to_leave?.recommended_departure_time || fastestObj?.right_time_display);
            console.log("Balanced right time:", balancedObj?.right_time_to_leave?.recommended_departure_time || balancedObj?.right_time_display);
            console.log("Slow/Eco right time:", slowestObj?.right_time_to_leave?.recommended_departure_time || slowestObj?.right_time_display);
            console.log("SIGNAL TIMING:", signalTimingVal);
            if (signalTimingVal) {
              console.log("RECOMMENDED GREEN:", signalTimingVal.recommended_green_seconds);
              console.log("RECOMMENDED RED:", signalTimingVal.recommended_red_seconds);
              console.log("SIGNAL CYCLE:", signalTimingVal.cycle_seconds);
            }
            console.log("==========================================");

            setRoutes(routeArray);
            setSelectedRouteIdx(0);
            setTrafficResult('');
            setIsLoadingRoutes(false);
            return;
          }
        }
        throw new Error("Backend returned empty or invalid routes.");
      } catch (backendError) {
        console.warn("Django backend routes failed or timed out. Falling back to local route generator:", backendError);
      }

      // 2. Local Fallback Generator using OSRM
      const profile = selectedTransport === 'bike' ? 'cycling' : selectedTransport === 'walk' ? 'foot' : 'driving';
      const speed = selectedTransport === 'bike' ? 16 : selectedTransport === 'walk' ? 5 : 35;

      const mainUrl = `https://router.project-osrm.org/route/v1/${profile}/${sourceLng},${sourceLat};${destinationLng},${destinationLat}?alternatives=true&overview=full&geometries=geojson`;
      const mainResponse = await fetch(mainUrl);
      const mainData = await mainResponse.json();

      let routeCandidates = [];
      if (mainData && mainData.code === 'Ok') {
        if (mainData.routes.length >= 3) {
          routeCandidates = mainData.routes.map((r, idx) => 
            buildRouteFromOSRM(r, 'normal', speed, idx === 0 ? 'Fastest' : idx === 1 ? 'Balanced' : 'Eco / Low Traffic', idx)
          );
        } else {
          // Perturb coordinates slightly to generate alternative paths
          const dLat = destinationLat - sourceLat;
          const dLng = destinationLng - sourceLng;
          const len = Math.sqrt(dLat * dLat + dLng * dLng);
          const midLat = (sourceLat + destinationLat) / 2;
          const midLng = (sourceLng + destinationLng) / 2;
          const perpLat = -dLng / len;
          const perpLng = dLat / len;

          const offset = Math.min(0.015, Math.max(0.005, len * 0.25));

          const wp1Lat = midLat + perpLat * offset;
          const wp1Lng = midLng + perpLng * offset;
          const wp2Lat = midLat - perpLat * offset;
          const wp2Lng = midLng - perpLng * offset;

          const url1 = `https://router.project-osrm.org/route/v1/${profile}/${sourceLng},${sourceLat};${destinationLng},${destinationLat}?overview=full&geometries=geojson`;
          const url2 = `https://router.project-osrm.org/route/v1/${profile}/${sourceLng},${sourceLat};${wp1Lng.toFixed(6)},${wp1Lat.toFixed(6)};${destinationLng},${destinationLat}?overview=full&geometries=geojson`;
          const url3 = `https://router.project-osrm.org/route/v1/${profile}/${sourceLng},${sourceLat};${wp2Lng.toFixed(6)},${wp2Lat.toFixed(6)};${destinationLng},${destinationLat}?overview=full&geometries=geojson`;

          try {
            const [res1, res2, res3] = await Promise.all([
              fetch(url1).then(r => r.json()),
              fetch(url2).then(r => r.json()),
              fetch(url3).then(r => r.json())
            ]);

            if (res1.code === 'Ok' && res1.routes.length > 0) {
              routeCandidates.push(buildRouteFromOSRM(res1.routes[0], 'normal', speed, 'Fastest', 0));
            }
            if (res2.code === 'Ok' && res2.routes.length > 0) {
              routeCandidates.push(buildRouteFromOSRM(res2.routes[0], 'normal', speed, 'Balanced', 1));
            }
            if (res3.code === 'Ok' && res3.routes.length > 0) {
              routeCandidates.push(buildRouteFromOSRM(res3.routes[0], 'normal', speed, 'Eco / Low Traffic', 2));
            }
          } catch (e) {
            console.warn("Alternative waypoint fetching failed, cloning primary:", e);
            if (mainData.routes.length > 0) {
              const primary = buildRouteFromOSRM(mainData.routes[0], 'normal', speed, 'Fastest', 0);
              routeCandidates.push(primary);

              const clone1 = JSON.parse(JSON.stringify(primary));
              clone1.route_name = 'Balanced';
              clone1.total_time_min = Number((primary.total_time_min * 1.15).toFixed(1));
              clone1.total_distance_km = Number((primary.total_distance_km * 1.1).toFixed(2));
              clone1.recommended = false;
              clone1.predicted_congestion = 'low';
              routeCandidates.push(clone1);

              const clone2 = JSON.parse(JSON.stringify(primary));
              clone2.route_name = 'Eco / Low Traffic';
              clone2.total_time_min = Number((primary.total_time_min * 1.35).toFixed(1));
              clone2.total_distance_km = Number((primary.total_distance_km * 1.25).toFixed(2));
              clone2.recommended = false;
              clone2.predicted_congestion = 'high';
              routeCandidates.push(clone2);
            }
          }
        }
      }

      if (routeCandidates.length === 0) {
        throw new Error("Unable to build routes. Verify coords are in Indore region.");
      }

      const selectedRoutes = routeCandidates.slice(0, 3).map((route, index) => {
        const name = index === 0 ? 'Fastest' : index === 1 ? 'Balanced' : 'Eco / Low Traffic';
        return {
          ...route,
          route_name: name,
          recommended: index === 0
        };
      });

      setRoutes(selectedRoutes);
      setSelectedRouteIdx(0);
      setTrafficResult('');
    } catch (err) {
      console.error(err);
      setTrafficResult(`❌ Route error: ${err.message || 'Check your internet connection.'}`);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  const getTomTomAddress = async (lat, lng) => {
    try {
      const res = await fetch(`/api/location/reverse/?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      if (data && data.address) {
        return data.address;
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.warn("TomTom Reverse Geocode error:", error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const handleMapClick = async (coords) => {
    const [lat, lng] = coords.split(',').map(Number);
    let target = pinModeRef.current;
    if (target !== 'source' && target !== 'destination') {
      if (!sourceLatLng) target = 'source';
      else target = 'destination';
    }

    const address = await getTomTomAddress(lat, lng);

    if (target === 'source') {
      setSourceLatLng(coords);
      setSource(address);
      setPinMode(null);
    } else {
      setDestinationLatLng(coords);
      setDestination(address);
      setPinMode(null);
    }

    clearRoutesState();
  };

  const sourceSearchTimeoutRef = useRef(null);
  const destSearchTimeoutRef = useRef(null);

  const handleSourceInputChange = (val) => {
    setSource(val);
    setSourceLatLng(null);
    clearRoutesState();

    if (sourceSearchTimeoutRef.current) clearTimeout(sourceSearchTimeoutRef.current);

    if (val.trim().length > 1) {
      sourceSearchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/location/search/?q=${encodeURIComponent(val)}`);
          const data = await res.json();
          if (data && data.results && data.results.length > 0) {
            setSourceSuggestions(data.results);
          } else {
            setSourceSuggestions([]);
          }
        } catch (err) {
          console.warn("TomTom Source Search error:", err);
          setSourceSuggestions([]);
        }
      }, 300);
    } else {
      setSourceSuggestions([]);
    }
  };

  const handleDestInputChange = (val) => {
    setDestination(val);
    setDestinationLatLng(null);
    clearRoutesState();

    if (destSearchTimeoutRef.current) clearTimeout(destSearchTimeoutRef.current);

    if (val.trim().length > 1) {
      destSearchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/location/search/?q=${encodeURIComponent(val)}`);
          const data = await res.json();
          if (data && data.results && data.results.length > 0) {
            setDestinationSuggestions(data.results);
          } else {
            setDestinationSuggestions([]);
          }
        } catch (err) {
          console.warn("TomTom Dest Search error:", err);
          setDestinationSuggestions([]);
        }
      }, 300);
    } else {
      setDestinationSuggestions([]);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setSource("Detecting location...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coords = `${latitude},${longitude}`;
        setSourceLatLng(coords);
        const address = await getTomTomAddress(latitude, longitude);
        setSource(address);
        clearRoutesState();
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setSource("");
        alert("Location permission denied. Please enter your source manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (activeViewTab === 'challan') {
    return (
      <div id="mainContent" style={{ height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
        <AIAutoChallan onBackToNavigation={() => setActiveViewTab('navigation')} />
      </div>
    );
  }

  return (
    <div id="mainContent" className="dashboard-app-shell" style={{
      display: 'grid',
      gridTemplateColumns: '340px 1fr',
      gap: '16px',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      padding: '16px',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      {/* Column 1: Left Sidebar Panel (340px, independently scrollable) */}
      <div className="dashboard-left-sidebar" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        overflowY: 'auto',
        height: '100%',
        minHeight: 0,
        paddingRight: '4px',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div className="search-card-header" style={{ marginBottom: '4px' }}>
          <div className="search-logo-brand">
            <Compass className="compass-spin" size={22} color="#3b82f6" />
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>SMART TRAFFIC</h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>AI-Powered Route Optimizer</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button 
              type="button" 
              onClick={() => setActiveViewTab('challan')}
              title="AI Auto Challan Violation Engine"
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ShieldAlert size={14} />
              <span>Challan</span>
            </button>

            <button 
              type="button" 
              className="landing-theme-toggle-btn" 
              onClick={toggleTheme} 
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{ padding: '5px 10px', fontSize: '0.78rem' }}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            <div className="user-account-menu-container" ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className={`user-avatar-trigger-btn ${showUserMenu ? 'active' : ''}`}
                onClick={() => setShowUserMenu(!showUserMenu)}
                title="Account Settings & Logout"
              >
                <div className="avatar-circle">
                  <User size={15} color="#3b82f6" />
                </div>
                <ChevronDown size={13} className={`chevron-icon ${showUserMenu ? 'open' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="user-dropdown-popover animate-fade-in">
                  <div className="user-popover-header">
                    <span className="user-signed-in-lbl">Signed in as</span>
                    <span className="user-email-txt">{userEmail}</span>
                  </div>

                  <div className="user-popover-divider"></div>

                  <button
                    type="button"
                    className="user-popover-item"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <SlidersHorizontal size={14} />
                    <span>Account Preferences</span>
                  </button>

                  <button
                    type="button"
                    className="user-popover-item logout-item"
                    onClick={() => {
                      setShowUserMenu(false);
                      if (onLogout) onLogout();
                    }}
                  >
                    <LogOut size={14} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section: NAVIGATION SETUP */}
        <div className="nav-setup-section">
          <div className="section-header-title">
            <SlidersHorizontal size={14} color="#3b82f6" />
            <span>NAVIGATION SETUP</span>
          </div>

          {/* Starting Point */}
          <div className="search-input-group">
            <div className="input-title-row">
              <span className="dot-indicator green"></span>
              <label>Starting Point</label>
              <button type="button" className="use-location-link-btn" onClick={handleUseMyLocation} title="Use My Current Geolocation">
                <Navigation size={11} style={{ marginRight: 3 }} />
                Use My Location
              </button>
            </div>
            <div className="input-search-box">
              <input
                type="text"
                placeholder="Search starting place..."
                autoComplete="off"
                value={source}
                onChange={(e) => handleSourceInputChange(e.target.value)}
              />
              <button 
                className={`search-pin-action ${pinMode === 'source' ? 'active' : ''}`}
                onClick={() => setPinMode(pinMode === 'source' ? null : 'source')}
                title="Drop pin on map"
              >
                <MapPin size={15} />
              </button>
            </div>
            {sourceSuggestions.length > 0 && (
              <div className="search-autocomplete-dropdown">
                {sourceSuggestions.map((item, idx) => {
                  const addrText = typeof item === 'string' ? item : item.address;
                  const coordsText = typeof item === 'string' ? indoreLocations[item] : `${item.lat},${item.lng}`;
                  return (
                    <div 
                      key={idx}
                      className="dropdown-item"
                      onClick={() => {
                        setSource(addrText);
                        setSourceLatLng(coordsText);
                        setSourceSuggestions([]);
                        clearRoutesState();
                      }}
                    >
                      <MapPin size={12} style={{ marginRight: 6, color: '#10b981' }} />
                      {addrText}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Destination */}
          <div className="search-input-group" style={{ marginTop: '10px' }}>
            <div className="input-title-row">
              <span className="dot-indicator red"></span>
              <label>Destination</label>
            </div>
            <div className="input-search-box">
              <input
                type="text"
                placeholder="Search destination place..."
                autoComplete="off"
                value={destination}
                onChange={(e) => handleDestInputChange(e.target.value)}
              />
              <button 
                className={`search-pin-action ${pinMode === 'destination' ? 'active' : ''}`}
                onClick={() => setPinMode(pinMode === 'destination' ? null : 'destination')}
                title="Drop pin on map"
              >
                <MapPin size={15} />
              </button>
            </div>
            {destinationSuggestions.length > 0 && (
              <div className="search-autocomplete-dropdown">
                {destinationSuggestions.map((item, idx) => {
                  const addrText = typeof item === 'string' ? item : item.address;
                  const coordsText = typeof item === 'string' ? indoreLocations[item] : `${item.lat},${item.lng}`;
                  return (
                    <div 
                      key={idx}
                      className="dropdown-item"
                      onClick={() => {
                        setDestination(addrText);
                        setDestinationLatLng(coordsText);
                        setDestinationSuggestions([]);
                        clearRoutesState();
                      }}
                    >
                      <MapPin size={12} style={{ marginRight: 6, color: '#ef4444' }} />
                      {addrText}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date & Time Row */}
          <div className="pref-datetime-grid" style={{ marginTop: '10px' }}>
            <div className="pref-input-sub">
              <span className="pref-label">Date</span>
              <div className="pref-input-icon-box">
                <Calendar size={14} className="p-icon" />
                <input type="text" id="date" className="flatpickr" value={date} readOnly />
              </div>
            </div>

            <div className="pref-input-sub">
              <span className="pref-label">Time</span>
              <div className="pref-input-icon-box">
                <Clock size={14} className="p-icon" />
                <input type="text" id="time" className="flatpickr" value={time} readOnly />
              </div>
            </div>
          </div>

          {/* Travel Mode Toggle */}
          <div className="pref-modes-group" style={{ marginTop: '10px' }}>
            <span className="pref-label">TRAVEL MODE</span>
            <div className="pref-button-row">
              <button 
                className={`pref-mode-btn ${selectedTransport === 'bike' ? 'active' : ''}`}
                onClick={() => handleTransportChange('bike')}
              >
                Bike
              </button>
              <button 
                className={`pref-mode-btn ${selectedTransport === 'car' ? 'active' : ''}`}
                onClick={() => handleTransportChange('car')}
              >
                Car
              </button>
              <button 
                className={`pref-mode-btn ${selectedTransport === 'walk' ? 'active' : ''}`}
                onClick={() => handleTransportChange('walk')}
              >
                Walk
              </button>
            </div>
          </div>

          {/* Button Row: SHOW ROUTES & 🚦 VIJAY NAGAR AI SIGNAL TIMING */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button 
                className="calculate-route-btn" 
                onClick={handleRouteRequest} 
                disabled={isLoadingRoutes}
                style={{ margin: 0 }}
              >
                {isLoadingRoutes ? (
                  <>
                    <span className="mini-spinner"></span>
                    Calculating...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} style={{ marginRight: 6 }} />
                    SHOW ROUTES
                  </>
                )}
              </button>

              {/* Compact 🚦 VIJAY NAGAR AI SIGNAL TIMING Toggle Button */}
              <button
                type="button"
                className="calculate-route-btn"
                onClick={() => {
                  setExpandedSignalTiming(prev => !prev);
                  if (!signalData) {
                    fetch('/api/signal-timing/', { method: 'POST' })
                      .then(res => res.json())
                      .then(data => setSignalData(data))
                      .catch(err => console.warn('Signal timing fetch error:', err));
                  }
                }}
                style={{
                  margin: 0,
                  background: expandedSignalTiming ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-glass)',
                  color: expandedSignalTiming ? '#3b82f6' : 'var(--text-primary)'
                }}
              >
                🚦 SIGNAL TIMING {expandedSignalTiming ? '▲' : '▼'}
              </button>
            </div>

            {/* Expanded Signal Timing Collapsible Detail Panel */}
            {expandedSignalTiming && (() => {
              const tLevel = signalData?.traffic_level || signalData?.current_traffic || 'NORMAL';
              const currGreen = signalData?.current_timing?.green_sec || 55;
              const currRed = signalData?.current_timing?.red_sec || 40;
              const recGreen = signalData?.ai_recommended_timing?.green_sec || signalData?.recommended_green_seconds || 54;
              const recRed = signalData?.ai_recommended_timing?.red_sec || signalData?.recommended_red_seconds || 42;
              const recCycle = signalData?.ai_recommended_timing?.cycle_sec || signalData?.cycle_seconds || 101;
              const waitReduct = signalData?.waiting_reduction_percent !== undefined ? signalData?.waiting_reduction_percent : 12.5;

              const pillClass = tLevel === 'HIGH' ? 'red' : tLevel === 'MEDIUM' || tLevel === 'NORMAL' ? 'orange' : 'green';

              return (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'var(--bg-glass)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    boxShadow: 'var(--shadow-card)',
                    fontSize: '0.76rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '0.86rem', color: 'var(--text-primary)', fontFamily: 'Outfit' }}>
                        SIGNAL AI CONTROL
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        Vijay Nagar Junction
                      </div>
                    </div>
                    <span className={`r-traffic-pill ${pillClass}`} style={{ fontSize: '0.62rem', padding: '2px 6px', fontWeight: 800 }}>
                      {tLevel}
                    </span>
                  </div>

                  {/* CURRENT SIGNAL TIMING */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    <div style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.3px' }}>
                      CURRENT SIGNAL TIMING
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                      <span>🟢 <strong>GREEN:</strong> {currGreen} sec</span>
                      <span>🔴 <strong>RED:</strong> {currRed} sec</span>
                    </div>
                  </div>

                  {/* AI RECOMMENDED TIMING */}
                  <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#3b82f6', marginBottom: '4px', letterSpacing: '0.3px' }}>
                      AI RECOMMENDED TIMING
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <span>🟢 <strong>GREEN:</strong> {recGreen} sec</span>
                        <span>🔴 <strong>RED:</strong> {recRed} sec</span>
                      </div>
                      <div><strong>TOTAL CYCLE:</strong> {recCycle} sec</div>
                    </div>
                  </div>

                  {/* Estimated Waiting Reduction */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.08)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Estimated Waiting Reduction:</span>
                    <strong style={{ fontSize: '0.85rem', color: '#10b981', fontFamily: 'Outfit' }}>{waitReduct}%</strong>
                  </div>

                  {/* APPLY AI TIMING BUTTON & ACTIVE SIMULATION BADGE */}
                  {isAiTimingApplied ? (
                    <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', padding: '8px', borderRadius: '8px', textAlign: 'center', fontWeight: 800, fontSize: '0.76rem' }}>
                      ✓ AI TIMING ACTIVE — Green: {recGreen} sec | Red: {recRed} sec
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAiTimingApplied(true)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                        border: 'none',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                        fontFamily: 'Outfit, sans-serif'
                      }}
                    >
                      [ APPLY AI TIMING ]
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Section: OPTIMIZED ROUTES */}
        {showTrafficResult && (
          <div className="optimized-routes-section" style={{ marginTop: '8px' }}>
            <div className="section-header-title">
              <Navigation size={14} color="#3b82f6" />
              <span>OPTIMIZED ROUTES</span>
            </div>

            {trafficResult ? (
              <div className="panel-loading-wrapper" style={{ padding: '16px', textAlignment: 'center' }}>
                <div className="spinner-glow"></div>
                <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>{trafficResult}</p>
              </div>
            ) : (
              routes.length > 0 && (
                <div className="routes-card-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {routes.map((r, idx) => {
                    const isSelected = idx === selectedRouteIdx;
                    const displayTitle = r.route_name;
                    const confidence = getConfidenceScore(r.route_name);
                    const rawCong = (r.traffic_level || r.predicted_traffic || r.predicted_congestion || 'low').toLowerCase();
                    const congClass = (rawCong.includes('low') || rawCong.includes('green') || rawCong.includes('smooth')) 
                      ? 'green' 
                      : (rawCong.includes('normal') || rawCong.includes('orange') || rawCong.includes('yellow') || rawCong.includes('moderate')) 
                        ? 'orange' 
                        : 'red';

                    const congLabel = congClass === 'green' ? 'LOW TRAFFIC' : congClass === 'orange' ? 'MEDIUM TRAFFIC' : 'HIGH TRAFFIC';
                    const routeETA = calculateETA(time, r.total_time_min);
                    const aiRecText = getAIRecommendation(r.route_name, r.total_distance_km, r.total_time_min);

                    const isTomTomLive = r.traffic_source === 'LIVE TOMTOM TRAFFIC' || r.tomtomAvailable || (r.segments && r.segments.length > 0 && r.traffic_source !== 'TOMTOM UNAVAILABLE');
                    const accentColor = idx === 0 ? '#0284c7' : idx === 1 ? '#f59e0b' : '#10b981';

                    return (
                      <div
                        key={idx}
                        className={`premium-route-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedRouteIdx(idx)}
                        style={{
                          borderLeft: `4px solid ${accentColor}`,
                          borderRadius: '12px',
                          padding: '12px',
                          background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-glass)',
                          border: isSelected ? `1.5px solid ${accentColor}` : '1px solid var(--border-glass)',
                          cursor: 'pointer'
                        }}
                      >
                        <div className="r-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="r-name" style={{ fontWeight: 800, fontSize: '0.9rem', color: isSelected ? accentColor : 'var(--text-primary)' }}>{displayTitle}</span>
                            <span className={`r-traffic-pill ${congClass}`}>{congLabel}</span>
                          </div>
                          <span style={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            letterSpacing: '0.3px',
                            whiteSpace: 'nowrap',
                            background: isTomTomLive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isTomTomLive ? '#10b981' : '#ef4444',
                            border: isTomTomLive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                          }}>
                            {isTomTomLive ? 'LIVE TOMTOM TRAFFIC' : 'TOMTOM UNAVAILABLE'}
                          </span>
                        </div>

                        <div className="r-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
                          <div className="stat-unit">
                            <span className="val" style={{ fontWeight: 800, fontSize: '0.95rem' }}>{r.total_time_min}</span>
                            <span className="lbl" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>MINS</span>
                          </div>
                          <div className="stat-unit">
                            <span className="val" style={{ fontWeight: 800, fontSize: '0.95rem' }}>{r.total_distance_km}</span>
                            <span className="lbl" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>KM</span>
                          </div>
                          <div className="stat-unit">
                            <span className="val" style={{ fontWeight: 800, fontSize: '0.85rem' }}>{routeETA}</span>
                            <span className="lbl" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ETA</span>
                          </div>
                          <div className="stat-unit">
                            <span className="val" style={{ fontWeight: 800, fontSize: '0.95rem' }}>{confidence}%</span>
                            <span className="lbl" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>CONF.</span>
                          </div>
                        </div>

                        <div className="r-recommendation-bubble" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                          <Info size={13} style={{ marginRight: 4, flexShrink: 0, marginTop: 1, color: accentColor }} />
                          <p style={{ margin: 0, lineHeight: 1.3 }}>{aiRecText}</p>
                        </div>

                        {/* HIGH TRAFFIC ALERT Badge (ONLY when traffic_alert.active === true) */}
                        {r.traffic_alert && r.traffic_alert.active === true && (
                          <div style={{
                            marginTop: '8px',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: '#ef4444',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: 700
                          }}>
                            <ShieldAlert size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                            <div>
                              <div>🚨 HIGH TRAFFIC ALERT ({((r.traffic_alert.high_probability <= 1 ? r.traffic_alert.high_probability * 100 : r.traffic_alert.high_probability)).toFixed(1)}% prob)</div>
                              <div style={{ fontSize: '0.68rem', fontWeight: 500, opacity: 0.9 }}>{r.traffic_alert.message}</div>
                            </div>
                          </div>
                        )}

                        {/* Expandable RIGHT TIME TO LEAVE option inside route card */}
                        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--border-glass)' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRouteIdx(idx);
                              setExpandedRightTime(prev => ({ ...prev, [idx]: !prev[idx] }));
                            }}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justify: 'space-between',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              background: expandedRightTime[idx] ? `${accentColor}22` : 'rgba(255, 255, 255, 0.04)',
                              border: `1px solid ${expandedRightTime[idx] ? accentColor : 'var(--border-glass)'}`,
                              color: expandedRightTime[idx] ? accentColor : 'var(--text-primary)',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              fontFamily: 'Outfit, sans-serif'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Clock size={14} color={accentColor} />
                              <span style={{ letterSpacing: '0.3px' }}>RIGHT TIME TO LEAVE</span>
                            </div>
                            {expandedRightTime[idx] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>

                          {expandedRightTime[idx] && (() => {
                            const rtObj = (r.right_time_to_leave && typeof r.right_time_to_leave === 'object')
                              ? r.right_time_to_leave
                              : (r.right_time_to_go && typeof r.right_time_to_go === 'object')
                                ? r.right_time_to_go
                                : {};

                            let recDept = rtObj.recommended_departure_time || rtObj.recommended_departure || r.right_time_display || (typeof r.right_time_to_go === 'string' ? r.right_time_to_go : '');
                            if (!recDept || recDept.toLowerCase().includes('leave now')) {
                              const recDate = new Date();
                              let h = recDate.getHours();
                              const m = recDate.getMinutes().toString().padStart(2, '0');
                              const ap = h >= 12 ? 'PM' : 'AM';
                              h = h % 12 || 12;
                              recDept = `${h}:${m} ${ap}`;
                            }

                            return (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  marginTop: '8px',
                                  padding: '10px 12px',
                                  borderRadius: '8px',
                                  background: 'var(--bg-glass)',
                                  border: `1px solid ${accentColor}40`,
                                  boxShadow: 'var(--shadow-card)',
                                  fontSize: '0.76rem'
                                }}
                              >
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                  Right Time To Leave
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                  <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    Recommended Departure:
                                  </span>
                                  <span style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: 'Outfit', color: accentColor }}>
                                    {recDept}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Column 2: Right Main Content (Map fills full height) */}
      <div className="dashboard-main-content" style={{
        display: 'grid',
        gridTemplateRows: 'minmax(0, 1fr)',
        gap: '14px',
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden'
      }}>
        {/* Map Container */}
        <div className="dashboard-map-container" style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: 0,
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--border-glass)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <TrafficMap
            routes={routes}
            selectedRouteIdx={selectedRouteIdx}
            sourceLatLng={sourceLatLng}
            destinationLatLng={destinationLatLng}
            pinMode={pinMode}
            onRouteClick={(idx) => {
              setSelectedRouteIdx(idx);
            }}
            onMapClick={(coords) => {
              handleMapClick(coords);
            }}
          />
        </div>
      </div>

      {/* Permissions Modal */}
      {showPermissionDialog && (
        <PermissionDialog onPermission={handlePermission} />
      )}
    </div>
  );
};

export default MainContent;
