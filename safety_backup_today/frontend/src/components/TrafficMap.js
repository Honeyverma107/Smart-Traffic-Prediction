import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useTheme } from '../ThemeContext';

const TrafficMap = ({ 
  routes, 
  selectedRouteIdx, 
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

  const routePolylinesRef = useRef([]);
  const sourceMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const legendControlRef = useRef(null);
  const watchIdRef = useRef(null);

  // SVG Marker Generator
  const getMarkerIcon = (color, label) => L.divIcon({
    className: 'custom-marker-wrapper',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${color}"/>
          <circle cx="12" cy="9" r="3.5" fill="white"/>
        </svg>
        <div style="
          position: absolute; 
          top: -20px; 
          background: var(--bg-surface, rgba(15, 23, 42, 0.95)); 
          color: var(--text-primary, white); 
          font-size: 10px; 
          font-weight: 700; 
          padding: 2px 6px; 
          border-radius: 4px; 
          border: 1px solid var(--border-glass, rgba(255, 255, 255, 0.2));
          white-space: nowrap;
          box-shadow: 0 4px 10px rgba(0,0,0,0.4);
          pointer-events: none;
          letter-spacing: 0.5px;
          font-family: sans-serif;
        ">
          ${label}
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });

  // Dynamic Tile Layer URL generator
  const getTileUrl = (currentTheme) => {
    return currentTheme === 'light'
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  };

  // Map Initialization
  useEffect(() => {
    if (!mapInstanceRef.current) {
      // Default center: Indore, India [22.7196, 75.8577]
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false
      }).setView([22.7196, 75.8577], 13);

      // Tile map initial load
      tileLayerRef.current = L.tileLayer(getTileUrl(theme), {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapInstanceRef.current);

      // Zoom control bottom-left
      L.control.zoom({ position: 'bottomleft' }).addTo(mapInstanceRef.current);

      // Map click listener
      mapInstanceRef.current.on('click', (e) => {
        const { lat, lng } = e.latlng;
        const exactCoords = `${lat.toFixed(6)},${lng.toFixed(6)}`;
        if (onMapClick) {
          onMapClick(exactCoords);
        }
      });

      // Live GPS tracking marker
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          position => {
            const { latitude, longitude } = position.coords;
            if (mapInstanceRef.current) {
              if (userMarkerRef.current) {
                userMarkerRef.current.setLatLng([latitude, longitude]);
              } else {
                userMarkerRef.current = L.circleMarker([latitude, longitude], {
                  radius: 7,
                  fillColor: '#3b82f6',
                  color: '#ffffff',
                  weight: 2.5,
                  opacity: 1,
                  fillOpacity: 0.9
                }).addTo(mapInstanceRef.current).bindPopup("Your Location");
              }
            }
          },
          err => {
            if (err.code !== err.PERMISSION_DENIED) {
              console.warn('[TrafficMap Geolocation]', err.message);
            }
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onMapClick]);

  // Update map tiles dynamically when theme changes
  useEffect(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(getTileUrl(theme));
    }
  }, [theme]);

  // Update Source and Destination Pins
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (sourceMarkerRef.current) {
      mapInstanceRef.current.removeLayer(sourceMarkerRef.current);
      sourceMarkerRef.current = null;
    }
    if (destMarkerRef.current) {
      mapInstanceRef.current.removeLayer(destMarkerRef.current);
      destMarkerRef.current = null;
    }

    // Source marker (Green)
    if (sourceLatLng) {
      const [lat, lng] = sourceLatLng.split(',').map(Number);
      sourceMarkerRef.current = L.marker([lat, lng], {
        icon: getMarkerIcon('#10b981', 'STARTING POINT'),
        zIndexOffset: 1000
      }).addTo(mapInstanceRef.current);

      sourceMarkerRef.current.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
      });
    }

    // Destination marker (Red)
    if (destinationLatLng) {
      const [lat, lng] = destinationLatLng.split(',').map(Number);
      destMarkerRef.current = L.marker([lat, lng], {
        icon: getMarkerIcon('#ef4444', 'DESTINATION'),
        zIndexOffset: 1000
      }).addTo(mapInstanceRef.current);

      destMarkerRef.current.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
      });
    }

    // Auto fit bounds if pins exist and no routes are displayed
    if (!routes || routes.length === 0) {
      if (sourceLatLng && destinationLatLng) {
        const sCoords = sourceLatLng.split(',').map(Number);
        const dCoords = destinationLatLng.split(',').map(Number);
        mapInstanceRef.current.fitBounds([sCoords, dCoords], { padding: [60, 60] });
      } else if (sourceLatLng) {
        const sCoords = sourceLatLng.split(',').map(Number);
        mapInstanceRef.current.setView(sCoords, 14);
      } else if (destinationLatLng) {
        const dCoords = destinationLatLng.split(',').map(Number);
        mapInstanceRef.current.setView(dCoords, 14);
      }
    }
  }, [sourceLatLng, destinationLatLng, routes]);

  // Draw Alternative Routes and Traffic Overlay
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    routePolylinesRef.current.forEach(polyline => {
      mapInstanceRef.current.removeLayer(polyline);
    });
    routePolylinesRef.current = [];

    if (legendControlRef.current) {
      mapInstanceRef.current.removeControl(legendControlRef.current);
      legendControlRef.current = null;
    }

    if (routes && routes.length > 0) {
      const allBounds = [];
      
      const getTrafficColor = (congestionLevel) => {
        const raw = (congestionLevel || 'low').toString().toLowerCase();
        if (raw.includes('low') || raw.includes('green') || raw.includes('smooth')) {
          return '#10b981'; // Green
        }
        if (raw.includes('high') || raw.includes('heavy') || raw.includes('red')) {
          return '#ef4444'; // Red
        }
        return '#f59e0b';   // Yellow / Orange (NORMAL / MEDIUM)
      };

      routes.forEach((route, index) => {
        const isSelected = index === selectedRouteIdx;
        const color = getTrafficColor(route.predicted_congestion || route.congestion_level);
        
        if (route.segments && route.segments.length > 0) {
          const latlngs = route.segments.flatMap(seg => [
            [seg.latitude_start, seg.longitude_start],
            [seg.latitude_end, seg.longitude_end]
          ]);

          const hitAreaPolyline = L.polyline(latlngs, {
            color: 'transparent',
            weight: 20,
            cursor: 'pointer'
          }).addTo(mapInstanceRef.current);

          hitAreaPolyline.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            if (onRouteClick) onRouteClick(index);
          });
          routePolylinesRef.current.push(hitAreaPolyline);

          const polyline = L.polyline(latlngs, {
            color: color,
            weight: isSelected ? 7 : 5,
            opacity: isSelected ? 0.95 : 0.55,
            lineCap: 'round',
            lineJoin: 'round',
            dashArray: isSelected ? null : '6, 6'
          }).addTo(mapInstanceRef.current);

          polyline.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            if (onRouteClick) onRouteClick(index);
          });

          if (route.recommended) {
            const glow = L.polyline(latlngs, {
              color: color,
              weight: isSelected ? 12 : 8,
              opacity: isSelected ? 0.3 : 0.15,
              lineCap: 'round',
              interactive: false
            }).addTo(mapInstanceRef.current);
            routePolylinesRef.current.push(glow);
          }

          routePolylinesRef.current.push(polyline);
          allBounds.push(...latlngs);
        }
      });

      // Single Traffic Legend Control on the map
      const legend = L.control({ position: 'bottomright' });
      legend.onAdd = () => {
        const div = L.DomUtil.create('div', 'map-legend-card glass-card');
        L.DomEvent.disableClickPropagation(div);
        
        div.innerHTML = `
          <div class="legend-header">TRAFFIC LEVEL</div>
          <div class="legend-group">
            <div class="legend-item"><span class="legend-dot green" style="background:#10b981; box-shadow:0 0 8px #10b981;"></span> 🟢 Low</div>
            <div class="legend-item"><span class="legend-dot orange" style="background:#f59e0b; box-shadow:0 0 8px #f59e0b;"></span> 🟡 Normal / Medium</div>
            <div class="legend-item"><span class="legend-dot red" style="background:#ef4444; box-shadow:0 0 8px #ef4444;"></span> 🔴 High</div>
          </div>
        `;
        return div;
      };
      legend.addTo(mapInstanceRef.current);
      legendControlRef.current = legend;

      // Fit map to route bounds
      if (allBounds.length > 0) {
        mapInstanceRef.current.fitBounds(allBounds, { padding: [50, 50] });
      }
    }
  }, [routes, selectedRouteIdx, onRouteClick]);

  return (
    <div className="map-wrapper">
      {pinMode && (
        <div className="map-pin-notice">
          <span className="pulse-dot" style={{ background: pinMode === 'source' ? '#10b981' : '#ef4444' }}></span>
          <span>Click on the map to set location for: <strong>{pinMode.toUpperCase()}</strong></span>
        </div>
      )}
      <div id="map" ref={mapRef} />
    </div>
  );
};

export default TrafficMap;