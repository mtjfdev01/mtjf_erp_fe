import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FiSearch,
  FiUpload,
  FiImage,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiExternalLink,
} from 'react-icons/fi';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'discrepancy', label: 'Sent back' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Rejected' },
];

const STATUS_LABELS = {
  pending: 'Pending',
  discrepancy: 'Sent back for correction',
  completed: 'Completed',
  rejected: 'Rejected',
};

export default function ReconciliationQueue({
  rows = [],
  selectedId,
  onSelectRecord,
  onApprove,
  onReject,
  onUndo,
  toast,
  hasUndo,
  onUploadStatement,
}) {
  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [ageFilter, setAgeFilter] = useState('All');

  // Drawer interaction states
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [showProofModal, setShowProofModal] = useState(false);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      pending: rows.filter((r) => r.status === 'pending').length,
      discrepancy: rows.filter((r) => r.status === 'discrepancy').length,
      completed: rows.filter((r) => r.status === 'completed').length,
      rejected: rows.filter((r) => r.status === 'rejected').length,
    };
  }, [rows]);

  // Filtered & sorted records
  const filteredList = useMemo(() => {
    return rows
      .filter((r) => r.status === activeTab)
      .filter((r) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          (r.donor || '').toLowerCase().includes(q) ||
          (r.phone || '').toLowerCase().includes(q) ||
          (r.ref || '').toLowerCase().includes(q) ||
          String(r.amount).includes(q)
        );
      })
      .filter((r) => {
        if (methodFilter === 'All') return true;
        return (r.method || '').toLowerCase().includes(methodFilter.toLowerCase());
      })
      .filter((r) => {
        if (projectFilter === 'All') return true;
        if (projectFilter === 'Not set') return !r.project;
        return (r.project || '').toLowerCase() === projectFilter.toLowerCase();
      })
      .filter((r) => {
        if (ageFilter === 'All') return true;
        if (ageFilter === 'Over 7 days') return r.age > 7;
        if (ageFilter === 'Over 30 days') return r.age > 30;
        return true;
      })
      .sort((a, b) => b.age - a.age);
  }, [rows, activeTab, search, methodFilter, projectFilter, ageFilter]);

  // Selected item
  const selectedItem = useMemo(() => {
    if (filteredList.length === 0) return null;
    const match = filteredList.find((r) => r.id === selectedId);
    return match || filteredList[0];
  }, [filteredList, selectedId]);

  // Keep selectedId in sync
  useEffect(() => {
    if (selectedItem && selectedItem.id !== selectedId) {
      onSelectRecord?.(selectedItem.id);
    }
  }, [selectedItem, selectedId, onSelectRecord]);

  // Reset reject state on record switch
  useEffect(() => {
    setRejecting(false);
    setRejectReason('');
    setRejectNote('');
  }, [selectedItem?.id]);

  // Navigate next / previous
  const navigateIndex = useCallback(
    (offset) => {
      if (!selectedItem || filteredList.length <= 1) return;
      const idx = filteredList.findIndex((r) => r.id === selectedItem.id);
      if (idx === -1) return;
      const nextIdx = Math.max(0, Math.min(filteredList.length - 1, idx + offset));
      onSelectRecord?.(filteredList[nextIdx].id);
    },
    [filteredList, selectedItem, onSelectRecord],
  );

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'a' || e.key === 'A') {
        if (selectedItem && selectedItem.status === 'pending' && !rejecting) {
          e.preventDefault();
          onApprove?.(selectedItem);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (selectedItem && selectedItem.status === 'pending') {
          e.preventDefault();
          setRejecting((prev) => !prev);
        }
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        navigateIndex(1); // next
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        navigateIndex(-1); // previous
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, rejecting, onApprove, navigateIndex]);

  const handleConfirmReject = () => {
    if (!selectedItem || !rejectReason) return;
    onReject?.(selectedItem, rejectReason, rejectNote);
    setRejecting(false);
    setRejectReason('');
    setRejectNote('');
  };

  const getAgeChipClass = (age) => {
    if (age > 30) return 'ra-chip ra-chip-red';
    if (age > 7) return 'ra-chip ra-chip-orange';
    if (age > 2) return 'ra-chip ra-chip-amber';
    return 'ra-chip ra-chip-gray';
  };

  const totalFilteredAmount = useMemo(() => {
    return filteredList.reduce((s, r) => s + r.amount, 0);
  }, [filteredList]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header */}
      <div className="ra-page-header">
        <div className="ra-title-group">
          <h1>Reconciliation queue</h1>
          <p>Oldest first. Click a record to review proof and approve or reject.</p>
        </div>
        <div className="ra-header-actions">
          <button
            type="button"
            className="ra-btn ra-btn-secondary"
            onClick={onUploadStatement}
          >
            <FiUpload /> Upload bank statement
          </button>
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
              setRejecting(false);
            }}
          >
            <span>{t.label}</span>
            <span className="ra-tab-pill">{tabCounts[t.key] || 0}</span>
          </button>
        ))}
      </div>

      {/* Toast Bar with Undo */}
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

      {/* Filter Controls Toolbar */}
      <div className="ra-filter-toolbar">
        <label className="ra-search-box">
          <FiSearch color="#64748B" size={16} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search donor, phone, amount or transaction ref"
            className="ra-search-input"
          />
        </label>

        <label className="ra-select-label">
          <span>Method</span>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="ra-select"
          >
            <option value="All">All</option>
            <option value="Bank transfer">Bank transfer</option>
            <option value="Cash">Cash</option>
            <option value="In-kind">In-kind</option>
          </select>
        </label>

        <label className="ra-select-label">
          <span>Project</span>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="ra-select"
          >
            <option value="All">All</option>
            <option value="Apna Ghar">Apna Ghar</option>
            <option value="AAS Lab">AAS Lab</option>
            <option value="Not set">Not set</option>
          </select>
        </label>

        <label className="ra-select-label">
          <span>Age</span>
          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            className="ra-select"
          >
            <option value="All">All</option>
            <option value="Over 7 days">Over 7 days</option>
            <option value="Over 30 days">Over 30 days</option>
          </select>
        </label>
      </div>

      {/* Split Workspace */}
      <div className="ra-split-view">
        {/* Left Column: Records Table */}
        <section className="ra-table-pane">
          <div className="ra-table-container">
            <div style={{ minWidth: '700px', display: 'flex', flexDirection: 'column' }}>
              <div
                className="ra-grid-row-header"
                style={{
                  gridTemplateColumns: '80px 110px minmax(150px, 1fr) 110px 110px 90px',
                }}
              >
                <span>Age</span>
                <span>Received</span>
                <span>Donor</span>
                <span style={{ textAlign: 'right' }}>Amount</span>
                <span>Method</span>
                <span>Project</span>
              </div>

              {filteredList.map((r) => {
                const isSelected = selectedItem && selectedItem.id === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      onSelectRecord?.(r.id);
                      setRejecting(false);
                    }}
                    className={`ra-grid-row ${isSelected ? 'selected' : ''}`}
                    style={{
                      gridTemplateColumns: '80px 110px minmax(150px, 1fr) 110px 110px 90px',
                    }}
                  >
                    <span className={getAgeChipClass(r.age)}>
                      {r.age === 0 ? 'Today' : r.age === 1 ? '1 day' : `${r.age} days`}
                    </span>

                    <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 500 }}>{r.date}</span>
                      <span style={{ color: '#64748B', fontSize: '12px' }}>{r.time}</span>
                    </span>

                    <span style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                      <span dir="auto" style={{ fontWeight: 600, textAlign: 'start' }}>
                        {r.donor}
                      </span>
                      {r.dup && (
                        <span
                          style={{
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

                    <span style={{ textAlign: 'right', fontWeight: 700 }}>
                      PKR {r.amount.toLocaleString('en-US')}
                    </span>

                    <span style={{ color: '#334155' }}>{r.method}</span>

                    <span
                      style={{
                        color: r.project ? '#334155' : '#94A3B8',
                        fontStyle: r.project ? 'normal' : 'italic',
                      }}
                    >
                      {r.project || 'Not set'}
                    </span>
                  </button>
                );
              })}

              {filteredList.length === 0 && (
                <div className="ra-empty-state">Nothing in this tab.</div>
              )}
            </div>
          </div>

          <div className="ra-table-footer">
            <span>
              {filteredList.length} records · PKR {totalFilteredAmount.toLocaleString('en-US')} · sorted oldest first
            </span>
            <span>25 per page</span>
          </div>
        </section>

        {/* Right Column: Review Drawer / Inspector */}
        <aside className="ra-drawer-pane">
          {!selectedItem ? (
            <div className="ra-empty-state">Select a record to review it.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Record Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                  <span style={{ color: '#64748B', fontSize: '12px', fontWeight: 600 }}>
                    Offline donation #{selectedItem.id}
                  </span>
                  <span dir="auto" style={{ fontSize: '19px', fontWeight: 700, lineHeight: 1.2 }}>
                    {selectedItem.donor}
                  </span>
                </div>
                <span className={getAgeChipClass(selectedItem.age)}>
                  {selectedItem.age === 0 ? 'Today' : selectedItem.age === 1 ? '1 day' : `${selectedItem.age} days`}
                </span>
              </div>

              {/* Large Amount */}
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                PKR {selectedItem.amount.toLocaleString('en-US')}
              </div>

              {/* Details 2-Column Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px 14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ color: '#64748B', fontSize: '12px' }}>Method</span>
                  <span style={{ fontWeight: 600 }}>{selectedItem.method}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ color: '#64748B', fontSize: '12px' }}>Project</span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: selectedItem.project ? '#0F172A' : '#B45309',
                    }}
                  >
                    {selectedItem.project || 'Not set'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ color: '#64748B', fontSize: '12px' }}>Received</span>
                  <span style={{ fontWeight: 600 }}>{selectedItem.date} · {selectedItem.time}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ color: '#64748B', fontSize: '12px' }}>Entered by</span>
                  <span style={{ color: selectedItem.enteredBy ? '#0F172A' : '#B45309', fontWeight: 600 }}>
                    {selectedItem.enteredBy || 'Not captured'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ color: '#64748B', fontSize: '12px' }}>Transaction ref</span>
                  <span style={{ color: selectedItem.ref ? '#0F172A' : '#B45309', fontWeight: 600 }}>
                    {selectedItem.ref || 'Not captured'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ color: '#64748B', fontSize: '12px' }}>Receiving account</span>
                  <span style={{ color: selectedItem.account ? '#0F172A' : '#B45309', fontWeight: 600 }}>
                    {selectedItem.account || 'Not captured'}
                  </span>
                </div>
              </div>

              {/* Possible duplicate banner */}
              {selectedItem.dup && (
                <div className="ra-warning-banner">
                  <span style={{ fontWeight: 700 }}>Possible duplicate</span>
                  <span>
                    Same donor, amount and project seen across recent dates. Confirm these are two separate payments before approving.
                  </span>
                </div>
              )}

              {/* Payment Proof Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '13.5px' }}>Payment proof</span>
                <div className="ra-proof-card">
                  <FiImage size={28} color="#64748B" />
                  <span style={{ fontSize: '12.5px' }}>Receipt / screenshot preview</span>
                  <button
                    type="button"
                    className="ra-proof-btn"
                    onClick={() => setShowProofModal(true)}
                  >
                    Open full size
                  </button>
                </div>
              </div>

              {/* Bank Statement Match Section */}
              <div className="ra-match-card">
                <span style={{ fontWeight: 700 }}>Bank statement match</span>
                <span style={{ color: '#475569', lineHeight: 1.4 }}>
                  No statement uploaded for this account yet. Once uploaded, the matching line (amount, date ±2 days, ref) appears here.
                </span>
                <button
                  type="button"
                  onClick={onUploadStatement}
                  style={{
                    background: 'none',
                    border: 0,
                    color: '#1D4ED8',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    textAlign: 'left',
                    font: 'inherit',
                  }}
                >
                  Upload statement
                </button>
              </div>

              {/* Primary Actions (When Pending) */}
              {selectedItem.status === 'pending' && !rejecting && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="ra-btn ra-btn-danger-outline"
                      style={{ flex: 1 }}
                      onClick={() => setRejecting(true)}
                    >
                      Reject or flag
                    </button>
                    <button
                      type="button"
                      className="ra-btn ra-btn-success"
                      style={{ flex: 1.4 }}
                      onClick={() => onApprove?.(selectedItem)}
                    >
                      <FiCheck /> Approve &amp; next
                    </button>
                  </div>
                  <span style={{ color: '#64748B', fontSize: '12px', textAlign: 'center' }}>
                    Shortcuts: A approve · R reject · J / K next / previous
                  </span>
                </div>
              )}

              {/* Inline Rejection Form */}
              {selectedItem.status === 'pending' && rejecting && (
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
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="ra-select"
                      style={{ width: '100%', borderRadius: '8px' }}
                    >
                      <option value="">Choose a reason</option>
                      <option value="mismatch">Amount mismatch — send back for correction</option>
                      <option value="wrong_account">Wrong account or project — send back</option>
                      <option value="not_found">Not found in bank statement</option>
                      <option value="duplicate">Duplicate entry</option>
                      <option value="bad_proof">Proof missing or invalid</option>
                    </select>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 600 }}>
                    <span>Note to data entry</span>
                    <textarea
                      rows={2}
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="Optional"
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        font: 'inherit',
                        fontSize: '13px',
                        resize: 'vertical',
                      }}
                    />
                  </label>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="ra-btn ra-btn-secondary"
                      style={{ flex: 1 }}
                      onClick={() => setRejecting(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="ra-btn ra-btn-danger"
                      disabled={!rejectReason}
                      style={{
                        flex: 1.4,
                        opacity: !rejectReason ? 0.5 : 1,
                        cursor: !rejectReason ? 'not-allowed' : 'pointer',
                      }}
                      onClick={handleConfirmReject}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}

              {/* Closed Status Notice */}
              {selectedItem.status !== 'pending' && (
                <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#F1F5F9', color: '#334155', fontSize: '13px' }}>
                  Status: <strong>{STATUS_LABELS[selectedItem.status]}</strong>. Editing is locked for your role.
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Proof Modal */}
      {showProofModal && selectedItem && (
        <div className="ra-modal-overlay" onClick={() => setShowProofModal(false)}>
          <div className="ra-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ra-modal-header">
              <h3>Payment Proof · {selectedItem.donor} (PKR {selectedItem.amount.toLocaleString()})</h3>
              <button
                type="button"
                className="ra-icon-btn"
                onClick={() => setShowProofModal(false)}
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="ra-modal-body" style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div
                style={{
                  width: '100%',
                  height: '350px',
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
                <FiImage size={48} />
                <span style={{ fontWeight: 600, color: '#334155' }}>Payment Slip / Bank Transfer Receipt</span>
                <span style={{ fontSize: '12px' }}>
                  Donation #{selectedItem.id} · {selectedItem.date} · {selectedItem.method}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
