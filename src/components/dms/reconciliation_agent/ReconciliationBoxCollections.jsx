import React, { useState, useMemo, useEffect } from 'react';
import {
  FiUpload,
  FiFileText,
  FiCheck,
  FiAlertTriangle,
  FiX,
  FiSliders,
} from 'react-icons/fi';

const TABS = [
  { key: 'pending', label: 'Needs review' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'approved', label: 'Approved' },
];

const STATUS_LABELS = {
  pending: 'Needs review',
  flagged: 'Flagged',
  approved: 'Approved',
};

export function analyseRun(run, depositDays = 2, lowPct = 50) {
  const visited = (run.boxes || []).filter((b) => b.amount !== null && b.amount !== undefined);
  const collected = visited.reduce((s, b) => s + Number(b.amount || 0), 0);
  const deposited = (run.deposits || []).reduce((s, d) => s + Number(d.amount || 0), 0);
  const hasDeposit = (run.deposits || []).length > 0;
  const variance = deposited - collected;
  const issues = [];

  const highStyle = {
    padding: '9px 12px',
    borderRadius: '8px',
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    color: '#7F1D1D',
    fontWeight: 600,
    fontSize: '12.5px',
  };
  const medStyle = {
    padding: '9px 12px',
    borderRadius: '8px',
    background: '#FFF7ED',
    border: '1px solid #FED7AA',
    color: '#7C2D12',
    fontWeight: 600,
    fontSize: '12.5px',
  };

  if (!hasDeposit) {
    issues.push({
      sev: 3,
      style: highStyle,
      text: `No deposit · cash held ${run.held} days`,
    });
  } else if (variance < 0) {
    issues.push({
      sev: 3,
      style: highStyle,
      text: `Short deposit by PKR ${Math.abs(variance).toLocaleString('en-US')}`,
    });
  } else if (variance > 0) {
    issues.push({
      sev: 2,
      style: medStyle,
      text: `Excess deposit by PKR ${variance.toLocaleString('en-US')}`,
    });
  }

  if (hasDeposit && run.held > depositDays) {
    issues.push({
      sev: 1,
      style: medStyle,
      text: `Deposited ${run.held} days after collection (limit ${depositDays})`,
    });
  }

  const missed = (run.boxes || []).length - visited.length;
  if (missed > 0) {
    issues.push({
      sev: 2,
      style: medStyle,
      text: `${missed} ${missed === 1 ? 'box' : 'boxes'} not visited`,
    });
  }

  visited.forEach((b) => {
    if (b.avg && b.avg > 0) {
      const drop = Math.round((1 - b.amount / b.avg) * 100);
      if (drop >= lowPct) {
        issues.push({
          sev: 2,
          style: medStyle,
          text: `${b.id} collected ${drop}% below its average`,
        });
      }
    }
  });

  const score = issues.reduce((s, i) => s + i.sev, 0);

  return {
    collected,
    deposited,
    hasDeposit,
    variance,
    issues,
    score,
    missed,
    visited: visited.length,
    totalBoxes: (run.boxes || []).length,
  };
}

export default function ReconciliationBoxCollections({
  runs = [],
  selectedId,
  onSelectRun,
  onApproveRun,
  onFlagRun,
  onUndo,
  toast,
  hasUndo,
  onUploadStatement,
}) {
  const [activeTab, setActiveTab] = useState('pending');
  const [depositDays, setDepositDays] = useState(2);
  const [lowPct, setLowPct] = useState(50);
  const [showConfig, setShowConfig] = useState(false);

  // Drawer interaction states
  const [flagging, setFlagging] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [escalateTo, setEscalateTo] = useState('Finance manager');
  const [selectedSlip, setSelectedSlip] = useState(null);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      pending: runs.filter((r) => r.status === 'pending').length,
      flagged: runs.filter((r) => r.status === 'flagged').length,
      approved: runs.filter((r) => r.status === 'approved').length,
    };
  }, [runs]);

  // Overall metric totals across pending runs
  const overallMetrics = useMemo(() => {
    const pendingList = runs.filter((r) => r.status === 'pending');
    let undeposited = 0;
    let shortTotal = 0;
    let missedBoxes = 0;

    pendingList.forEach((r) => {
      const a = analyseRun(r, depositDays, lowPct);
      if (!a.hasDeposit) undeposited += a.collected;
      else if (a.variance < 0) shortTotal += Math.abs(a.variance);
      missedBoxes += a.missed;
    });

    return {
      pendingCount: pendingList.length,
      undeposited,
      shortTotal,
      missedBoxes,
    };
  }, [runs, depositDays, lowPct]);

  // Analyzed & sorted list for current tab
  const analyzedList = useMemo(() => {
    return runs
      .filter((r) => r.status === activeTab)
      .map((r) => ({
        run: r,
        analysis: analyseRun(r, depositDays, lowPct),
      }))
      .sort((a, b) => b.analysis.score - a.analysis.score || b.run.held - a.run.held);
  }, [runs, activeTab, depositDays, lowPct]);

  // Selected run
  const currentItem = useMemo(() => {
    if (analyzedList.length === 0) return null;
    const match = analyzedList.find((x) => x.run.id === selectedId);
    return match || analyzedList[0];
  }, [analyzedList, selectedId]);

  // Keep selectedId in sync
  useEffect(() => {
    if (currentItem && currentItem.run.id !== selectedId) {
      onSelectRun?.(currentItem.run.id);
    }
  }, [currentItem, selectedId, onSelectRun]);

  // Reset flag form on selection change
  useEffect(() => {
    setFlagging(false);
    setFlagReason('');
  }, [currentItem?.run.id]);

  const handleConfirmFlag = () => {
    if (!currentItem || !flagReason) return;
    onFlagRun?.(currentItem.run, flagReason, escalateTo);
    setFlagging(false);
    setFlagReason('');
  };

  const isPending = currentItem && currentItem.run.status === 'pending';
  const isClean = currentItem && currentItem.analysis.issues.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header */}
      <div className="ra-page-header">
        <div className="ra-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1>Donation box collections</h1>
            <span
              style={{
                padding: '3px 8px',
                borderRadius: '6px',
                background: '#F1F5F9',
                color: '#475569',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Route Runs vs Bank Deposits
            </span>
          </div>
          <p>One row per collection run. Boxes counted → route total → bank deposit must agree.</p>
        </div>
        <div className="ra-header-actions">
          <button
            type="button"
            className="ra-btn ra-btn-secondary"
            onClick={() => setShowConfig((prev) => !prev)}
            title="Configure reconciliation rules"
          >
            <FiSliders /> Rules ({depositDays}d limit, {lowPct}%)
          </button>
          <button
            type="button"
            className="ra-btn ra-btn-secondary"
            onClick={onUploadStatement}
          >
            <FiUpload /> Upload bank statement
          </button>
        </div>
      </div>

      {/* Optional Rules Configuration Panel */}
      {showConfig && (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '13.5px' }}>Rule Parameters:</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span>Deposit deadline:</span>
            <input
              type="number"
              min={1}
              max={7}
              value={depositDays}
              onChange={(e) => setDepositDays(Number(e.target.value) || 2)}
              style={{ width: '60px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
            />
            <span>days after collection</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span>Drop threshold:</span>
            <input
              type="number"
              min={10}
              max={90}
              value={lowPct}
              onChange={(e) => setLowPct(Number(e.target.value) || 50)}
              style={{ width: '60px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
            />
            <span>% below 3-run avg</span>
          </label>
        </div>
      )}

      {/* Top Metric KPI Cards */}
      <div className="ra-kpi-grid">
        <div className="ra-kpi-card">
          <span className="ra-kpi-label">Runs awaiting review</span>
          <span className="ra-kpi-value">{overallMetrics.pendingCount}</span>
        </div>

        <div className="ra-kpi-card ra-kpi-card-danger">
          <span className="ra-kpi-label ra-kpi-label-danger">Cash collected, not deposited</span>
          <span className="ra-kpi-value ra-kpi-value-danger">
            PKR {overallMetrics.undeposited.toLocaleString('en-US')}
          </span>
        </div>

        <div className="ra-kpi-card">
          <span className="ra-kpi-label">Short deposits</span>
          <span className="ra-kpi-value" style={{ color: '#9A3412' }}>
            PKR {overallMetrics.shortTotal.toLocaleString('en-US')}
          </span>
        </div>

        <div className="ra-kpi-card">
          <span className="ra-kpi-label">Boxes not visited</span>
          <span className="ra-kpi-value">{overallMetrics.missedBoxes}</span>
        </div>
      </div>

      {/* Status Tabs Bar */}
      <div className="ra-tabs-bar">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`ra-tab-btn ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(t.key);
              setFlagging(false);
            }}
          >
            <span>{t.label}</span>
            <span className="ra-tab-pill">{tabCounts[t.key] || 0}</span>
          </button>
        ))}
      </div>

      {/* Toast Notification with Undo */}
      {toast && (
        <div className="ra-toast-banner">
          <span>{toast}</span>
          {hasUndo && (
            <button
              type="button"
              className="ra-undo-btn"
              onClick={onUndo}
            >
              Undo
            </button>
          )}
        </div>
      )}

      {/* Split Workspace */}
      <div className="ra-split-view">
        {/* Left Column: Collection Runs Table */}
        <section className="ra-table-pane">
          <div className="ra-table-container">
            <div style={{ minWidth: '740px', display: 'flex', flexDirection: 'column' }}>
              <div
                className="ra-grid-row-header"
                style={{
                  gridTemplateColumns: 'minmax(170px, 1.2fr) 95px 65px 105px 105px 100px 70px',
                }}
              >
                <span>Route · Agent</span>
                <span>Collected</span>
                <span>Boxes</span>
                <span style={{ textAlign: 'right' }}>From boxes</span>
                <span style={{ textAlign: 'right' }}>Deposited</span>
                <span style={{ textAlign: 'right' }}>Variance</span>
                <span style={{ textAlign: 'right' }}>Held</span>
              </div>

              {analyzedList.map(({ run, analysis }) => {
                const isSelected = currentItem && currentItem.run.id === run.id;
                const n = analysis.issues.length;

                return (
                  <button
                    key={run.id}
                    type="button"
                    onClick={() => {
                      onSelectRun?.(run.id);
                      setFlagging(false);
                    }}
                    className={`ra-grid-row ${isSelected ? 'selected' : ''}`}
                    style={{
                      gridTemplateColumns: 'minmax(170px, 1.2fr) 95px 65px 105px 105px 100px 70px',
                    }}
                  >
                    <span style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                      <span style={{ fontWeight: 600 }}>{run.route}</span>
                      <span style={{ color: '#64748B', fontSize: '12px' }}>{run.agent}</span>
                      <span
                        className={
                          n === 0
                            ? 'ra-chip ra-chip-green'
                            : analysis.score >= 3
                            ? 'ra-chip ra-chip-red'
                            : 'ra-chip ra-chip-orange'
                        }
                        style={{ fontSize: '11px', padding: '1px 6px' }}
                      >
                        {n === 0 ? 'Clean' : `${n} ${n === 1 ? 'issue' : 'issues'}`}
                      </span>
                    </span>

                    <span>{run.date}</span>

                    <span
                      style={{
                        color: analysis.missed > 0 ? '#9A3412' : '#334155',
                        fontWeight: analysis.missed > 0 ? 700 : 500,
                      }}
                    >
                      {analysis.visited}/{analysis.totalBoxes}
                    </span>

                    <span style={{ textAlign: 'right', fontWeight: 600 }}>
                      PKR {analysis.collected.toLocaleString('en-US')}
                    </span>

                    <span
                      style={{
                        textAlign: 'right',
                        fontWeight: analysis.hasDeposit ? 600 : 700,
                        color: analysis.hasDeposit ? '#0F172A' : '#B91C1C',
                      }}
                    >
                      {analysis.hasDeposit ? `PKR ${analysis.deposited.toLocaleString('en-US')}` : 'Not deposited'}
                    </span>

                    <span
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: !analysis.hasDeposit
                          ? '#64748B'
                          : analysis.variance === 0
                          ? '#166534'
                          : '#B91C1C',
                      }}
                    >
                      {!analysis.hasDeposit
                        ? '—'
                        : analysis.variance === 0
                        ? 'Matched'
                        : (analysis.variance < 0 ? '−' : '+') + 'PKR ' + Math.abs(analysis.variance).toLocaleString('en-US')}
                    </span>

                    <span
                      style={{
                        textAlign: 'right',
                        fontWeight: run.held > depositDays ? 700 : 500,
                        color: run.held > depositDays ? '#B91C1C' : '#334155',
                      }}
                    >
                      {run.held} {run.held === 1 ? 'day' : 'days'}
                    </span>
                  </button>
                );
              })}

              {analyzedList.length === 0 && (
                <div className="ra-empty-state">Nothing in this tab.</div>
              )}
            </div>
          </div>

          <div className="ra-table-footer">
            <span>{analyzedList.length} runs · sorted highest risk first</span>
            <span>Deposit deadline: {depositDays} days after collection</span>
          </div>
        </section>

        {/* Right Column: Run Review Drawer */}
        <aside className="ra-drawer-pane">
          {!currentItem ? (
            <div className="ra-empty-state">Select a collection run to review it.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Header */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ color: '#64748B', fontSize: '12px', fontWeight: 600 }}>
                  Collection run · {currentItem.run.date}
                </span>
                <span style={{ fontSize: '19px', fontWeight: 700 }}>{currentItem.run.route}</span>
                <span style={{ color: '#475569', fontSize: '13px' }}>
                  {currentItem.run.agent} · {currentItem.analysis.visited} of {currentItem.analysis.totalBoxes} boxes visited
                </span>
              </div>

              {/* 3 Stats Overview Box */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ color: '#64748B', fontSize: '12px' }}>From boxes</span>
                  <span style={{ fontWeight: 700 }}>PKR {currentItem.analysis.collected.toLocaleString('en-US')}</span>
                </div>
                <div style={{ padding: '10px', borderRadius: '10px', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ color: '#64748B', fontSize: '12px' }}>Deposited</span>
                  <span style={{ fontWeight: 700 }}>
                    PKR {currentItem.analysis.deposited.toLocaleString('en-US')}
                  </span>
                </div>
                <div
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    background: currentItem.analysis.hasDeposit && currentItem.analysis.variance === 0 ? '#F0FDF4' : '#FEF2F2',
                    color: currentItem.analysis.hasDeposit && currentItem.analysis.variance === 0 ? '#14532D' : '#7F1D1D',
                  }}
                >
                  <span style={{ fontSize: '12px' }}>Variance</span>
                  <span style={{ fontWeight: 700 }}>
                    {!currentItem.analysis.hasDeposit
                      ? '−PKR ' + currentItem.analysis.collected.toLocaleString('en-US')
                      : currentItem.analysis.variance === 0
                      ? 'Matched'
                      : (currentItem.analysis.variance < 0 ? '−' : '+') + 'PKR ' + Math.abs(currentItem.analysis.variance).toLocaleString('en-US')}
                  </span>
                </div>
              </div>

              {/* Issues List */}
              {currentItem.analysis.issues.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '13.5px' }}>Issues</span>
                  {currentItem.analysis.issues.map((issue, idx) => (
                    <div key={idx} style={issue.style}>
                      {issue.text}
                    </div>
                  ))}
                </div>
              )}

              {/* Box Breakdown Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '13.5px' }}>Box breakdown</span>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    overflow: 'hidden',
                  }}
                >
                  {(currentItem.run.boxes || []).map((b) => {
                    const isVisited = b.amount !== null && b.amount !== undefined;
                    let diff = null;
                    let isLow = false;
                    if (isVisited && b.avg) {
                      diff = Math.round((b.amount / b.avg - 1) * 100);
                      isLow = -diff >= lowPct;
                    }

                    return (
                      <div
                        key={b.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(0, 1fr) 85px 75px',
                          gap: '8px',
                          alignItems: 'center',
                          padding: '9px 12px',
                          borderBottom: '1px solid #F1F5F9',
                          background: '#FFFFFF',
                        }}
                      >
                        <span style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
                          <span style={{ fontWeight: 600 }}>{b.id}</span>
                          <span style={{ color: '#64748B', fontSize: '12px' }}>{b.place}</span>
                        </span>

                        <span
                          style={{
                            textAlign: 'right',
                            fontWeight: isVisited ? 600 : 700,
                            color: isVisited ? '#0F172A' : '#9A3412',
                            fontSize: isVisited ? '13px' : '12px',
                          }}
                        >
                          {isVisited ? b.amount.toLocaleString('en-US') : 'Not visited'}
                        </span>

                        <span style={{ textAlign: 'right' }}>
                          {diff !== null && (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: isLow ? '#FEE2E2' : '#F1F5F9',
                                color: isLow ? '#991B1B' : '#475569',
                              }}
                            >
                              {diff > 0 ? `+${diff}%` : `${diff}%`}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <span style={{ color: '#64748B', fontSize: '12px' }}>
                  Last column compares each box with its average of the last 3 collections.
                </span>
              </div>

              {/* Bank Deposits */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '13.5px' }}>Bank deposits</span>
                {(currentItem.run.deposits || []).map((d, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      background: '#FFFFFF',
                    }}
                  >
                    <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 600 }}>PKR {d.amount.toLocaleString('en-US')}</span>
                      <span style={{ color: '#64748B', fontSize: '12px' }}>
                        {d.date} · {d.account} · slip {d.slip}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="ra-btn ra-btn-secondary"
                      style={{ minHeight: '34px', padding: '0 10px', fontSize: '12.5px' }}
                      onClick={() => setSelectedSlip(d)}
                    >
                      View slip
                    </button>
                  </div>
                ))}

                {(!currentItem.run.deposits || currentItem.run.deposits.length === 0) && (
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      color: '#7F1D1D',
                      fontWeight: 600,
                      fontSize: '13px',
                    }}
                  >
                    No deposit recorded for this run.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {isPending && !flagging && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="ra-btn ra-btn-danger-outline"
                      style={{ flex: 1 }}
                      onClick={() => setFlagging(true)}
                    >
                      Flag
                    </button>
                    <button
                      type="button"
                      className="ra-btn ra-btn-success"
                      disabled={!isClean}
                      style={{
                        flex: 1.4,
                        opacity: !isClean ? 0.5 : 1,
                        cursor: !isClean ? 'not-allowed' : 'pointer',
                      }}
                      onClick={() => onApproveRun?.(currentItem.run)}
                    >
                      <FiCheck /> Approve &amp; next
                    </button>
                  </div>
                  <span style={{ color: '#64748B', fontSize: '12px', textAlign: 'center' }}>
                    {isClean
                      ? 'Boxes, route total and deposit agree.'
                      : 'Approve unlocks only when boxes, route total and deposit agree. Flag anything else.'}
                  </span>
                </div>
              )}

              {/* Inline Flagging Form */}
              {isPending && flagging && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '14px',
                    borderRadius: '10px',
                    border: '1px solid #FECACA',
                    background: '#FFF5F5',
                  }}
                >
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 600 }}>
                    <span>Reason (required)</span>
                    <select
                      value={flagReason}
                      onChange={(e) => setFlagReason(e.target.value)}
                      className="ra-select"
                      style={{ width: '100%', borderRadius: '8px' }}
                    >
                      <option value="">Choose a reason</option>
                      <option value="short">Short deposit</option>
                      <option value="late">Not deposited within deadline</option>
                      <option value="missed">Box not visited</option>
                      <option value="low">Unusually low box collection</option>
                      <option value="seal">Seal number mismatch</option>
                    </select>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 600 }}>
                    <span>Escalate to</span>
                    <select
                      value={escalateTo}
                      onChange={(e) => setEscalateTo(e.target.value)}
                      className="ra-select"
                      style={{ width: '100%', borderRadius: '8px' }}
                    >
                      <option value="Finance manager">Finance manager</option>
                      <option value="Fundraising head">Fundraising head</option>
                      <option value="Send back to collection agent">Send back to collection agent</option>
                    </select>
                  </label>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="ra-btn ra-btn-secondary"
                      style={{ flex: 1 }}
                      onClick={() => setFlagging(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="ra-btn ra-btn-danger"
                      disabled={!flagReason}
                      style={{
                        flex: 1.4,
                        opacity: !flagReason ? 0.5 : 1,
                        cursor: !flagReason ? 'not-allowed' : 'pointer',
                      }}
                      onClick={handleConfirmFlag}
                    >
                      Confirm flag
                    </button>
                  </div>
                </div>
              )}

              {/* Locked Notice */}
              {!isPending && (
                <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#F1F5F9', color: '#334155', fontSize: '13px' }}>
                  Status: <strong>{STATUS_LABELS[currentItem.run.status]}</strong>. Editing is locked for your role.
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Slip Modal */}
      {selectedSlip && (
        <div className="ra-modal-overlay" onClick={() => setSelectedSlip(null)}>
          <div className="ra-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ra-modal-header">
              <h3>Bank Deposit Slip · PKR {selectedSlip.amount.toLocaleString()}</h3>
              <button
                type="button"
                className="ra-icon-btn"
                onClick={() => setSelectedSlip(null)}
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="ra-modal-body" style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div
                style={{
                  width: '100%',
                  height: '320px',
                  background: '#F8FAFC',
                  border: '2px dashed #CBD5E1',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  color: '#64748B',
                }}
              >
                <FiFileText size={48} />
                <span style={{ fontWeight: 600, color: '#334155' }}>Bank Deposit Slip Copy</span>
                <span style={{ fontSize: '13px' }}>
                  Date: {selectedSlip.date} · Account: {selectedSlip.account} · Slip #: {selectedSlip.slip}
                </span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#166534' }}>
                  PKR {selectedSlip.amount.toLocaleString('en-US')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
