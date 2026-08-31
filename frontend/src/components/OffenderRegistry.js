import React from 'react';

const OffenderRegistry = ({ t, repeatOffenders, setSelectedVehicleHistory }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <div style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: '10px' }}>
      <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: t.textPrimary }}>
        REPEAT OFFENDER REGISTRY
      </h2>
      <span style={{ fontSize: '0.78rem', color: t.textSecondary }}>High-Risk Vehicles Ranked by Violation Severity & Frequency</span>
    </div>

    <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '16px 20px', boxShadow: t.shadow }}>
      {repeatOffenders.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: 'left', color: t.textMuted }}>
              <th style={{ padding: '10px', fontWeight: 600 }}>Vehicle Number</th>
              <th style={{ padding: '10px', fontWeight: 600 }}>Vehicle Type</th>
              <th style={{ padding: '10px', fontWeight: 600 }}>Violation Count</th>
              <th style={{ padding: '10px', fontWeight: 600 }}>Challans Issued</th>
              <th style={{ padding: '10px', fontWeight: 600 }}>Total Penalty Fine</th>
              <th style={{ padding: '10px', fontWeight: 600 }}>Risk Status</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {repeatOffenders.map((v) => (
              <tr key={v.vehicle_number} style={{ borderBottom: `1px solid ${t.border}` }}>
                <td style={{ padding: '10px', fontWeight: 800, color: t.primary }}>{v.vehicle_number}</td>
                <td style={{ padding: '10px', color: t.textPrimary }}>{v.vehicle_type}</td>
                <td style={{ padding: '10px', color: t.danger, fontWeight: 800 }}>{v.total_violations}</td>
                <td style={{ padding: '10px', color: t.textPrimary }}>{v.total_challans}</td>
                <td style={{ padding: '10px', color: t.danger, fontWeight: 800 }}>₹{v.total_fine}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{ background: t.dangerBg, color: t.danger, border: `1px solid ${t.dangerBorder}`, fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>
                    {v.total_violations > 1 ? 'REPEAT OFFENDER' : 'SINGLE OFFENCE'}
                  </span>
                </td>
                <td style={{ padding: '10px', textAlign: 'right' }}>
                  <button type="button" onClick={() => setSelectedVehicleHistory(v)} style={{ background: t.primary, color: '#ffffff', border: 'none', borderRadius: '4px', padding: '5px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>View Record</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ padding: '30px', textAlign: 'center', color: t.textMuted, fontSize: '0.82rem' }}>
          No repeat offenders identified in current monitoring window. All vehicles comply with single-offence threshold.
        </div>
      )}
    </div>
  </div>
);

export default OffenderRegistry;
