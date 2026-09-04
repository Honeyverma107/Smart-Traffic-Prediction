import React, { useState } from 'react';
import { Database, Search, Filter, ShieldAlert, FileText, Eye, AlertTriangle, X } from 'lucide-react';

const VehicleDatabase = ({ t, vehicleDatabase, setSelectedVehicleHistory }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [historyModalVehicle, setHistoryModalVehicle] = useState(null);

  const filteredVehicles = (vehicleDatabase || []).filter(v => {
    const matchesSearch = !searchQuery || 
      (v.vehicle_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.vehicle_type || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'ALL' || 
      (v.vehicle_type || '').toUpperCase() === typeFilter.toUpperCase();

    const matchesStatus = statusFilter === 'ALL' || 
      (v.status || '').toUpperCase().includes(statusFilter.toUpperCase());

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalRegistered = vehicleDatabase ? vehicleDatabase.length : 0;
  const totalViolations = (vehicleDatabase || []).reduce((acc, curr) => acc + (curr.total_violations || 0), 0);
  const totalFines = (vehicleDatabase || []).reduce((acc, curr) => acc + (curr.total_fine || 0), 0);
  const flaggedRepeaters = (vehicleDatabase || []).filter(v => (v.total_violations || 0) > 1).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* HEADER TITLE */}
      <div style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: t.textPrimary, letterSpacing: '0.3px' }}>
            VEHICLE INTELLIGENCE & REGISTRY
          </h2>
          <span style={{ fontSize: '0.78rem', color: t.textSecondary }}>
            Central Vehicle Database, ANPR History, Infraction Tracking & Licensing Status
          </span>
        </div>
      </div>

      {/* KPI METRICS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '16px', boxShadow: t.shadow, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: t.primaryBg, border: `1px solid ${t.primaryBorder}`, padding: '10px', borderRadius: '8px', color: t.primary }}>
            <Database size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: t.textMuted, fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Tracked Vehicles</span>
            <strong style={{ fontSize: '1.35rem', color: t.textPrimary, fontWeight: 800 }}>{totalRegistered}</strong>
          </div>
        </div>

        <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '16px', boxShadow: t.shadow, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: t.dangerBg, border: `1px solid ${t.dangerBorder}`, padding: '10px', borderRadius: '8px', color: t.danger }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: t.textMuted, fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Total Infractions</span>
            <strong style={{ fontSize: '1.35rem', color: t.danger, fontWeight: 800 }}>{totalViolations}</strong>
          </div>
        </div>

        <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '16px', boxShadow: t.shadow, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: t.warningBg, border: `1px solid ${t.warningBorder}`, padding: '10px', borderRadius: '8px', color: t.warning }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: t.textMuted, fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Repeat Offenders</span>
            <strong style={{ fontSize: '1.35rem', color: t.warning, fontWeight: 800 }}>{flaggedRepeaters}</strong>
          </div>
        </div>

        <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '16px', boxShadow: t.shadow, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: t.primaryBg, border: `1px solid ${t.primaryBorder}`, padding: '10px', borderRadius: '8px', color: t.primary }}>
            <FileText size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: t.textMuted, fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Total Fine Assessed</span>
            <strong style={{ fontSize: '1.35rem', color: t.primary, fontWeight: 800 }}>₹{totalFines.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', boxShadow: t.shadow }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '420px', background: t.bgElevated, border: `1px solid ${t.border}`, borderRadius: '6px', padding: '6px 12px' }}>
          <Search size={16} color={t.textMuted} />
          <input
            type="text"
            placeholder="Search by vehicle registration plate (e.g. MP-09-AB-1234)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: 'none', border: 'none', color: t.textPrimary, outline: 'none', fontSize: '0.82rem', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: t.textSecondary }}>
            <Filter size={14} />
            <span>Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ background: t.bgElevated, color: t.textPrimary, border: `1px solid ${t.border}`, borderRadius: '6px', padding: '5px 10px', fontSize: '0.78rem', outline: 'none' }}
            >
              <option value="ALL">All Types</option>
              <option value="CAR">Car</option>
              <option value="MOTORCYCLE">Motorcycle</option>
              <option value="SUV">SUV</option>
              <option value="TRUCK">Commercial / Truck</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: t.textSecondary }}>
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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

      {/* VEHICLE REGISTRY TABLE */}
      <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '16px 20px', boxShadow: t.shadow, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: 'left', color: t.textMuted }}>
              <th style={{ padding: '12px 10px', fontWeight: 700 }}>Vehicle Number</th>
              <th style={{ padding: '12px 10px', fontWeight: 700 }}>Vehicle Type</th>
              <th style={{ padding: '12px 10px', fontWeight: 700 }}>Total Infractions</th>
              <th style={{ padding: '12px 10px', fontWeight: 700 }}>Challans Generated</th>
              <th style={{ padding: '12px 10px', fontWeight: 700 }}>Total Fines</th>
              <th style={{ padding: '12px 10px', fontWeight: 700 }}>Last Detected</th>
              <th style={{ padding: '12px 10px', fontWeight: 700 }}>License Status</th>
              <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 700 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.map((v) => (
              <tr key={v.vehicle_number} style={{ borderBottom: `1px solid ${t.border}` }}>
                <td style={{ padding: '12px 10px', fontWeight: 800, color: t.primary }}>{v.vehicle_number}</td>
                <td style={{ padding: '12px 10px', color: t.textPrimary }}>{v.vehicle_type}</td>
                <td style={{ padding: '12px 10px', color: v.total_violations > 1 ? t.danger : t.warning, fontWeight: 800 }}>{v.total_violations}</td>
                <td style={{ padding: '12px 10px', color: t.textPrimary }}>{v.total_challans}</td>
                <td style={{ padding: '12px 10px', color: t.danger, fontWeight: 800 }}>₹{v.total_fine.toLocaleString()}</td>
                <td style={{ padding: '12px 10px', color: t.textSecondary }}>{v.last_violation}</td>
                <td style={{ padding: '12px 10px' }}>
                  <span style={{
                    background: v.total_violations > 2 ? t.dangerBg : t.warningBg,
                    color: v.total_violations > 2 ? t.danger : t.warning,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '12px',
                    border: `1px solid ${v.total_violations > 2 ? t.dangerBorder : t.warningBorder}`
                  }}>
                    {v.total_violations > 2 ? '● FLAG REPEAT' : '● ACTIVE'}
                  </span>
                </td>
                <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryModalVehicle(v);
                      if (setSelectedVehicleHistory) setSelectedVehicleHistory(v);
                    }}
                    style={{
                      background: t.primaryBg,
                      color: t.primary,
                      border: `1px solid ${t.primaryBorder}`,
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
                    <span>History</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VEHICLE HISTORY MODAL */}
      {historyModalVehicle && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '12px', width: '100%', maxWidth: '600px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: t.primary }}>VEHICLE INFRACTION HISTORY</h3>
                <span style={{ fontSize: '0.75rem', color: t.textSecondary }}>{historyModalVehicle.vehicle_number} • {historyModalVehicle.vehicle_type}</span>
              </div>
              <button onClick={() => setHistoryModalVehicle(null)} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: t.bgElevated, padding: '12px', borderRadius: '8px', border: `1px solid ${t.border}` }}>
                <div><span style={{ fontSize: '0.65rem', color: t.textMuted, display: 'block' }}>Total Violations</span><strong style={{ fontSize: '1.1rem', color: t.danger }}>{historyModalVehicle.total_violations}</strong></div>
                <div><span style={{ fontSize: '0.65rem', color: t.textMuted, display: 'block' }}>Accumulated Fine</span><strong style={{ fontSize: '1.1rem', color: t.danger }}>₹{historyModalVehicle.total_fine}</strong></div>
                <div><span style={{ fontSize: '0.65rem', color: t.textMuted, display: 'block' }}>Registry Status</span><strong style={{ fontSize: '0.85rem', color: t.success }}>VERIFIED</strong></div>
              </div>
              <h4 style={{ margin: '10px 0 4px 0', fontSize: '0.85rem', fontWeight: 800, color: t.textPrimary }}>Violation Timeline & Logs</h4>
              {historyModalVehicle.records && historyModalVehicle.records.map((rec, idx) => (
                <div key={idx} style={{ background: t.bgElevated, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: t.textPrimary, display: 'block' }}>{rec.violation_type} ({rec.challan_id})</span>
                    <span style={{ fontSize: '0.72rem', color: t.textSecondary }}>{rec.location} • {rec.timestamp}</span>
                  </div>
                  <span style={{ fontWeight: 800, color: t.danger, fontSize: '0.88rem' }}>₹{rec.fine_amount || 1000}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleDatabase;
