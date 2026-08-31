import React, { useState } from 'react';

const PermissionDialog = ({ onPermission }) => {
  const [isLocating, setIsLocating] = useState(false);

  const handleAllow = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      onPermission(false);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = new Date(position.timestamp || Date.now()).toISOString();

        console.log(`[PermissionDialog Geolocation Success] Lat: ${latitude}, Lng: ${longitude}, Accuracy: ${accuracy}m, Timestamp: ${timestamp}`);

        let address = `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
          const resp = await fetch(url);
          const data = await resp.json();
          if (data && data.display_name) {
            address = data.display_name;
          }
        } catch (e) {
          console.warn('[PermissionDialog] Reverse geocode error:', e);
        }

        setIsLocating(false);
        onPermission(true, {
          latitude,
          longitude,
          accuracy,
          timestamp,
          address,
        });
      },
      (error) => {
        console.warn(`[PermissionDialog Geolocation Error] Code ${error.code}: ${error.message}`);
        setIsLocating(false);
        onPermission(false, null, error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  return (
    <>
      <div className="modal-overlay" onClick={() => !isLocating && onPermission(false)}></div>
      <div className="permission-dialog glass-card">
        <div className="permission-icon-box">
          <span className="material-symbols-outlined permission-icon">my_location</span>
        </div>
        <h3>Enable Precise Location?</h3>
        <p>
          Allow location access to automatically set your starting point, calculate local traffic congestion, and receive accurate ETAs.
        </p>
        <div className="permission-buttons">
          <button 
            type="button"
            className="permission-btn deny-btn" 
            onClick={() => onPermission(false)}
            disabled={isLocating}
          >
            Skip for Now
          </button>
          <button 
            type="button"
            id="allowAccessBtn"
            className="permission-btn allow-btn" 
            onClick={handleAllow}
            disabled={isLocating}
          >
            {isLocating ? 'Detecting Location...' : 'Allow Access'}
          </button>
        </div>
      </div>
    </>
  );
};

export default PermissionDialog;