import React, { useState } from 'react';
import { Search, Filter, ShieldAlert, Eye, CheckCircle, AlertTriangle, FileText, X } from 'lucide-react';

const ViolationManagement = ({
  t,
  searchQuery,
  setSearchQuery,
  filterViolationType,
  setFilterViolationType,
  filterStatus,
  setFilterStatus,
  filteredChallans,
  setSelectedViolation,
  setShowChallanModal
}) => {
  const [inspectModalChallan, setInspectModalChallan] = useState(null);

  const totalViolationsCount = filteredChallans ? filteredChallans.length : 0;
  const pendingCount = (filteredChallans || []).filter(c => (c.status || '').toLowerCase().includes('pending')).length;
  const approvedCount = (filteredChallans || []).filter(c => (c.status || '').toLowerCase().includes('approved') || (c.status || '').toLowerCase().includes('issued')).length;
  const totalFineSum = (filteredChallans || []).reduce((sum, c) => sum + (c.fine_amount || 1000), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* HEADER TITLE */}
      <div style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: t.textPrimary, letterSpacing: '0.3px' }}>
            VIOLATION MANAGEMENT & ANPR AUDIT
          </h2>
          <span style={{ fontSize: '0.78rem', color: t.textSecondary }}>
            Review Computer Vision Automated Detections, Evidence Snapshots & Verification Status
          </span>
        </div>
      </div>

      {/* KPI METRICS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '16px', boxShadow: t.shadow, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: t.dangerBg, border: `1px solid ${t.dangerBorder}`, padding: '10px', borderRadius: '8px', color: t.danger }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: t.textMuted, fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Detected Violations</span>
            <strong style={{ fontSize: '1.35rem', color: t.danger, fontWeight: 800 }}>{totalViolationsCount}</strong>
          </div>
        </div>

        <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '16px', boxShadow: t.shadow, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: t.warningBg, border: `1px solid ${t.warningBorder}`, padding: '10px', borderRadius: '8px', color: t.warning }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: t.textMuted, fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Pending Review</span>
            <strong style={{ fontSize: '1.35rem', color: t.warning, fontWeight: 800 }}>{pendingCount}</strong>
          </div>
        </div>

        <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '16px', boxShadow: t.shadow, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: t.successBg, border: `1px solid ${t.successBorder}`, padding: '10px', borderRadius: '8px', color: t.success }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: t.textMuted, fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Approved & Issued</span>
            <strong style={{ fontSize: '1.35rem', color: t.success, fontWeight: 800 }}>{approvedCount}</strong>
          </div>
        </div>

        <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '16px', boxShadow: t.shadow, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: t.primaryBg, border: `1px solid ${t.primaryBorder}`, padding: '10px', borderRadius: '8px', color: t.primary }}>
            <FileText size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: t.textMuted, fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Total Fines Assessed</span>
            <strong style={{ fontSize: '1.35rem', color: t.primary, fontWeight: 800 }}>₹{totalFineSum.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', boxShadow: t.shadow }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '420px', background: t.bgElevated, border: `1px solid ${t.border}`, borderRadius: '6px', padding: '6px 12px' }}>
          <Search size={16} color={t.textMuted} />
          <input
            type="text"
            placeholder="Search by Vehicle Number, Challan ID, Location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: 'none', border: 'none', color: t.textPrimary, outline: 'none', fontSize: '0.82rem', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: t.textSecondary }}>
            <Filter size={14} />
            <span>Violation Type:</span>
            <select
              value={filterViolationType}
              onChange={(e) => setFilterViolationType(e.target.value)}
              style={{ background: t.bgElevated, color: t.textPrimary, border: `1px solid ${t.border}`, borderRadius: '6px', padding: '5px 10px', fontSize: '0.78rem', outline: 'none' }}
            >
              <option value="ALL">All Types</option>
              <option value="RED LIGHT">Red Light Violation</option>
              <option value="STOP LINE">Stop Line Violation</option>
              <option value="SIGNAL JUMP">Signal Jump</option>
              <option value="SPEEDING">Speeding</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: t.textSecondary }}>
            <span>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ background: t.bgElevated, color: t.textPrimary, border: `1px solid ${t.border}`, borderRadius: '6px', padding: '5px 10px', fontSize: '0.78rem', outline: 'none' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="ISSUED">Issued</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIOLATIONS TABLE */}
      <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '16px 20px', boxShadow: t.shadow, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: 'left', color: t.textMuted }}>
              <th style={{ padding: '12px 10px', fontWeight: 700 }}>Challan ID</th>
              <th style={{ padding: '12px 10px', fontWeight: 700 }}>Vehicle Number</th>
              <th style={{ padding: '12px 10px', fontWeight: 700 }}>Vehicle Type</th>
              <th style={{ padding: '12px 10px', fontWeight: 700 }}>Violation Type</th>
              <th style={{ padding: '12px 10px', fontWeight: 700 }}>Signal</th>
              <th style={{ padding: '12px 10px', fontWeight: 700 }}>Timestamp</th>
              <th style={{ padding: '12px 10px', fontWeight: 700 }}>Location</th>
              <th style={{ padding: '12px 10px', fontWeight: 700 }}>Fine</th>
              <th style={{ padding: '12px 10px', fontWeight: 700 }}>Status</th>
              <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 700 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredChallans.map((row) => (
              <tr key={row.id || row.challan_id} style={{ borderBottom: `1px solid ${t.border}` }}>
                <td style={{ padding: '12px 10px', fontWeight: 800, color: t.primary }}>{row.challan_id}</td>
                <td style={{ padding: '12px 10px', color: t.textPrimary, fontWeight: 800 }}>{row.vehicle_number}</td>
                <td style={{ padding: '12px 10px', color: t.textPrimary }}>{row.vehicle_type}</td>
                <td style={{ padding: '12px 10px', color: t.danger, fontWeight: 800 }}>{row.violation_type}</td>
                <td style={{ padding: '12px 10px', color: t.danger, fontWeight: 700 }}>🔴 {row.signal_state}</td>
                <td style={{ padding: '12px 10px', color: t.textSecondary }}>{row.timestamp}</td>
                <td style={{ padding: '12px 10px', color: t.textPrimary }}>{row.location}</td>
                <td style={{ padding: '12px 10px', color: t.danger, fontWeight: 800 }}>₹{row.fine_amount || 1000}</td>
                <td style={{ padding: '12px 10px' }}>
                  <span style={{
                    background: (row.status || '').includes('Approved') ? t.successBg : t.warningBg,
                    color: (row.status || '').includes('Approved') ? t.success : t.warning,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '12px',
                    border: `1px solid ${(row.status || '').includes('Approved') ? t.successBorder : t.warningBorder}`
                  }}>
                    {row.status}
                  </span>
                </td>
                <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedViolation(row);
                      setInspectModalChallan(row);
                      if (setShowChallanModal) setShowChallanModal(true);
                    }}
                    style={{
                      background: t.primary,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 14px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Eye size={13} />
                    <span>Inspect</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* INSPECTION MODAL */}
      {inspectModalChallan && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '12px', width: '100%', maxWidth: '680px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: t.danger }}>VIOLATION EVIDENCE AUDIT</h3>
                <span style={{ fontSize: '0.75rem', color: t.textSecondary }}>Challan #{inspectModalChallan.challan_id} • {inspectModalChallan.vehicle_number}</span>
              </div>
              <button onClick={() => setInspectModalChallan(null)} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', color: t.textMuted, display: 'block' }}>Before Crossing</span>
                  <img src={inspectModalChallan.before_evidence_url || inspectModalChallan.evidence_image_url || '/media/evidence/demo_evidence.jpg'} alt="Before" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', border: `1px solid ${t.border}` }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: t.danger, fontWeight: 700, display: 'block' }}>At Violation Moment</span>
                  <img src={inspectModalChallan.during_evidence_url || inspectModalChallan.evidence_image_url || '/media/evidence/demo_evidence.jpg'} alt="During" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', border: `2px solid ${t.danger}` }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: t.textMuted, display: 'block' }}>After Crossing</span>
                  <img src={inspectModalChallan.after_evidence_url || inspectModalChallan.evidence_image_url || '/media/evidence/demo_evidence.jpg'} alt="After" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', border: `1px solid ${t.border}` }} />
                </div>
              </div>
              <div style={{ background: t.bgElevated, padding: '12px 16px', borderRadius: '8px', border: `1px solid ${t.border}` }}>
                <span style={{ fontSize: '0.7rem', color: t.textMuted, fontWeight: 700, display: 'block' }}>DETECTION SUMMARY</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: t.textPrimary, lineHeight: 1.4 }}>
                  {inspectModalChallan.detection_summary || `Vehicle ${inspectModalChallan.vehicle_number} detected breaching signal threshold during RED state.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViolationManagement;
