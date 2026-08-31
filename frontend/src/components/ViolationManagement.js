import React from 'react';
import { Search, Filter } from 'lucide-react';

const ViolationManagement = ({ t, searchQuery, setSearchQuery, filterViolationType, setFilterViolationType, filterStatus, setFilterStatus, filteredChallans, setSelectedViolation, setShowChallanModal }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <div style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: '10px' }}>
      <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: t.textPrimary }}>
        VIOLATION MANAGEMENT
      </h2>
      <span style={{ fontSize: '0.78rem', color: t.textSecondary }}>Search, Filter, and Inspect All Recorded Traffic Violations</span>
    </div>

    {/* Search & Filter Toolbar */}
    <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', boxShadow: t.shadow }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWith: '400px', background: t.bgElevated, border: `1px solid ${t.border}`, borderRadius: '6px', padding: '6px 12px' }}>
        <Search size={16} color={t.textMuted} />
        <input
          type="text"
          placeholder="Search by Vehicle Number, Challan ID, Location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ background: 'none', border: 'none', color: t.textPrimary, outline: 'none', fontSize: '0.82rem', width: '100%' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: t.textSecondary }}>
          <Filter size={14} />
          <span>Violation:</span>
          <select
            value={filterViolationType}
            onChange={(e) => setFilterViolationType(e.target.value)}
            style={{ background: t.bgElevated, color: t.textPrimary, border: `1px solid ${t.border}`, borderRadius: '4px', padding: '4px 8px', fontSize: '0.78rem', outline: 'none' }}
          >
            <option value="ALL">All Types</option>
            <option value="RED LIGHT">Red Light Violation</option>
            <option value="SPEEDING">Speeding</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: t.textSecondary }}>
          <span>Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ background: t.bgElevated, color: t.textPrimary, border: `1px solid ${t.border}`, borderRadius: '4px', padding: '4px 8px', fontSize: '0.78rem', outline: 'none' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="CONFIRMED">Confirmed</option>
          </select>
        </div>
      </div>
    </div>

    {/* Violations Data Table */}
    <div style={{ background: t.bgSurface, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '16px 20px', boxShadow: t.shadow }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: 'left', color: t.textMuted }}>
            <th style={{ padding: '10px', fontWeight: 600 }}>Violation ID</th>
            <th style={{ padding: '10px', fontWeight: 600 }}>Vehicle Number</th>
            <th style={{ padding: '10px', fontWeight: 600 }}>Vehicle Type</th>
            <th style={{ padding: '10px', fontWeight: 600 }}>Violation Type</th>
            <th style={{ padding: '10px', fontWeight: 600 }}>Signal State</th>
            <th style={{ padding: '10px', fontWeight: 600 }}>Date & Time</th>
            <th style={{ padding: '10px', fontWeight: 600 }}>Location</th>
            <th style={{ padding: '10px', fontWeight: 600 }}>Status</th>
            <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredChallans.map((row) => (
            <tr key={row.id || row.challan_id} style={{ borderBottom: `1px solid ${t.border}` }}>
              <td style={{ padding: '10px', fontWeight: 700, color: t.primary }}>{row.challan_id}</td>
              <td style={{ padding: '10px', color: t.textPrimary, fontWeight: 700 }}>{row.vehicle_number}</td>
              <td style={{ padding: '10px', color: t.textPrimary }}>{row.vehicle_type}</td>
              <td style={{ padding: '10px', color: t.danger, fontWeight: 700 }}>{row.violation_type}</td>
              <td style={{ padding: '10px', color: t.danger }}>🔴 {row.signal_state}</td>
              <td style={{ padding: '10px', color: t.textSecondary }}>{row.timestamp}</td>
              <td style={{ padding: '10px', color: t.textPrimary }}>{row.location}</td>
              <td style={{ padding: '10px' }}><span style={{ background: t.warningBg, color: t.warning, fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${t.warningBorder}` }}>{row.status}</span></td>
              <td style={{ padding: '10px', textAlign: 'right' }}>
                <button type="button" onClick={() => { setSelectedViolation(row); setShowChallanModal(true); }} style={{ background: t.primary, color: '#ffffff', border: 'none', borderRadius: '4px', padding: '5px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Inspect</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default ViolationManagement;
