import React, { useMemo } from 'react';
import { FiUpload, FiArrowRight } from 'react-icons/fi';

export default function ReconciliationOverview({
  rows = [],
  onOpenQueue,
  onReviewRecord,
  onUploadStatement,
}) {
  const pendingRows = useMemo(() => rows.filter((r) => r.status === 'pending'), [rows]);
  const completedRows = useMemo(() => rows.filter((r) => r.status === 'completed'), [rows]);
  const discrepancyRows = useMemo(
    () => rows.filter((r) => r.status === 'discrepancy' || r.status === 'rejected'),
    [rows],
  );

  const pendingCount = pendingRows.length;
  const pendingAmount = pendingRows.reduce((sum, r) => sum + r.amount, 0);

  const olderThan7DaysRows = useMemo(
    () => pendingRows.filter((r) => r.age > 7),
    [pendingRows],
  );
  const olderThan7DaysAmount = olderThan7DaysRows.reduce((sum, r) => sum + r.amount, 0);
  const oldestDays = useMemo(() => {
    if (pendingRows.length === 0) return 0;
    return Math.max(...pendingRows.map((r) => r.age));
  }, [pendingRows]);

  const completedCount = completedRows.length;
  const completedAmount = completedRows.reduce((sum, r) => sum + r.amount, 0);

  const discrepancyCount = discrepancyRows.length;
  const discrepancyAmount = discrepancyRows.reduce((sum, r) => sum + r.amount, 0);

  // Age breakdown calculations
  const ageBuckets = useMemo(() => {
    const b0_2 = pendingRows.filter((r) => r.age <= 2);
    const b3_7 = pendingRows.filter((r) => r.age >= 3 && r.age <= 7);
    const b8_30 = pendingRows.filter((r) => r.age >= 8 && r.age <= 30);
    const b30_plus = pendingRows.filter((r) => r.age > 30);

    const maxCount = Math.max(1, b0_2.length, b3_7.length, b8_30.length, b30_plus.length);

    return [
      {
        label: '0–2 days',
        count: b0_2.length,
        amount: b0_2.reduce((s, r) => s + r.amount, 0),
        barColor: '#94A3B8',
        pct: (b0_2.length / maxCount) * 100,
        isAlert: false,
      },
      {
        label: '3–7 days',
        count: b3_7.length,
        amount: b3_7.reduce((s, r) => s + r.amount, 0),
        barColor: '#F59E0B',
        pct: (b3_7.length / maxCount) * 100,
        isAlert: false,
      },
      {
        label: '8–30 days',
        count: b8_30.length,
        amount: b8_30.reduce((s, r) => s + r.amount, 0),
        barColor: '#EA580C',
        pct: (b8_30.length / maxCount) * 100,
        isAlert: false,
      },
      {
        label: '30+ days',
        count: b30_plus.length,
        amount: b30_plus.reduce((s, r) => s + r.amount, 0),
        barColor: '#991B1B',
        pct: (b30_plus.length / maxCount) * 100,
        isAlert: true,
      },
    ];
  }, [pendingRows]);

  // Method breakdown calculations
  const methodBuckets = useMemo(() => {
    const bank = pendingRows.filter((r) => (r.method || '').toLowerCase().includes('bank'));
    const cash = pendingRows.filter((r) => (r.method || '').toLowerCase().includes('cash'));
    const inKind = pendingRows.filter((r) => (r.method || '').toLowerCase().includes('in-kind') || (r.method || '').toLowerCase().includes('kind'));

    const maxCount = Math.max(1, bank.length, cash.length, inKind.length);

    return [
      {
        label: 'Bank transfer',
        count: bank.length,
        amount: bank.reduce((s, r) => s + r.amount, 0),
        pct: (bank.length / maxCount) * 100,
      },
      {
        label: 'Cash',
        count: cash.length,
        amount: cash.reduce((s, r) => s + r.amount, 0),
        pct: (cash.length / maxCount) * 100,
      },
      {
        label: 'In-kind',
        count: inKind.length,
        amount: inKind.reduce((s, r) => s + r.amount, 0),
        pct: (inKind.length / maxCount) * 100,
      },
    ];
  }, [pendingRows]);

  // Oldest 5 pending items sorted by age DESC
  const oldestPending = useMemo(() => {
    return [...pendingRows].sort((a, b) => b.age - a.age).slice(0, 5);
  }, [pendingRows]);

  const getAgeChipClass = (age) => {
    if (age > 30) return 'ra-chip ra-chip-red';
    if (age > 7) return 'ra-chip ra-chip-orange';
    if (age > 2) return 'ra-chip ra-chip-amber';
    return 'ra-chip ra-chip-gray';
  };

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Page Header */}
      <div className="ra-page-header">
        <div className="ra-title-group">
          <h1>Reconciliation overview</h1>
          <p>{todayStr} · Active figures from current Offline Donations list</p>
        </div>
        <div className="ra-header-actions">
          <button
            type="button"
            className="ra-btn ra-btn-secondary"
            onClick={onUploadStatement}
          >
            <FiUpload /> Upload bank statement
          </button>
          <button
            type="button"
            className="ra-btn ra-btn-primary"
            onClick={onOpenQueue}
          >
            Open queue · {pendingCount} pending <FiArrowRight />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="ra-kpi-grid">
        <div className="ra-kpi-card">
          <span className="ra-kpi-label">Pending verification</span>
          <span className="ra-kpi-value">{pendingCount}</span>
          <span className="ra-kpi-subtext">PKR {pendingAmount.toLocaleString('en-US')}</span>
        </div>

        <div className="ra-kpi-card ra-kpi-card-danger">
          <span className="ra-kpi-label ra-kpi-label-danger">Older than 7 days</span>
          <span className="ra-kpi-value ra-kpi-value-danger">{olderThan7DaysRows.length}</span>
          <span className="ra-kpi-subtext-danger">
            PKR {olderThan7DaysAmount.toLocaleString('en-US')} · oldest {oldestDays} days
          </span>
        </div>

        <div className="ra-kpi-card">
          <span className="ra-kpi-label">Completed</span>
          <span className="ra-kpi-value ra-kpi-value-success">{completedCount}</span>
          <span className="ra-kpi-subtext">PKR {completedAmount.toLocaleString('en-US')}</span>
        </div>

        <div className="ra-kpi-card">
          <span className="ra-kpi-label">Rejected / discrepancy</span>
          <span className="ra-kpi-value">{discrepancyCount}</span>
          <span className="ra-kpi-subtext">PKR {discrepancyAmount.toLocaleString('en-US')}</span>
        </div>
      </div>

      {/* Middle Analytics Cards */}
      <div className="ra-analytics-grid">
        {/* Pending by Age */}
        <section className="ra-card">
          <h2 className="ra-card-title">Pending by age</h2>
          <div className="ra-bar-table">
            {ageBuckets.map((bucket) => (
              <React.Fragment key={bucket.label}>
                <span
                  style={{
                    color: bucket.isAlert ? '#991B1B' : '#334155',
                    fontWeight: bucket.isAlert ? 700 : 500,
                  }}
                >
                  {bucket.label}
                </span>
                <div className="ra-progress-track">
                  <div
                    className="ra-progress-fill"
                    style={{
                      width: `${bucket.pct}%`,
                      backgroundColor: bucket.barColor,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontWeight: 700,
                    textAlign: 'right',
                    color: bucket.isAlert ? '#991B1B' : 'inherit',
                  }}
                >
                  {bucket.count}
                </span>
                <span
                  style={{
                    color: bucket.isAlert ? '#991B1B' : '#475569',
                    textAlign: 'right',
                    fontWeight: bucket.isAlert ? 600 : 400,
                  }}
                >
                  PKR {bucket.amount.toLocaleString('en-US')}
                </span>
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* Pending by Method */}
        <section className="ra-card">
          <h2 className="ra-card-title">Pending by method</h2>
          <div className="ra-bar-table">
            {methodBuckets.map((bucket) => (
              <React.Fragment key={bucket.label}>
                <span style={{ color: '#334155', fontWeight: 500 }}>{bucket.label}</span>
                <div className="ra-progress-track">
                  <div
                    className="ra-progress-fill"
                    style={{
                      width: `${bucket.pct}%`,
                      backgroundColor: '#1D4ED8',
                    }}
                  />
                </div>
                <span style={{ fontWeight: 700, textAlign: 'right' }}>{bucket.count}</span>
                <span style={{ color: '#475569', textAlign: 'right' }}>
                  PKR {bucket.amount.toLocaleString('en-US')}
                </span>
              </React.Fragment>
            ))}
          </div>
          <p style={{ margin: 0, color: '#64748B', fontSize: '13px', lineHeight: 1.4 }}>
            Once receiving account is captured, add a "by bank account" view here — that's how accounts actually reconciles.
          </p>
        </section>
      </div>

      {/* Bottom Priority Section */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start' }}>
        {/* Oldest Pending Table */}
        <section
          className="ra-card"
          style={{ flex: '2 1 520px', minWidth: 0, padding: '20px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <h2 className="ra-card-title">Oldest pending — clear these first</h2>
            <button
              type="button"
              onClick={onOpenQueue}
              style={{
                background: 'none',
                border: 0,
                color: '#1D4ED8',
                fontWeight: 600,
                cursor: 'pointer',
                font: 'inherit',
                fontSize: '13.5px',
              }}
            >
              View all →
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '560px', display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '84px minmax(160px, 1fr) 110px 100px 80px',
                  gap: '12px',
                  padding: '8px 4px',
                  borderBottom: '1px solid #E2E8F0',
                  color: '#475569',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                <span>Age</span>
                <span>Donor</span>
                <span style={{ textAlign: 'right' }}>Amount</span>
                <span>Project</span>
                <span />
              </div>

              {oldestPending.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '84px minmax(160px, 1fr) 110px 100px 80px',
                    gap: '12px',
                    padding: '12px 4px',
                    borderBottom: '1px solid #F1F5F9',
                    alignItems: 'center',
                  }}
                >
                  <span className={getAgeChipClass(item.age)}>
                    {item.age === 0 ? 'Today' : `${item.age} days`}
                  </span>

                  <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 600 }} dir="auto">{item.donor}</span>
                    {item.dup && (
                      <span
                        style={{
                          justifySelf: 'start',
                          alignSelf: 'flex-start',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: '#FFEDD5',
                          color: '#9A3412',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        Possible duplicate
                      </span>
                    )}
                  </span>

                  <span style={{ textAlign: 'right', fontWeight: 600 }}>
                    PKR {item.amount.toLocaleString('en-US')}
                  </span>

                  <span style={{ color: item.project ? '#334155' : '#94A3B8', fontStyle: item.project ? 'normal' : 'italic' }}>
                    {item.project || 'Not set'}
                  </span>

                  <button
                    type="button"
                    onClick={() => onReviewRecord(item.id)}
                    style={{
                      justifySelf: 'end',
                      background: 'none',
                      border: 0,
                      color: '#1D4ED8',
                      fontWeight: 600,
                      cursor: 'pointer',
                      font: 'inherit',
                      fontSize: '13px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Data Gaps Blocking Reconciliation */}
        <section
          className="ra-card"
          style={{ flex: '1 1 300px', minWidth: 0, padding: '20px' }}
        >
          <h2 className="ra-card-title">Data gaps blocking reconciliation</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontWeight: 600 }}>Transaction reference</span>
            <span style={{ color: '#475569', fontSize: '13px' }}>Not captured at entry — can't match to statement</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontWeight: 600 }}>Receiving bank account</span>
            <span style={{ color: '#475569', fontSize: '13px' }}>Not captured at entry</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontWeight: 600 }}>Email</span>
            <span style={{ color: '#475569', fontSize: '13px' }}>Shows "undefined" on 10 of 10 records</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: 600 }}>Project</span>
            <span style={{ color: '#475569', fontSize: '13px' }}>Not set on 6 of 10 records</span>
          </div>
        </section>
      </div>
    </div>
  );
}
