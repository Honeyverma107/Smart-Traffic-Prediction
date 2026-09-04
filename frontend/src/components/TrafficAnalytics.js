import React from 'react';
import { 
  BarChart3, 
  Download, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  IndianRupee, 
  ShieldCheck, 
  Trophy, 
  MapPin, 
  Percent 
} from 'lucide-react';

const TrafficAnalytics = ({ t, challans = [], navigateToTab, timePeriodFilter, setTimePeriodFilter }) => {
  const [selectedPeriod, setSelectedPeriod] = React.useState(timePeriodFilter || 'This Month');
  const [hoveredSlice, setHoveredSlice] = React.useState(null);
  const [hoveredTrendPoint, setHoveredTrendPoint] = React.useState(null);

  // Sync state if prop changes
  React.useEffect(() => {
    if (timePeriodFilter) setSelectedPeriod(timePeriodFilter);
  }, [timePeriodFilter]);

  const handlePeriodChange = (newPeriod) => {
    setSelectedPeriod(newPeriod);
    if (setTimePeriodFilter) setTimePeriodFilter(newPeriod);
  };

  // Theme design tokens matching exact reference spec
  const theme = {
    bgApp: '#F8FBFF',
    bgCard: '#FFFFFF',
    border: '#E5EDF7',
    primary: '#0878F9',
    primaryLight: 'rgba(8, 120, 249, 0.08)',
    textDark: '#0B1630',
    textMuted: '#536789',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    purple: '#8B5CF6',
    cardRadius: '14px',
    shadow: '0 2px 8px rgba(8, 120, 249, 0.04), 0 1px 3px rgba(0, 0, 0, 0.04)'
  };

  // DYNAMIC DATASET MATRIX DRIVEN BY TIME-PERIOD FILTER
  const periodDatasets = React.useMemo(() => ({
    'Today': {
      totalChallans: '95',
      paidChallans: '64',
      pendingPayment: '22',
      failedCancelled: '9',
      totalAmount: '₹ 28,500',
      detectionAccuracy: '98.9%',
      avgDaily: '95',
      completionRate: '67.4%',
      anprSuccess: '94.1%',
      avgProcessing: '1.5s',
      uptime: '99.8%',
      trends: { total: '↑ 5%', paid: '↑ 8%', pending: '↓ 2%', failed: '↓ 1%', amount: '↑ 7%', accuracy: '↑ 0.5%' },
      donutData: [
        { name: 'Red Light Violation', percent: 35, count: 33, color: '#EF4444' },
        { name: 'Speeding', percent: 22, count: 21, color: '#0B78F6' },
        { name: 'No Helmet', percent: 20, count: 19, color: '#F59E0B' },
        { name: 'Wrong Parking', percent: 12, count: 11, color: '#10B981' },
        { name: 'Seat Belt Violation', percent: 7, count: 7, color: '#8B5CF6' },
        { name: 'Other Violations', percent: 4, count: 4, color: '#64748B' }
      ],
      topLocations: [
        { name: 'Vijay Nagar Junction', count: 38, percent: 100, color: '#EF4444' },
        { name: 'MG Road', count: 24, percent: 63, color: '#0B78F6' },
        { name: 'Rajwada Square', count: 18, percent: 47, color: '#F59E0B' },
        { name: 'Palasia Square', count: 10, percent: 26, color: '#10B981' },
        { name: 'Bypass Road', count: 5, percent: 13, color: '#8B5CF6' }
      ],
      chartLabels: ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM'],
      totalLine: [12, 28, 45, 68, 82, 95],
      paidLine: [8, 18, 30, 44, 55, 64]
    },
    'This Week': {
      totalChallans: '680',
      paidChallans: '476',
      pendingPayment: '142',
      failedCancelled: '62',
      totalAmount: '₹ 2,04,000',
      detectionAccuracy: '98.6%',
      avgDaily: '97',
      completionRate: '70.0%',
      anprSuccess: '93.2%',
      avgProcessing: '1.7s',
      uptime: '99.5%',
      trends: { total: '↑ 14%', paid: '↑ 16%', pending: '↓ 4%', failed: '↓ 3%', amount: '↑ 12%', accuracy: '↑ 1.2%' },
      donutData: [
        { name: 'Red Light Violation', percent: 33, count: 224, color: '#EF4444' },
        { name: 'Speeding', percent: 25, count: 170, color: '#0B78F6' },
        { name: 'No Helmet', percent: 17, count: 116, color: '#F59E0B' },
        { name: 'Wrong Parking', percent: 15, count: 102, color: '#10B981' },
        { name: 'Seat Belt Violation', percent: 6, count: 41, color: '#8B5CF6' },
        { name: 'Other Violations', percent: 4, count: 27, color: '#64748B' }
      ],
      topLocations: [
        { name: 'Vijay Nagar Junction', count: 210, percent: 100, color: '#EF4444' },
        { name: 'MG Road', count: 152, percent: 72, color: '#0B78F6' },
        { name: 'Rajwada Square', count: 138, percent: 65, color: '#F59E0B' },
        { name: 'Palasia Square', count: 98, percent: 46, color: '#10B981' },
        { name: 'Bypass Road', count: 82, percent: 39, color: '#8B5CF6' }
      ],
      chartLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      totalLine: [85, 92, 104, 110, 98, 115, 76],
      paidLine: [60, 68, 72, 78, 65, 82, 51]
    },
    'This Month': {
      totalChallans: challans.length > 0 ? challans.length.toLocaleString() : '2,842',
      paidChallans: '1,986',
      pendingPayment: '542',
      failedCancelled: '314',
      totalAmount: '₹ 8,52,600',
      detectionAccuracy: '98.4%',
      avgDaily: '95',
      completionRate: '69.9%',
      anprSuccess: '92.6%',
      avgProcessing: '1.8s',
      uptime: '99.2%',
      trends: { total: '↑ 12%', paid: '↑ 18%', pending: '↓ 6%', failed: '↓ 4%', amount: '↑ 15%', accuracy: '↑ 2%' },
      donutData: [
        { name: 'Red Light Violation', percent: 32, count: 910, color: '#EF4444' },
        { name: 'Speeding', percent: 24, count: 682, color: '#0B78F6' },
        { name: 'No Helmet', percent: 18, count: 511, color: '#F59E0B' },
        { name: 'Wrong Parking', percent: 14, count: 398, color: '#10B981' },
        { name: 'Seat Belt Violation', percent: 8, count: 227, color: '#8B5CF6' },
        { name: 'Other Violations', percent: 4, count: 114, color: '#64748B' }
      ],
      topLocations: [
        { name: 'Vijay Nagar Junction', count: 420, percent: 100, color: '#EF4444' },
        { name: 'MG Road', count: 312, percent: 74, color: '#0B78F6' },
        { name: 'Rajwada Square', count: 284, percent: 67, color: '#F59E0B' },
        { name: 'Palasia Square', count: 198, percent: 47, color: '#10B981' },
        { name: 'Bypass Road', count: 164, percent: 39, color: '#8B5CF6' }
      ],
      chartLabels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      totalLine: [650, 720, 780, 692],
      paidLine: [460, 510, 540, 476]
    },
    'This Year': {
      totalChallans: '32,450',
      paidChallans: '24,100',
      pendingPayment: '5,900',
      failedCancelled: '2,450',
      totalAmount: '₹ 97,35,000',
      detectionAccuracy: '97.9%',
      avgDaily: '89',
      completionRate: '74.3%',
      anprSuccess: '91.8%',
      avgProcessing: '2.1s',
      uptime: '99.0%',
      trends: { total: '↑ 22%', paid: '↑ 25%', pending: '↓ 10%', failed: '↓ 8%', amount: '↑ 24%', accuracy: '↑ 3.5%' },
      donutData: [
        { name: 'Red Light Violation', percent: 30, count: 9735, color: '#EF4444' },
        { name: 'Speeding', percent: 26, count: 8437, color: '#0B78F6' },
        { name: 'No Helmet', percent: 19, count: 6165, color: '#F59E0B' },
        { name: 'Wrong Parking', percent: 13, count: 4218, color: '#10B981' },
        { name: 'Seat Belt Violation', percent: 8, count: 2596, color: '#8B5CF6' },
        { name: 'Other Violations', percent: 4, count: 1299, color: '#64748B' }
      ],
      topLocations: [
        { name: 'Vijay Nagar Junction', count: 4850, percent: 100, color: '#EF4444' },
        { name: 'MG Road', count: 3620, percent: 75, color: '#0B78F6' },
        { name: 'Rajwada Square', count: 3240, percent: 67, color: '#F59E0B' },
        { name: 'Palasia Square', count: 2410, percent: 50, color: '#10B981' },
        { name: 'Bypass Road', count: 1950, percent: 40, color: '#8B5CF6' }
      ],
      chartLabels: ['Q1', 'Q2', 'Q3', 'Q4'],
      totalLine: [7400, 8200, 8900, 7950],
      paidLine: [5500, 6100, 6600, 5900]
    },
    'Custom': {
      totalChallans: '1,420',
      paidChallans: '980',
      pendingPayment: '310',
      failedCancelled: '130',
      totalAmount: '₹ 4,26,000',
      detectionAccuracy: '98.5%',
      avgDaily: '94',
      completionRate: '69.0%',
      anprSuccess: '93.0%',
      avgProcessing: '1.6s',
      uptime: '99.4%',
      trends: { total: '↑ 10%', paid: '↑ 12%', pending: '↓ 5%', failed: '↓ 2%', amount: '↑ 11%', accuracy: '↑ 1.0%' },
      donutData: [
        { name: 'Red Light Violation', percent: 34, count: 482, color: '#EF4444' },
        { name: 'Speeding', percent: 23, count: 326, color: '#0B78F6' },
        { name: 'No Helmet', percent: 19, count: 270, color: '#F59E0B' },
        { name: 'Wrong Parking', percent: 13, count: 184, color: '#10B981' },
        { name: 'Seat Belt Violation', percent: 7, count: 99, color: '#8B5CF6' },
        { name: 'Other Violations', percent: 4, count: 59, color: '#64748B' }
      ],
      topLocations: [
        { name: 'Vijay Nagar Junction', count: 215, percent: 100, color: '#EF4444' },
        { name: 'MG Road', count: 158, percent: 73, color: '#0B78F6' },
        { name: 'Rajwada Square', count: 142, percent: 66, color: '#F59E0B' },
        { name: 'Palasia Square', count: 98, percent: 45, color: '#10B981' },
        { name: 'Bypass Road', count: 83, percent: 38, color: '#8B5CF6' }
      ],
      chartLabels: ['Range 1', 'Range 2', 'Range 3', 'Range 4'],
      totalLine: [320, 380, 410, 310],
      paidLine: [220, 260, 290, 210]
    }
  }), [challans]);

  const activeData = periodDatasets[selectedPeriod] || periodDatasets['This Month'];

  // 6 KPI Cards Configuration
  const kpiCards = [
    {
      title: 'Total Challans',
      value: activeData.totalChallans,
      trend: activeData.trends.total,
      trendUp: true,
      color: theme.primary,
      bgColor: 'rgba(8, 120, 249, 0.08)',
      icon: FileText,
      sparkPoints: '0,20 15,18 30,22 45,12 60,15 75,5 90,8'
    },
    {
      title: 'Paid Challans',
      value: activeData.paidChallans,
      trend: activeData.trends.paid,
      trendUp: true,
      color: theme.success,
      bgColor: 'rgba(16, 185, 129, 0.08)',
      icon: CheckCircle2,
      sparkPoints: '0,22 15,20 30,15 45,18 60,10 75,8 90,4'
    },
    {
      title: 'Pending Payment',
      value: activeData.pendingPayment,
      trend: activeData.trends.pending,
      trendUp: false,
      color: theme.warning,
      bgColor: 'rgba(245, 158, 11, 0.08)',
      icon: Clock,
      sparkPoints: '0,8 15,12 30,10 45,18 60,15 75,22 90,20'
    },
    {
      title: 'Failed / Cancelled',
      value: activeData.failedCancelled,
      trend: activeData.trends.failed,
      trendUp: false,
      color: theme.danger,
      bgColor: 'rgba(239, 68, 68, 0.08)',
      icon: XCircle,
      sparkPoints: '0,10 15,8 30,16 45,14 60,20 75,18 90,24'
    },
    {
      title: 'Total Amount',
      value: activeData.totalAmount,
      trend: activeData.trends.amount,
      trendUp: true,
      color: theme.purple,
      bgColor: 'rgba(139, 92, 246, 0.08)',
      icon: IndianRupee,
      sparkPoints: '0,24 15,20 30,16 45,12 60,14 75,6 90,4'
    },
    {
      title: 'Detection Accuracy',
      value: activeData.detectionAccuracy,
      trend: activeData.trends.accuracy,
      trendUp: true,
      color: theme.primary,
      bgColor: 'rgba(8, 120, 249, 0.08)',
      icon: ShieldCheck,
      sparkPoints: '0,15 15,14 30,12 45,10 60,8 75,6 90,4'
    }
  ];

  const donutData = activeData.donutData;
  const topLocations = activeData.topLocations;

  // DYNAMIC MATH FOR TREND LINE CHART
  const trendLabels = activeData.chartLabels || ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  const totalLineValues = activeData.totalLine || [650, 720, 780, 692];
  const paidLineValues = activeData.paidLine || [460, 510, 540, 476];

  const maxVal = Math.max(...totalLineValues, 10) * 1.18;
  const numPoints = trendLabels.length;

  const chartPoints = trendLabels.map((label, idx) => {
    const x = numPoints > 1 ? 50 + idx * (420 / (numPoints - 1)) : 260;
    const yTotal = 160 - (totalLineValues[idx] / maxVal) * 140;
    const yPaid = 160 - (paidLineValues[idx] / maxVal) * 140;
    return { label, x, yTotal, yPaid, total: totalLineValues[idx], paid: paidLineValues[idx] };
  });

  const totalPathD = chartPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.yTotal}`, '');
  const totalAreaD = `${totalPathD} L ${chartPoints[numPoints - 1].x} 160 L ${chartPoints[0].x} 160 Z`;

  const paidPathD = chartPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.yPaid}`, '');
  const paidAreaD = `${paidPathD} L ${chartPoints[numPoints - 1].x} 160 L ${chartPoints[0].x} 160 Z`;

  const activePointIndex = hoveredTrendPoint !== null && hoveredTrendPoint < numPoints ? hoveredTrendPoint : numPoints - 1;
  const activePoint = chartPoints[activePointIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: theme.bgApp, padding: '4px', borderRadius: '8px' }}>
      
      {/* 1. PAGE TITLE SECTION & EXPORT ACTION */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'rgba(8, 120, 249, 0.1)',
            padding: '10px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BarChart3 size={24} color={theme.primary} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: theme.textDark, letterSpacing: '-0.01em' }}>
              Analytics & Insights
            </h2>
            <span style={{ fontSize: '0.85rem', color: theme.textMuted, fontWeight: 500 }}>
              Data-driven insights for better traffic enforcement
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Time-Period Filter Dropdown */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: theme.bgCard,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.84rem',
            fontWeight: 600,
            color: theme.textDark,
            boxShadow: theme.shadow
          }}>
            <span style={{ color: theme.textMuted, fontSize: '0.78rem' }}>Filter Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontWeight: 700, color: theme.primary, outline: 'none', cursor: 'pointer' }}
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
            </select>
          </div>

          {/* Export Report Button */}
          <button
            type="button"
            onClick={() => alert(`Exporting ${selectedPeriod} Analytics Report (CSV/PDF)...`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: theme.bgCard,
              border: `1px solid ${theme.primary}`,
              color: theme.primary,
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: theme.shadow,
              transition: 'all 0.15s ease'
            }}
          >
            <Download size={16} color={theme.primary} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 4. SIX KPI CARDS IN ONE ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
        {kpiCards.map((card, idx) => {
          const IconComp = card.icon;
          return (
            <div
              key={idx}
              style={{
                background: theme.bgCard,
                border: `1px solid ${theme.border}`,
                borderRadius: theme.cardRadius,
                padding: '16px',
                boxShadow: theme.shadow,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '118px',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  background: card.bgColor,
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconComp size={17} color={card.color} />
                </div>

                {/* Sparkline SVG */}
                <svg width="85" height="28" viewBox="0 0 90 28" fill="none">
                  <polyline
                    fill="none"
                    stroke={card.color}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={card.sparkPoints}
                  />
                </svg>
              </div>

              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: theme.textDark, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {card.value}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.74rem', color: theme.textMuted, fontWeight: 600 }}>{card.title}</span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: card.trendUp ? theme.success : theme.danger,
                    background: card.trendUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {card.trend}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. MAIN CHARTS ROW (2 COLUMNS) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        
        {/* LEFT CHART: VIOLATION TYPE DISTRIBUTION */}
        <div style={{
          background: theme.bgCard,
          border: `1px solid ${theme.border}`,
          borderRadius: theme.cardRadius,
          padding: '20px',
          boxShadow: theme.shadow,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: theme.textDark }}>
                Violation Type Distribution
              </h3>
              <span style={{ fontSize: '0.78rem', color: theme.textMuted }}>
                Share of different traffic violations detected by AI
              </span>
            </div>
            <select
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              style={{
                background: '#F8FAFC',
                border: `1px solid ${theme.border}`,
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: theme.textDark,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flex: 1 }}>
            {/* SVG Donut Chart with Dynamic Slices and Tooltips */}
            <div style={{ position: 'relative', width: '210px', height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg viewBox="0 0 42 42" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                {(() => {
                  let accumulatedOffset = 25;
                  return donutData.map((item, idx) => {
                    const strokeDasharray = `${item.percent} ${100 - item.percent}`;
                    const strokeDashoffset = accumulatedOffset;
                    accumulatedOffset = (accumulatedOffset - item.percent + 100) % 100;
                    return (
                      <circle
                        key={idx}
                        cx="21"
                        cy="21"
                        r="15.915494309189533"
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth={hoveredSlice === idx ? '7.5' : '6'}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'all 0.25s ease', cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredSlice(idx)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      >
                        <title>{`${item.name}: ${item.count} (${item.percent}%)`}</title>
                      </circle>
                    );
                  });
                })()}
              </svg>
              
              <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: theme.textDark, lineHeight: 1 }}>
                  {hoveredSlice !== null ? donutData[hoveredSlice].count : activeData.totalChallans}
                </div>
                <div style={{ fontSize: '0.7rem', color: theme.textMuted, fontWeight: 700, marginTop: '2px' }}>
                  {hoveredSlice !== null ? donutData[hoveredSlice].name : 'Total Challans'}
                </div>
              </div>
            </div>

            {/* Donut Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              {donutData.map((item, i) => (
                <div 
                  key={i} 
                  onMouseEnter={() => setHoveredSlice(i)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    fontSize: '0.8rem',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    background: hoveredSlice === i ? 'rgba(8, 120, 249, 0.05)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: item.color }}></span>
                    <span style={{ color: theme.textDark, fontWeight: hoveredSlice === i ? 700 : 600 }}>{item.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: theme.textDark, minWidth: '32px', textAlign: 'right' }}>{item.percent}%</span>
                    <span style={{
                      background: hoveredSlice === i ? item.color : '#F1F5F9',
                      color: hoveredSlice === i ? '#FFFFFF' : theme.textMuted,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      minWidth: '32px',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}>
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT CHART: DYNAMIC CHALLAN TREND LINE CHART */}
        <div style={{
          background: theme.bgCard,
          border: `1px solid ${theme.border}`,
          borderRadius: theme.cardRadius,
          padding: '20px',
          boxShadow: theme.shadow,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: theme.textDark }}>
                Challan Trend ({selectedPeriod})
              </h3>
              <span style={{ fontSize: '0.78rem', color: theme.textMuted }}>
                Challan generation & settlement trends over time
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0B78F6' }}></span>
                  <span style={{ color: theme.textDark }}>Total</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></span>
                  <span style={{ color: theme.textDark }}>Paid</span>
                </div>
              </div>

              <select
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                style={{
                  background: '#F8FAFC',
                  border: `1px solid ${theme.border}`,
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: theme.textDark,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="This Year">This Year</option>
              </select>
            </div>
          </div>

          {/* SVG Line & Area Chart Container */}
          <div style={{ position: 'relative', flex: 1, minHeight: '210px' }}>
            <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0B78F6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0B78F6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines */}
              <line x1="35" y1="20" x2="495" y2="20" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="35" y1="55" x2="495" y2="55" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="35" y1="90" x2="495" y2="90" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="35" y1="125" x2="495" y2="125" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="35" y1="160" x2="495" y2="160" stroke="#E2E8F0" strokeWidth="1" />

              {/* Dynamic Y Axis Scale Labels */}
              <text x="28" y="24" fontSize="10" fill="#94A3B8" textAnchor="end">{Math.round(maxVal)}</text>
              <text x="28" y="59" fontSize="10" fill="#94A3B8" textAnchor="end">{Math.round(maxVal * 0.75)}</text>
              <text x="28" y="94" fontSize="10" fill="#94A3B8" textAnchor="end">{Math.round(maxVal * 0.5)}</text>
              <text x="28" y="129" fontSize="10" fill="#94A3B8" textAnchor="end">{Math.round(maxVal * 0.25)}</text>
              <text x="28" y="164" fontSize="10" fill="#94A3B8" textAnchor="end">0</text>

              {/* Dynamic X Axis Labels */}
              {chartPoints.map((pt, idx) => (
                <text key={idx} x={pt.x} y="182" fontSize="10" fill="#94A3B8" textAnchor="middle" fontWeight={hoveredTrendPoint === idx ? '800' : '500'}>
                  {pt.label}
                </text>
              ))}

              {/* Total Area Fill */}
              <path d={totalAreaD} fill="url(#blueGrad)" />
              {/* Total Line */}
              <path d={totalPathD} fill="none" stroke="#0B78F6" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />

              {/* Paid Area Fill */}
              <path d={paidAreaD} fill="url(#greenGrad)" />
              {/* Paid Line */}
              <path d={paidPathD} fill="none" stroke="#10B981" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />

              {/* Data Point Circles & Hover Targets */}
              {chartPoints.map((pt, idx) => (
                <g key={idx}>
                  <circle cx={pt.x} cy={pt.yTotal} r={hoveredTrendPoint === idx ? '6' : '4.5'} fill="#FFFFFF" stroke="#0B78F6" strokeWidth="2.5" />
                  <circle cx={pt.x} cy={pt.yPaid} r={hoveredTrendPoint === idx ? '6' : '4.5'} fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
                  
                  {/* Invisible full-height hover target column */}
                  <rect
                    x={pt.x - 20}
                    y="10"
                    width="40"
                    height="160"
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredTrendPoint(idx)}
                    onMouseLeave={() => setHoveredTrendPoint(null)}
                  />
                </g>
              ))}
            </svg>

            {/* Dynamic Floating Tooltip Card */}
            {activePoint && (
              <div style={{
                position: 'absolute',
                left: activePoint.x > 340 ? `${activePoint.x - 130}px` : `${activePoint.x + 12}px`,
                top: `${Math.max(10, Math.min(activePoint.yTotal - 10, 90))}px`,
                background: '#FFFFFF',
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                padding: '8px 12px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                pointerEvents: 'none',
                zIndex: 10,
                transition: 'all 0.15s ease'
              }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: theme.textDark, marginBottom: '4px' }}>
                  {activePoint.label} ({selectedPeriod})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.72rem', fontWeight: 700 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0B78F6' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0B78F6' }}></span>
                    <span>Total: {activePoint.total.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></span>
                    <span>Paid: {activePoint.paid.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. BOTTOM THREE COLUMNS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>

        {/* LEFT COLUMN: TOP VIOLATION LOCATIONS */}
        <div style={{
          background: theme.bgCard,
          border: `1px solid ${theme.border}`,
          borderRadius: theme.cardRadius,
          padding: '20px',
          boxShadow: theme.shadow,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: theme.textDark }}>
              Top Violation Locations
            </h3>
            <span style={{ fontSize: '0.78rem', color: theme.textMuted }}>
              Most frequent locations for violations ({selectedPeriod})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {topLocations.map((loc, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: loc.color,
                      color: '#FFFFFF',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontWeight: 600, color: theme.textDark }}>{loc.name}</span>
                  </div>
                  <span style={{ fontWeight: 800, color: theme.textDark }}>{loc.count.toLocaleString()}</span>
                </div>

                {/* Progress Track */}
                <div style={{ width: '100%', height: '7px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${loc.percent}%`, height: '100%', background: loc.color, borderRadius: '4px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MIDDLE COLUMN: VIOLATION SUMMARY */}
        <div style={{
          background: theme.bgCard,
          border: `1px solid ${theme.border}`,
          borderRadius: theme.cardRadius,
          padding: '20px',
          boxShadow: theme.shadow,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: theme.textDark }}>
              Violation Summary
            </h3>
            <span style={{ fontSize: '0.78rem', color: theme.textMuted }}>
              Key insights for {selectedPeriod}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Row 1 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={16} color={theme.warning} />
                <span style={{ fontSize: '0.8rem', color: theme.textMuted, fontWeight: 500 }}>Most Common Violation</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '0.82rem', color: theme.textDark }}>Red Light Violation</strong>
                <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: theme.danger, padding: '2px 7px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>
                  {donutData[0].percent}%
                </span>
              </div>
            </div>

            {/* Row 2 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color={theme.primary} />
                <span style={{ fontSize: '0.8rem', color: theme.textMuted, fontWeight: 500 }}>Highest Violation Location</span>
              </div>
              <strong style={{ fontSize: '0.82rem', color: theme.textDark }}>{topLocations[0].name}</strong>
            </div>

            {/* Row 3 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={16} color={theme.primary} />
                <span style={{ fontSize: '0.8rem', color: theme.textMuted, fontWeight: 500 }}>Avg. Daily Challans</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '0.82rem', color: theme.textDark }}>{activeData.avgDaily}</strong>
                <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: theme.success, padding: '2px 7px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>
                  {activeData.trends.total}
                </span>
              </div>
            </div>

            {/* Row 4 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IndianRupee size={16} color={theme.purple} />
                <span style={{ fontSize: '0.8rem', color: theme.textMuted, fontWeight: 500 }}>Total Fine Amount</span>
              </div>
              <strong style={{ fontSize: '0.85rem', color: theme.primary, fontWeight: 800 }}>{activeData.totalAmount}</strong>
            </div>

            {/* Row 5 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Percent size={16} color={theme.success} />
                <span style={{ fontSize: '0.8rem', color: theme.textMuted, fontWeight: 500 }}>Payment Completion Rate</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '0.82rem', color: theme.textDark }}>{activeData.completionRate}</strong>
                <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: theme.success, padding: '2px 7px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>
                  {activeData.trends.paid}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ENFORCEMENT EFFECTIVENESS */}
        <div style={{
          background: theme.bgCard,
          border: `1px solid ${theme.border}`,
          borderRadius: theme.cardRadius,
          padding: '20px',
          boxShadow: theme.shadow,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: theme.textDark }}>
              Enforcement Effectiveness
            </h3>
            <span style={{ fontSize: '0.78rem', color: theme.textMuted }}>
              AI detection and processing efficiency ({selectedPeriod})
            </span>
          </div>

          {/* 2x2 Grid of Circular Ring Indicators */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1, alignItems: 'center' }}>
            
            {/* Ring 1: Detection Accuracy */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 40 40" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="20" cy="20" r="16" fill="transparent" stroke="#F1F5F9" strokeWidth="4.5" />
                  <circle cx="20" cy="20" r="16" fill="transparent" stroke="#0B78F6" strokeWidth="4.5" strokeDasharray="100.5 100.5" strokeDashoffset="1.6" />
                </svg>
                <div style={{ position: 'absolute', fontSize: '0.78rem', fontWeight: 800, color: theme.textDark }}>{activeData.detectionAccuracy}</div>
              </div>
              <span style={{ fontSize: '0.72rem', color: theme.textMuted, fontWeight: 600, marginTop: '6px', textAlign: 'center' }}>Detection Accuracy</span>
            </div>

            {/* Ring 2: ANPR Success Rate */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 40 40" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="20" cy="20" r="16" fill="transparent" stroke="#F1F5F9" strokeWidth="4.5" />
                  <circle cx="20" cy="20" r="16" fill="transparent" stroke="#10B981" strokeWidth="4.5" strokeDasharray="100.5 100.5" strokeDashoffset="7.4" />
                </svg>
                <div style={{ position: 'absolute', fontSize: '0.78rem', fontWeight: 800, color: theme.textDark }}>{activeData.anprSuccess}</div>
              </div>
              <span style={{ fontSize: '0.72rem', color: theme.textMuted, fontWeight: 600, marginTop: '6px', textAlign: 'center' }}>ANPR Success Rate</span>
            </div>

            {/* Ring 3: Avg Processing Time */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 40 40" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="20" cy="20" r="16" fill="transparent" stroke="#F1F5F9" strokeWidth="4.5" />
                  <circle cx="20" cy="20" r="16" fill="transparent" stroke="#8B5CF6" strokeWidth="4.5" strokeDasharray="100.5 100.5" strokeDashoffset="18" />
                </svg>
                <div style={{ position: 'absolute', fontSize: '0.78rem', fontWeight: 800, color: theme.textDark }}>{activeData.avgProcessing}</div>
              </div>
              <span style={{ fontSize: '0.72rem', color: theme.textMuted, fontWeight: 600, marginTop: '6px', textAlign: 'center' }}>Avg. Processing Time</span>
            </div>

            {/* Ring 4: System Uptime */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 40 40" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="20" cy="20" r="16" fill="transparent" stroke="#F1F5F9" strokeWidth="4.5" />
                  <circle cx="20" cy="20" r="16" fill="transparent" stroke="#F59E0B" strokeWidth="4.5" strokeDasharray="100.5 100.5" strokeDashoffset="0.8" />
                </svg>
                <div style={{ position: 'absolute', fontSize: '0.78rem', fontWeight: 800, color: theme.textDark }}>{activeData.uptime}</div>
              </div>
              <span style={{ fontSize: '0.72rem', color: theme.textMuted, fontWeight: 600, marginTop: '6px', textAlign: 'center' }}>System Uptime</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default TrafficAnalytics;