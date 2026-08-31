import React from 'react';

const AnalyticsModule = ({ t, challans }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <div style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: '10px' }}>
      <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: t.textPrimary }}>
        TRAFFIC & ENFORCEMENT ANALYTICS
      </h2>
      <span style={{ fontSize: '0.78rem', color: t.textSecondary }}>Violation Distribution, Compliance Metrics & Recovery Breakdown</span>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
      <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '18px', boxShadow: t.shadow }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '0.88rem', fontWeight: 700, color: t.textPrimary }}>Violations by Vehicle Type</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}><span>Car</span><span>70%</span></div>
            <div style={{ width: '100%', height: '8px', background: t.bgElevated, borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: '70%', height: '100%', background: t.primary }}></div></div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}><span>Two Wheeler</span><span>20%</span></div>
            <div style={{ width: '100%', height: '8px', background: t.bgElevated, borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: '20%', height: '100%', background: t.warning }}></div></div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}><span>Commercial Heavy</span><span>10%</span></div>
            <div style={{ width: '100%', height: '8px', background: t.bgElevated, borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: '10%', height: '100%', background: t.danger }}></div></div>
          </div>
        </div>
      </div>

      <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '18px', boxShadow: t.shadow }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '0.88rem', fontWeight: 700, color: t.textPrimary }}>Enforcement Status Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'center' }}>
          <div style={{ background: t.bgElevated, padding: '14px', borderRadius: '6px', border: `1px solid ${t.border}` }}>
            <span style={{ fontSize: '0.68rem', color: t.textMuted, display: 'block' }}>Verified Challans</span>
            <strong style={{ fontSize: '1.4rem', color: t.primary }}>{challans.length}</strong>
          </div>
          <div style={{ background: t.bgElevated, padding: '14px', borderRadius: '6px', border: `1px solid ${t.border}` }}>
            <span style={{ fontSize: '0.68rem', color: t.textMuted, display: 'block' }}>Signal Compliance</span>
            <strong style={{ fontSize: '1.4rem', color: t.success }}>98.4%</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AnalyticsModule;
