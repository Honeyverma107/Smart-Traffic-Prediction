import React from 'react';

const VehicleDatabase = ({ t, vehicleDatabase, setSelectedVehicleHistory }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <div style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: '10px' }}>
      <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: t.textPrimary }}>
        VEHICLE INTELLIGENCE
      </h2>
      <span style={{ fontSize: '0.78rem', color: t.textSecondary }}>Registered Vehicle Records, Infraction Frequency & Fine History</span>
    </div>

    <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '16px 20px', boxShadow: t.shadow }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: 'left', color: t.textMuted }}>
            <th style={{ padding: '10px', fontWeight: 600 }}>Vehicle Number</th>
            <th style={{ padding: '10px', fontWeight: 600 }}>Vehicle Type</th>
            <th style={{ padding: '10px', fontWeight: 600 }}>Total Violations</th>
            <th style={{ padding: '10px', fontWeight: 600 }}>Total Challans</th>
            <th style={{ padding: '10px', fontWeight: 600 }}>Total Fine Accumulated</th>
            <th style={{ padding: '10px', fontWeight: 600 }}>Last Violation</th>
            <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {vehicleDatabase.map((v) => (
            <tr key={v.vehicle_number} style={{ borderBottom: `1px solid ${t.border}` }}>
              <td style={{ padding: '10px', fontWeight: 800, color: t.primary }}>{v.vehicle_number}</td>
              <td style={{ padding: '10px', color: t.textPrimary }}>{v.vehicle_type}</td>
              <td style={{ padding: '10px', color: t.danger, fontWeight: 700 }}>{v.total_violations}</td>
              <td style={{ padding: '10px', color: t.textPrimary }}>{v.total_challans}</td>
              <td style={{ padding: '10px', color: t.danger, fontWeight: 800 }}>₹{v.total_fine}</td>
              <td style={{ padding: '10px', color: t.textSecondary }}>{v.last_violation}</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>
                <button type="button" onClick={() => setSelectedVehicleHistory(v)} style={{ background: t.bgElevated, color: t.textPrimary, border: `1px solid ${t.border}`, borderRadius: '4px', padding: '5px 12px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>History</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default VehicleDatabase;
