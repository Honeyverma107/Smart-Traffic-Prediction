import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../ThemeContext';

// Custom Leaflet SVG Pin Markers
const createLeafletIcon = (color, label) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
      ">
        <div style="
          position: absolute;
          top: -22px;
          background: rgba(17, 24, 39, 0.95);
          color: white;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          pointer-events: none;
          letter-spacing: 0.5px;
        ">
          ${label}
        </div>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${color}"/>
          <circle cx="12" cy="9" r="3.5" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34]
  });
};

// Convert backend coordinates array [[lat, lng], ...] or GeoJSON [[lng, lat], ...] to Leaflet [lat, lng] format
const extractLeafletLatLons = (route) => {
  if (!route) return [];

  // 1. Direct coordinates array [[lat, lng], ...] or [[lng, lat], ...]
  if (route.coordinates && Array.isArray(route.coordinates) && route.coordinates.length > 0) {
    return route.coordinates.map(pt => {
      if (Array.isArray(pt)) {
        // In India, Lat is ~22-23 (between 15 and 35), Lng is ~75-76 (between 70 and 90)
        // Leaflet expects [lat, lng]
        if (Math.abs(pt[0]) >= 15 && Math.abs(pt[0]) <= 35) {
          return [pt[0], pt[1]];
        }
        return [pt[1], pt[0]];
      }
      if (pt.lat !== undefined && pt.lng !== undefined) return [pt.lat, pt.lng];
      if (pt.latitude !== undefined && pt.longitude !== undefined) return [pt.latitude, pt.longitude];
      return null;
    }).filter(Boolean);
  }

  // 2. GeoJSON geometry (OSRM / TomTom GeoJSON coordinates [lng, lat])
  if (route.geometry && route.geometry.coordinates && Array.isArray(route.geometry.coordinates)) {
    return route.geometry.coordinates.map(pt => {
      if (Math.abs(pt[0]) >= 15 && Math.abs(pt[0]) <= 35) {
        return [pt[0], pt[1]];
      }
      return [pt[1], pt[0]];
    });
  }

  // 3. Segments array [{ latitude_start, longitude_start, latitude_end, longitude_end }, ...]
  if (route.segments && Array.isArray(route.segments) && route.segments.length > 0) {
    const pts = [];
    route.segments.forEach(seg => {
      if (seg.latitude_start !== undefined && seg.longitude_start !== undefined) {
        pts.push([seg.latitude_start, seg.longitude_start]);
      }
      if (seg.latitude_end !== undefined && seg.longitude_end !== undefined) {
        pts.push([seg.latitude_end, seg.longitude_end]);
      }
    });
    return pts;
  }

  return [];
};

const TrafficMap = ({
  routes,
  selectedRouteIdx = 0,
  onRouteClick,
  onMapClick,
  sourceLatLng,
  destinationLatLng,
  pinMode
}) => {
  const { theme } = useTheme();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const polylinesRef = useRef([]);
  const alertMarkersRef = useRef([]);
  const sourceMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);

  // Map Initialization
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      const map = L.map(mapRef.current, {
        center: [22.7196, 75.8577],
        zoom: 13,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomleft' }).addTo(map);

      // Dedicated Leaflet pane for route polylines to ensure they render beneath markers
      map.createPane('routesPane');
      map.getPane('routesPane').style.zIndex = 400;

      mapInstanceRef.current = map;

      map.on('click', (e) => {
        const origEvt = e ? e.originalEvent : null;

        // Guard 1: Intercept clicks from routes, markers, legends, or controls via explicit flags
        if (origEvt && (origEvt._isRouteClick || origEvt._isMarkerClick || origEvt._isLegendClick || origEvt._stopped)) {
          console.log("ERROR:\nROUTE CLICK REACHED MAP CLICK HANDLER");
          return;
        }

        // Guard 2: Intercept clicks on SVG paths, interactive elements, markers, or controls via DOM target inspection
        const target = origEvt ? origEvt.target : null;
        if (target) {
          const tagName = target.tagName ? target.tagName.toLowerCase() : '';
          const className = typeof target.className === 'string' 
            ? target.className 
            : (target.getAttribute && target.getAttribute('class')) || '';

          if (
            tagName === 'path' ||
            tagName === 'svg' ||
            className.includes('leaflet-interactive') ||
            className.includes('custom-leaflet-marker') ||
            className.includes('leaflet-control') ||
            (target.closest && (
              target.closest('.leaflet-interactive') ||
              target.closest('.custom-leaflet-marker') ||
              target.closest('.leaflet-control') ||
              target.closest('.map-route-legend')
            ))
          ) {
            console.log("ERROR:\nROUTE CLICK REACHED MAP CLICK HANDLER");
            return;
          }
        }

        console.log("[MAP CLICK]\ntype: EMPTY_MAP");
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        const exactCoords = `${lat.toFixed(6)},${lng.toFixed(6)}`;
        if (onMapClick) {
          onMapClick(exactCoords);
        }
      });
    }
  }, [onMapClick]);

  // Update Tile Layer on Theme Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const isDark = theme !== 'light';
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);
  }, [theme]);

  // Render Routes and Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing polylines
    polylinesRef.current.forEach(pl => pl.remove());
    polylinesRef.current = [];

    // Clear existing alert markers
    alertMarkersRef.current.forEach(m => m.remove());
    alertMarkersRef.current = [];

    // Clear existing markers
    if (sourceMarkerRef.current) {
      sourceMarkerRef.current.remove();
      sourceMarkerRef.current = null;
    }
    if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }

    // Render Markers
    if (sourceLatLng) {
      const [sLat, sLng] = sourceLatLng.split(',').map(Number);
      sourceMarkerRef.current = L.marker([sLat, sLng], {
        icon: createLeafletIcon('#10b981', 'SOURCE')
      }).addTo(map);

      sourceMarkerRef.current.on('click', (e) => {
        console.log("[MARKER CLICK]\nmarker: SOURCE");
        if (e && e.originalEvent) {
          e.originalEvent._isMarkerClick = true;
          if (e.originalEvent.stopPropagation) e.originalEvent.stopPropagation();
          if (e.originalEvent.stopImmediatePropagation) e.originalEvent.stopImmediatePropagation();
          L.DomEvent.stopPropagation(e.originalEvent);
          L.DomEvent.stop(e.originalEvent);
        }
      });
    }

    if (destinationLatLng) {
      const [dLat, dLng] = destinationLatLng.split(',').map(Number);
      destMarkerRef.current = L.marker([dLat, dLng], {
        icon: createLeafletIcon('#ef4444', 'DEST')
      }).addTo(map);

      destMarkerRef.current.on('click', (e) => {
        console.log("[MARKER CLICK]\nmarker: DESTINATION");
        if (e && e.originalEvent) {
          e.originalEvent._isMarkerClick = true;
          if (e.originalEvent.stopPropagation) e.originalEvent.stopPropagation();
          if (e.originalEvent.stopImmediatePropagation) e.originalEvent.stopImmediatePropagation();
          L.DomEvent.stopPropagation(e.originalEvent);
          L.DomEvent.stop(e.originalEvent);
        }
      });
    }

    if (!routes || routes.length === 0) {
      if (sourceLatLng && destinationLatLng) {
        const [sLat, sLng] = sourceLatLng.split(',').map(Number);
        const [dLat, dLng] = destinationLatLng.split(',').map(Number);
        const bounds = L.latLngBounds([[sLat, sLng], [dLat, dLng]]);
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
      } else if (sourceLatLng) {
        const [sLat, sLng] = sourceLatLng.split(',').map(Number);
        map.setView([sLat, sLng], 14);
      } else if (destinationLatLng) {
        const [dLat, dLng] = destinationLatLng.split(',').map(Number);
        map.setView([dLat, dLng], 14);
      }
      return;
    }

    // Color Palette:
    // Route 0 (Fastest): Cyan / Blue (#0284c7)
    // Route 1 (Balanced): Amber / Orange (#f59e0b)
    // Route 2 (Slowest / Eco): Green (#10b981)
    const routeColors = ['#0284c7', '#f59e0b', '#10b981'];
    const routeNames = ['FASTEST', 'BALANCED', 'SLOW/ECO'];
    const allLatLons = [];

    // Render order: unselected routes first, selected route last (on top)
    const unselectedIndices = routes.map((_, i) => i).filter(i => i !== selectedRouteIdx);
    const renderOrder = [...unselectedIndices, selectedRouteIdx].filter(i => i >= 0 && i < routes.length);

    renderOrder.forEach(idx => {
      const route = routes[idx];
      const isSelected = idx === selectedRouteIdx;
      const color = routeColors[idx % routeColors.length];
      const rName = routeNames[idx % routeNames.length];
      const latLons = extractLeafletLatLons(route);

      if (latLons.length > 0) {
        allLatLons.push(...latLons);

        // Halo background line for selected route
        if (isSelected) {
          const halo = L.polyline(latLons, {
            color: color,
            weight: 14,
            opacity: 0.35,
            pane: 'routesPane',
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map);

          halo.on('click', (e) => {
            console.log(`[ROUTE CLICK]\nroute: ${rName}`);
            if (e && e.originalEvent) {
              e.originalEvent._isRouteClick = true;
              if (e.originalEvent.stopPropagation) e.originalEvent.stopPropagation();
              if (e.originalEvent.stopImmediatePropagation) e.originalEvent.stopImmediatePropagation();
              L.DomEvent.stopPropagation(e.originalEvent);
              L.DomEvent.stop(e.originalEvent);
            }
            if (onRouteClick) onRouteClick(idx);
          });

          polylinesRef.current.push(halo);
        }

        // Main polyline layer
        const polyline = L.polyline(latLons, {
          color: color,
          weight: isSelected ? 8 : 5,
          opacity: isSelected ? 0.95 : 0.75,
          pane: 'routesPane',
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        polyline.on('click', (e) => {
          console.log(`[ROUTE CLICK]\nroute: ${rName}`);
          if (e && e.originalEvent) {
            e.originalEvent._isRouteClick = true;
            if (e.originalEvent.stopPropagation) e.originalEvent.stopPropagation();
            if (e.originalEvent.stopImmediatePropagation) e.originalEvent.stopImmediatePropagation();
            L.DomEvent.stopPropagation(e.originalEvent);
            L.DomEvent.stop(e.originalEvent);
          }
          if (onRouteClick) onRouteClick(idx);
        });

        polylinesRef.current.push(polyline);

        // Render warning/alert marker ONLY when traffic_alert.active === true
        if (route.traffic_alert && route.traffic_alert.active === true) {
          const midIdx = Math.floor(latLons.length / 2);
          const midPoint = latLons[midIdx] || latLons[0];
          const probVal = route.traffic_alert.high_probability || 0.7;
          const probPct = (probVal <= 1 ? probVal * 100 : probVal).toFixed(1);

          const alertIcon = L.divIcon({
            className: 'custom-traffic-alert-marker',
            html: `
              <div style="
                position: relative;
                display: flex;
                align-items: center;
                gap: 6px;
                background: #dc2626;
                color: white;
                font-weight: 800;
                font-size: 11px;
                padding: 4px 8px;
                border-radius: 6px;
                border: 2px solid #ffffff;
                box-shadow: 0 4px 12px rgba(220, 38, 38, 0.6);
                cursor: pointer;
                white-space: nowrap;
              ">
                <span style="font-size: 14px;">⚠️</span>
                <span>HIGH TRAFFIC ALERT (${probPct}%)</span>
              </div>
            `,
            iconSize: [160, 30],
            iconAnchor: [80, 15]
          });

          const alertMarker = L.marker(midPoint, { icon: alertIcon }).addTo(map);
          alertMarker.on('click', (e) => {
            if (e && e.originalEvent) {
              e.originalEvent._isMarkerClick = true;
              L.DomEvent.stopPropagation(e.originalEvent);
            }
            if (onRouteClick) onRouteClick(idx);
          });
          alertMarkersRef.current.push(alertMarker);
        }
      }
    });

    // Fit map to cover ALL 3 routes simultaneously
    if (allLatLons.length > 0) {
      const bounds = L.latLngBounds(allLatLons);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }

    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 150);
  }, [routes, selectedRouteIdx, sourceLatLng, destinationLatLng, onRouteClick]);

  return (
    <div className="map-wrapper" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {pinMode && (
        <div className="map-status-bar animate-slide-up" style={{ zIndex: 1000 }}>
          <div className="map-status-text">
            <span className="pulse-dot" style={{ background: pinMode === 'source' ? '#10b981' : '#ef4444' }}></span>
            Click on map to drop pin for: <strong>{pinMode.toUpperCase()}</strong>
          </div>
        </div>
      )}

      {routes && routes.length > 0 && (
        <div 
          className="map-route-legend"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            background: 'rgba(17, 24, 39, 0.88)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            color: 'white',
            fontFamily: "'Outfit', sans-serif",
            fontSize: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (e.nativeEvent) {
              e.nativeEvent._isLegendClick = true;
              if (e.nativeEvent.stopPropagation) e.nativeEvent.stopPropagation();
            }
          }}
        >
          <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: '2px' }}>
            ROUTE MAP LEGEND
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: selectedRouteIdx === 0 ? 1 : 0.7 }} onClick={(e) => { e.stopPropagation(); if (e.nativeEvent) e.nativeEvent._isLegendClick = true; console.log("[ROUTE CLICK]\nroute: FASTEST"); onRouteClick && onRouteClick(0); }}>
            <span style={{ width: '16px', height: '4px', borderRadius: '2px', background: '#0284c7' }}></span>
            <span style={{ fontWeight: selectedRouteIdx === 0 ? 800 : 600, color: selectedRouteIdx === 0 ? '#38bdf8' : '#e2e8f0' }}>FASTEST ROUTE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: selectedRouteIdx === 1 ? 1 : 0.7 }} onClick={(e) => { e.stopPropagation(); if (e.nativeEvent) e.nativeEvent._isLegendClick = true; console.log("[ROUTE CLICK]\nroute: BALANCED"); onRouteClick && onRouteClick(1); }}>
            <span style={{ width: '16px', height: '4px', borderRadius: '2px', background: '#f59e0b' }}></span>
            <span style={{ fontWeight: selectedRouteIdx === 1 ? 800 : 600, color: selectedRouteIdx === 1 ? '#fbbf24' : '#e2e8f0' }}>BALANCED ROUTE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: selectedRouteIdx === 2 ? 1 : 0.7 }} onClick={(e) => { e.stopPropagation(); if (e.nativeEvent) e.nativeEvent._isLegendClick = true; console.log("[ROUTE CLICK]\nroute: SLOW/ECO"); onRouteClick && onRouteClick(2); }}>
            <span style={{ width: '16px', height: '4px', borderRadius: '2px', background: '#10b981' }}></span>
            <span style={{ fontWeight: selectedRouteIdx === 2 ? 800 : 600, color: selectedRouteIdx === 2 ? '#34d399' : '#e2e8f0' }}>SLOWEST / ECO ROUTE</span>
          </div>
        </div>
      )}

      <div id="map" ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />
    </div>
  );
};

export default TrafficMap;