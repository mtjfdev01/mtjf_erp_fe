import React from 'react';
import {
  FiActivity,
  FiBox,
  FiBriefcase,
  FiCreditCard,
  FiGift,
  FiLayers,
  FiUsers,
} from 'react-icons/fi';
import './index.css';

/**
 * Format number as compact amount (1.2M, 450K) or plain count. No currency symbol.
 */
const formatValue = (value, isCurrency = true) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  if (!isCurrency) return num.toLocaleString();
  try {
    return new Intl.NumberFormat(undefined, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
  } catch {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString();
  }
};

function fullValue(value, isCurrency = true) {
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  if (!isCurrency) return num.toLocaleString();
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

const ICON_BY_KEY = {
  total_donations_amount: FiLayers,
  total_donors_count: FiUsers,
  online_donations_amount: FiCreditCard,
  donation_box_amount: FiBox,
  csr_amount: FiBriefcase,
  individual_amount: FiGift,
  events_amount: FiActivity,
  campaigns_amount: FiLayers,
};

const TONE_BY_KEY = {
  total_donations_amount: 'indigo',
  total_donors_count: 'slate',
  online_donations_amount: 'blue',
  donation_box_amount: 'emerald',
  csr_amount: 'amber',
  individual_amount: 'rose',
  events_amount: 'violet',
  campaigns_amount: 'cyan',
};

/**
 * Single horizontal card: title + value.
 */
const FundraisingCard = ({
  title,
  value,
  isCurrency = true,
  className = '',
  icon: Icon,
  tone = 'slate',
}) => {
  const compact = formatValue(value, isCurrency);
  const full = fullValue(value, isCurrency);
  const aria = `${title} ${full}`;

  return (
    <div className={`fundraising-card fundraising-card--tone-${tone} ${className}`.trim()}>
      <div className="fundraising-card__left">
        <div className="fundraising-card__icon" aria-hidden>
          {Icon ? <Icon size={18} /> : null}
        </div>
        <div className="fundraising-card__meta">
          <div className="fundraising-card__title">{title}</div>
          <div className="fundraising-card__hint">{isCurrency ? 'Amount' : 'Count'}</div>
        </div>
      </div>
      <div className="fundraising-card__value" title={full} aria-label={aria}>
        {compact}
      </div>
    </div>
  );
};

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
            icon={ICON_BY_KEY[key]}
            tone={TONE_BY_KEY[key]}
          />
        ))}
      </div>
    </div>
  );
};

export default FundraisingCards;
export { FundraisingCard, formatValue };
