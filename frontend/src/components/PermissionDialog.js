import React from 'react';

const PermissionDialog = ({ onPermission }) => {

  const handleAllow = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`PermissionDialog - Current location: ${latitude}, ${longitude}`);
        let address = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
        try {
          const resp = await fetch(`/api/location/reverse/?lat=${latitude}&lng=${longitude}`);
          const data = await resp.json();
          if (data && data.address) {
            address = data.address;
          }
        } catch (e) {
          console.warn('TomTom Reverse geocode failed for current location:', e);
        }

        onPermission(true, {
          latitude,
          longitude,
          address,
        });
      }, () => {
        onPermission(true, null);
      }, { enableHighAccuracy: true });
    } else {
      onPermission(true, null);
    }
  };

  return (
    <>
      <div className="modal-overlay"></div>
      <div className="permission-dialog">
        <span className="material-symbols-outlined permission-icon">my_location</span>
        <h3>Use Location Service?</h3>
        <p>Enable precise location access to automatically set your starting point, view live local traffic congestion, and calculate accurate ETAs.</p>
        <div className="permission-buttons">
          <button 
            className="permission-btn permission-deny" 
            onClick={() => onPermission(false)}
          >
            Skip
          </button>
          <button 
            className="permission-btn permission-allow" 
            onClick={handleAllow}
          >
            Allow Access
          </button>
        </div>
      </div>
    </>
  );
};

export default PermissionDialog;