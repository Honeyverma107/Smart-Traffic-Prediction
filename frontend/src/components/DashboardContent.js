import React from 'react';

const DashboardContent = ({ t, challans, signalState, setSelectedViolation }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    <div style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: '10px' }}>
      <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: t.textPrimary }}>
        AI TRAFFIC COMMAND CENTER — EXECUTIVE DASHBOARD
      </h2>
      <span style={{ fontSize: '0.78rem', color: t.textSecondary }}>Real-time Operations & Junction Performance Overview</span>
    </div>

    {/* Executive KPI Grid */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
      <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '16px', boxShadow: t.shadow }}>
        <span style={{ fontSize: '0.65rem', color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>TODAY'S VIOLATIONS</span>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: t.textPrimary, marginTop: '4px' }}>{challans.length}</div>
        <span style={{ fontSize: '0.7rem', color: t.textSecondary, marginTop: '2px', display: 'block' }}>Real-time Detection Log</span>
      </div>
      <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '16px', boxShadow: t.shadow }}>
        <span style={{ fontSize: '0.65rem', color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>TOTAL AI CHALLANS</span>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: t.primary, marginTop: '4px' }}>{challans.length}</div>
        <span style={{ fontSize: '0.7rem', color: t.textSecondary, marginTop: '2px', display: 'block' }}>Issued Enforcement Records</span>
      </div>
      <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '16px', boxShadow: t.shadow }}>
        <span style={{ fontSize: '0.65rem', color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>PENDING REVIEWS</span>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: t.warning, marginTop: '4px' }}>{challans.filter(c => (c.status || '').toLowerCase().includes('pending')).length}</div>
        <span style={{ fontSize: '0.7rem', color: t.textSecondary, marginTop: '2px', display: 'block' }}>Awaiting Verification</span>
      </div>
      <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '16px', boxShadow: t.shadow }}>
        <span style={{ fontSize: '0.65rem', color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>ACTIVE CAMERAS</span>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: t.success, marginTop: '4px' }}>1 / 1</div>
        <span style={{ fontSize: '0.7rem', color: t.textSecondary, marginTop: '2px', display: 'block' }}>CAM-01 Live Feed Connected</span>
      </div>
    </div>

    {/* Status Overview & Traffic Density */}
    <div style={{ display: 'grid', gridTemplateColumns: '60% 38%', gap: '2%' }}>
      {/* Traffic Congestion & Signal Analytics */}
      <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '18px', boxShadow: t.shadow }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: t.textPrimary }}>Junction Operations & Congestion Overview</h3>
          <span style={{ fontSize: '0.72rem', color: t.success, fontWeight: 600 }}>● Live Stream Sync</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: t.bgElevated, padding: '12px', borderRadius: '6px', border: `1px solid ${t.border}` }}>
            <span style={{ fontSize: '0.68rem', color: t.textMuted, display: 'block' }}>Current Traffic Flow:</span>
            <strong style={{ fontSize: '1.05rem', color: t.textPrimary }}>Moderate Density (34 veh/min)</strong>
          </div>
          <div style={{ background: t.bgElevated, padding: '12px', borderRadius: '6px', border: `1px solid ${t.border}` }}>
            <span style={{ fontSize: '0.68rem', color: t.textMuted, display: 'block' }}>Signal Phase:</span>
            <strong style={{ fontSize: '1.05rem', color: signalState === 'RED' ? t.danger : t.success }}>
              {signalState === 'RED' ? '🔴 RED SIGNAL (ACTIVE)' : '🟢 GREEN SIGNAL'}
            </strong>
          </div>
        </div>

        {/* Vehicle Type Count Distribution */}
        <span style={{ fontSize: '0.74rem', fontWeight: 600, color: t.textMuted, display: 'block', marginBottom: '8px' }}>
          VEHICLE CLASS DISTRIBUTION (CURRENT SESSION)
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '3px' }}>
              <span>Passenger Cars</span>
              <span>64%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: t.bgElevated, borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '64%', height: '100%', background: t.primary }}></div>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '3px' }}>
              <span>Two Wheelers / Motorcycles</span>
              <span>24%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: t.bgElevated, borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '24%', height: '100%', background: t.warning }}></div>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '3px' }}>
              <span>Buses & Commercial Heavy Vehicles</span>
              <span>12%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: t.bgElevated, borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '12%', height: '100%', background: t.danger }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Infractions Quick Feed */}
      <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '18px', boxShadow: t.shadow }}>
        <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: t.textPrimary, marginBottom: '14px' }}>
          Recent Infractions Log
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {challans.slice(0, 4).map((c) => (
            <div key={c.id || c.challan_id} style={{ background: t.bgElevated, padding: '10px', borderRadius: '6px', border: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.8rem', color: t.primary, display: 'block' }}>{c.challan_id}</strong>
                <span style={{ fontSize: '0.72rem', color: t.textSecondary }}>{c.vehicle_number} ({c.vehicle_type})</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.65rem', color: t.danger, fontWeight: 600, display: 'block' }}>🔴 RED LIGHT</span>
                <span style={{ fontSize: '0.68rem', color: t.textMuted }}>{c.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default DashboardContent;
