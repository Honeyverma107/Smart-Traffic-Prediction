import React from 'react';

const SystemSettingsModule = ({ t }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <div style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: '10px' }}>
      <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: t.textPrimary }}>
        COMMAND CENTER SETTINGS
      </h2>
      <span style={{ fontSize: '0.78rem', color: t.textSecondary }}>Junction Infrastructure, Camera Parameters & AI Vision Model Configuration</span>
    </div>

    <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '20px', boxShadow: t.shadow }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.8rem' }}>
        <div style={{ background: t.bgElevated, padding: '14px', borderRadius: '6px', border: `1px solid ${t.border}` }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 700, color: t.primary }}>Junction & Camera Parameters</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: t.textSecondary }}>
            <div>Junction Name: <strong style={{ color: t.textPrimary }}>Vijay Nagar Square, Indore</strong></div>
            <div>Camera Source ID: <strong style={{ color: t.textPrimary }}>CAM-01</strong></div>
            <div>Stream Video File: <code style={{ color: t.primary }}>/ai_challan_violation.mp4</code></div>
            <div>Stop Line Y-Ratio Threshold: <strong style={{ color: t.danger }}>0.55</strong></div>
          </div>
        </div>

        <div style={{ background: t.bgElevated, padding: '14px', borderRadius: '6px', border: `1px solid ${t.border}` }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 700, color: t.primary }}>AI Engine Specs</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: t.textSecondary }}>
            <div>YOLO Model Version: <strong style={{ color: t.textPrimary }}>v8-traffic-custom</strong></div>
            <div>ANPR Engine: <strong style={{ color: t.success }}>OCR Active</strong></div>
            <div>Confidence Cutoff: <strong style={{ color: t.textPrimary }}>85%</strong></div>
            <div>Status: <strong style={{ color: t.success }}>Operational</strong></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SystemSettingsModule;
