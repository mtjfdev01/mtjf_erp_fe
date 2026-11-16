import React, { useState } from 'react';
import { FiTrendingUp, FiChevronDown, FiChevronUp, FiPlus, FiTrash2 } from 'react-icons/fi';
import FormInput from '../../../common/FormInput';
import './CapacityAssessmentFormSection.css';

const DEFAULT_SHARE = {
  issuer: '',
  ticker: '',
  quantity: '',
  est_value: '',
  source: '',
};

export default function CapacityAssessmentFormSection({
  value = {},
  onChange,
  collapsible = true,
  defaultExpanded = true,
  title = 'Capacity Assessment',
  stepNumber = null,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const data = value || {};
  const shares = Array.isArray(data.shares_held) ? data.shares_held : [];

  const handleFieldChange = (field, val) => {
    if (typeof onChange === 'function') {
      onChange({
        ...data,
        [field]: val,
      });
    }
  };

  const handleAddShare = () => {
    if (typeof onChange === 'function') {
      onChange({
        ...data,
        shares_held: [...shares, { ...DEFAULT_SHARE }],
      });
    }
  };

  const handleShareChange = (index, field, val) => {
    if (typeof onChange === 'function') {
      const nextShares = shares.map((s, idx) => {
        if (idx !== index) return s;
        return { ...s, [field]: val };
      });
      onChange({
        ...data,
        shares_held: nextShares,
      });
    }
  };

  const handleRemoveShare = (index) => {
    if (typeof onChange === 'function') {
      const nextShares = shares.filter((_, idx) => idx !== index);
      onChange({
        ...data,
        shares_held: nextShares,
      });
    }
  };

  return (
    <section className="donor-capacity-form-section">
      <div
        className="donor-capacity-form-section__header"
        onClick={() => collapsible && setIsExpanded((prev) => !prev)}
        style={{ cursor: collapsible ? 'pointer' : 'default' }}
      >
        <div className="donor-capacity-form-section__title-wrap">
          <span className="donor-capacity-form-section__icon">
            <FiTrendingUp />
          </span>
          <h3 className="donor-capacity-form-section__title">
            {stepNumber ? `${stepNumber}. ` : ''}{title}
            <span className="donor-capacity-form-section__badge">Giving Capacity</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 500, color: '#64748b' }}>
              (Optional)
            </span>
          </h3>
        </div>
        {collapsible && (
          <button
            type="button"
            className="donor-capacity-form-section__toggle-btn"
            aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded((prev) => !prev);
            }}
          >
            {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
          </button>
        )}
      </div>

      {(!collapsible || isExpanded) && (
        <div className="donor-capacity-form-section__body" style={{ marginTop: '1rem' }}>
          <p className="donor-capacity-form-section__hint">
            Evaluate and record the donor’s estimated wealth, giving potential, and shareholdings to aid cultivation.
          </p>

          <div className="form-grid-3">
            <FormInput
              label="Estimated Net Worth"
              type="text"
              name="estimated_net_worth"
              value={data.estimated_net_worth || ''}
              onChange={(e) => handleFieldChange('estimated_net_worth', e.target.value)}
              placeholder="e.g. $3M–$5M or PKR 50M"
            />
            <FormInput
              label="Salary"
              type="text"
              name="salary"
              value={data.salary || ''}
              onChange={(e) => handleFieldChange('salary', e.target.value)}
              placeholder="e.g. PKR 500,000 / month or Not available"
            />
            <FormInput
              label="Donations (past 5y)"
              type="text"
              name="donations_past_5y"
              value={data.donations_past_5y || ''}
              onChange={(e) => handleFieldChange('donations_past_5y', e.target.value)}
              placeholder="e.g. $1.1M across 15+ orgs"
            />
            <FormInput
              label="Gift Capacity"
              type="text"
              name="gift_capacity"
              value={data.gift_capacity || ''}
              onChange={(e) => handleFieldChange('gift_capacity', e.target.value)}
              placeholder="e.g. $25,000 – $50,000 or PKR 250K"
            />
            <FormInput
              label="Total Value of Shares"
              type="text"
              name="total_value_of_shares"
              value={data.total_value_of_shares || ''}
              onChange={(e) => handleFieldChange('total_value_of_shares', e.target.value)}
              placeholder="e.g. $1.3M or PKR 15M"
            />
          </div>

          <div className="donor-capacity-form-section__shares">
            <div className="donor-capacity-form-section__shares-header">
              <h4 className="donor-capacity-form-section__shares-title">Shares Held</h4>
              <button
                type="button"
                className="donor-capacity-add-share-btn"
                onClick={handleAddShare}
              >
                <FiPlus size={14} /> Add Share Holding
              </button>
            </div>

            {shares.length === 0 ? (
              <div className="donor-capacity-empty-shares">
                No share holdings added yet. Click &quot;Add Share Holding&quot; above to add listed equity details.
              </div>
            ) : (
              <div className="donor-capacity-shares-table-wrap">
                <table className="donor-capacity-shares-table">
                  <thead>
                    <tr>
                      <th style={{ width: '30%' }}>Issuer</th>
                      <th style={{ width: '15%' }}>Ticker</th>
                      <th style={{ width: '15%' }}>Quantity</th>
                      <th style={{ width: '20%' }}>Est. Value</th>
                      <th style={{ width: '15%' }}>Source</th>
                      <th style={{ width: '5%', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {shares.map((share, idx) => (
                      <tr key={idx}>
                        <td>
                          <input
                            type="text"
                            placeholder="e.g. Eli Lilly and Co (LLY)"
                            value={share.issuer || ''}
                            onChange={(e) => handleShareChange(idx, 'issuer', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="e.g. LLY"
                            value={share.ticker || ''}
                            onChange={(e) => handleShareChange(idx, 'ticker', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="e.g. 800"
                            value={share.quantity || ''}
                            onChange={(e) => handleShareChange(idx, 'quantity', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="e.g. $580K or PKR 2M"
                            value={share.est_value || ''}
                            onChange={(e) => handleShareChange(idx, 'est_value', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="e.g. SEC / PSX"
                            value={share.source || ''}
                            onChange={(e) => handleShareChange(idx, 'source', e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="donor-capacity-shares-table__del-btn"
                            title="Remove share holding"
                            onClick={() => handleRemoveShare(idx)}
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
