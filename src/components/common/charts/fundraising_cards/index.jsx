import React from 'react';
import './index.css';

/**
 * Format number as compact amount (1.2M, 450K) or plain count. No currency symbol.
 */
const formatValue = (value, isCurrency = true) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  if (!isCurrency) return num.toLocaleString();
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
};

/**
 * Single horizontal card: title + value.
 */
const FundraisingCard = ({ title, value, isCurrency = true, className = '' }) => (
  <div className={`fundraising-card ${className}`.trim()}>
    <div className="fundraising-card__title">{title}</div>
    <div className="fundraising-card__value">{formatValue(value, isCurrency)}</div>
  </div>
);

/**
 * Props.cards: shape from API data.cards
 * { total_donations_amount, total_donations_count, total_donors_count, ... }
 */
const FundraisingCards = ({ cards, title = 'Fundraising overview', className = '' }) => {
  if (!cards) return null;

  const cardItems = [
    { key: 'total_donations_amount', label: 'Total donations', isCurrency: true },
    { key: 'total_donors_count', label: 'Total donors', isCurrency: false },
    { key: 'online_donations_amount', label: 'Online donations', isCurrency: true },
    { key: 'donation_box_amount', label: 'Donation box', isCurrency: true },
    { key: 'csr_amount', label: 'CSR donations', isCurrency: true },
    { key: 'individual_amount', label: 'Individual donations', isCurrency: true },
    { key: 'events_amount', label: 'Events donations', isCurrency: true },
    { key: 'campaigns_amount', label: 'Campaigns donations', isCurrency: true },
  ];

  return (
    <div className={`fundraising-cards ${className}`.trim()}>
      {title && <h2 className="fundraising-cards__title">{title}</h2>}
      <div className="fundraising-cards__list">
        {cardItems.map(({ key, label, isCurrency }) => (
          <FundraisingCard
            key={key}
            title={label}
            value={cards[key]}
            isCurrency={isCurrency}
          />
        ))}
      </div>
    </div>
  );
};

export default FundraisingCards;
export { FundraisingCard, formatValue };
