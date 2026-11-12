import React, { useState } from 'react';
import {
  FiTrendingUp,
  FiChevronDown,
  FiChevronUp,
  FiEdit,
  FiExternalLink,
  FiPlus,
} from 'react-icons/fi';
import './CapacityAssessmentCard.css';

export default function CapacityAssessmentCard({
  capacityAssessment = null,
  onEdit = null,
  canEdit = true,
  defaultExpanded = true,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const data = capacityAssessment || {};
  const shares = Array.isArray(data.shares_held) ? data.shares_held : [];

  const hasAnyData =
    Boolean(data.estimated_net_worth?.trim()) ||
    Boolean(data.salary?.trim()) ||
    Boolean(data.donations_past_5y?.trim()) ||
    Boolean(data.gift_capacity?.trim()) ||
    Boolean(data.total_value_of_shares?.trim()) ||
    shares.length > 0;

  return (
    <section className="donor-crm-card donor-capacity-card" aria-label="Capacity Assessment">
      <div
        className="donor-capacity-card__header"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <div className="donor-capacity-card__title-wrap">
          <span className="donor-capacity-card__icon">
            <FiTrendingUp />
          </span>
          <h3 className="donor-capacity-card__title">
            Capacity Assessment
            <span className="donor-capacity-card__badge">Giving Capacity</span>
          </h3>
        </div>

        <div className="donor-capacity-card__actions" onClick={(e) => e.stopPropagation()}>
          {canEdit && typeof onEdit === 'function' && (
            <button
              type="button"
              className="donor-capacity-card__edit-btn"
              onClick={onEdit}
              title="Edit Capacity Assessment"
            >
              <FiEdit size={13} />
              <span>{hasAnyData ? 'Edit' : 'Assess'}</span>
            </button>
          )}
          <button
            type="button"
            className="donor-capacity-card__chevron"
            aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="donor-capacity-card__body">
          {!hasAnyData ? (
            <div className="donor-capacity-unassessed">
              <p>No capacity assessment or giving profile has been recorded for this donor yet.</p>
              {canEdit && typeof onEdit === 'function' && (
                <button
                  type="button"
                  className="primary_btn"
                  onClick={onEdit}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.95rem' }}
                >
                  <FiPlus size={14} style={{ marginRight: 4 }} />
                  Add Giving Capacity Assessment
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="donor-capacity-metric-list">
                <div className="donor-capacity-metric-row">
                  <span className="donor-capacity-metric-label">Estimated Net Worth</span>
                  <span
                    className={`donor-capacity-metric-value ${
                      !data.estimated_net_worth ? 'donor-capacity-metric-value--muted' : ''
                    }`}
                  >
                    {data.estimated_net_worth || 'Not available'}
                  </span>
                </div>

                <div className="donor-capacity-metric-row">
                  <span className="donor-capacity-metric-label">Salary</span>
                  <span
                    className={`donor-capacity-metric-value ${
                      !data.salary ? 'donor-capacity-metric-value--muted' : ''
                    }`}
                  >
                    {data.salary || 'Not available'}
                  </span>
                </div>

                <div className="donor-capacity-metric-row">
                  <span className="donor-capacity-metric-label">Donations (past 5y)</span>
                  <span
                    className={`donor-capacity-metric-value ${
                      !data.donations_past_5y ? 'donor-capacity-metric-value--muted' : ''
                    }`}
                  >
                    {data.donations_past_5y || '—'}
                  </span>
                </div>

                <div className="donor-capacity-metric-row">
                  <span className="donor-capacity-metric-label">Gift Capacity</span>
                  <span
                    className={`donor-capacity-metric-value ${
                      data.gift_capacity
                        ? 'donor-capacity-metric-value--highlight'
                        : 'donor-capacity-metric-value--muted'
                    }`}
                  >
                    {data.gift_capacity || '—'}
                  </span>
                </div>

                <div className="donor-capacity-metric-row">
                  <span className="donor-capacity-metric-label">Total Value of Shares</span>
                  <span
                    className={`donor-capacity-metric-value ${
                      !data.total_value_of_shares ? 'donor-capacity-metric-value--muted' : ''
                    }`}
                  >
                    {data.total_value_of_shares || '—'}
                  </span>
                </div>
              </div>

              {shares.length > 0 && (
                <div className="donor-capacity-shares-section">
                  <h4 className="donor-capacity-shares-title">Shares Held</h4>
                  <div className="donor-capacity-display-table-wrap">
                    <table className="donor-capacity-display-table">
                      <thead>
                        <tr>
                          <th>Issuer</th>
                          <th>Ticker</th>
                          <th>Quantity</th>
                          <th>Est. Value</th>
                          <th>Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shares.map((share, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{share.issuer || '—'}</td>
                            <td>{share.ticker || '—'}</td>
                            <td>
                              {share.quantity != null && share.quantity !== ''
                                ? Number.isNaN(Number(share.quantity))
                                  ? String(share.quantity)
                                  : Number(share.quantity).toLocaleString()
                                : '—'}
                            </td>
                            <td style={{ fontWeight: 600 }}>{share.est_value || '—'}</td>
                            <td>
                              {share.source ? (
                                <span className="donor-capacity-source-badge">
                                  {share.source}
                                  <FiExternalLink size={11} />
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
