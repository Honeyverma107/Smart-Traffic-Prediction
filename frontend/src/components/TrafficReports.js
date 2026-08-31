import React from 'react';
import { Download } from 'lucide-react';

const TrafficReports = ({ t, handleDownloadCSV }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <div style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: '10px' }}>
      <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: t.textPrimary }}>
        TRAFFIC & ENFORCEMENT REPORTS
      </h2>
      <span style={{ fontSize: '0.78rem', color: t.textSecondary }}>Official Municipal Audits, Export Logs & Enforcement Records</span>
    </div>

    <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '18px', boxShadow: t.shadow }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[
          'Daily Traffic Enforcement Report',
          'Red Light Violation Audit Summary',
          'AI Auto-Challan Issuance Log',
          'Repeat Offender Intelligence Report',
          'Junction Congestion & Traffic Analytics'
        ].map((rep) => (
          <div key={rep} style={{ background: t.bgElevated, padding: '12px 16px', borderRadius: '6px', border: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '0.85rem', color: t.textPrimary, display: 'block' }}>{rep}</strong>
              <span style={{ fontSize: '0.68rem', color: t.textMuted }}>Generated dynamically from live database session.</span>
            </div>
            <button type="button" onClick={() => handleDownloadCSV(rep)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: t.primaryBg, border: `1px solid ${t.primaryBorder}`, color: t.primary, fontWeight: 700, padding: '6px 14px', borderRadius: '4px', fontSize: '0.76rem', cursor: 'pointer' }}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default TrafficReports;
