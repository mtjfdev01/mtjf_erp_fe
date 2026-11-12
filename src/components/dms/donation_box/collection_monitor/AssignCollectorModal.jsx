import React, { useState } from 'react';
import { FiX, FiUserCheck } from 'react-icons/fi';

const AssignCollectorModal = ({
  isOpen,
  onClose,
  box,
  collectors = [],
  onAssign,
  loading = false,
}) => {
  const [selectedCollectorId, setSelectedCollectorId] = useState(
    box?.collector_id ? String(box.collector_id) : ''
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !box) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCollectorId) return;
    setSubmitting(true);
    try {
      await onAssign(box.id, Number(selectedCollectorId));
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const validCollectors = collectors.filter(
    (c) => c.id !== 'all' && c.name !== 'All collectors'
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              <FiUserCheck />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                Assign Collection
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
                {box.box_id_no} · {box.shop_name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              Select Collector
            </label>
            <select
              value={selectedCollectorId}
              onChange={(e) => setSelectedCollectorId(e.target.value)}
              required
              style={{
                width: '100%',
                height: '42px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                color: '#1e293b',
                outline: 'none',
              }}
            >
              <option value="">-- Choose Collector --</option>
              {validCollectors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '12.5px',
                color: '#64748b',
                lineHeight: 1.4,
              }}
            >
              Current Collector: <strong>{box.collector_name || 'Unassigned'}</strong>
              <br />
              Location: <strong>{box.city}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting || loading}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedCollectorId || submitting || loading}
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: submitting || loading ? 'not-allowed' : 'pointer',
                opacity: !selectedCollectorId || submitting || loading ? 0.6 : 1,
              }}
            >
              {submitting ? 'Assigning...' : 'Assign Collector'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignCollectorModal;
