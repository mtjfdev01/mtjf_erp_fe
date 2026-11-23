import React, { useMemo } from 'react';
import { FiMail, FiPhone } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import ActionMenu from '../ActionMenu';
import './ContactIconsCell.css';

function normalizePhoneDigits(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function hasValue(value) {
  return String(value || '').trim() !== '';
}

/**
 * Contact menu trigger (three dots). Popup lists Call / WhatsApp / Email
 * only when that value exists on the donor.
 */
const ContactIconsCell = ({ email = '', phone = '', className = '' }) => {
  const emailValue = String(email || '').trim();
  const phoneValue = String(phone || '').trim();
  const phoneDigits = normalizePhoneDigits(phoneValue);

  const actions = useMemo(() => {
    const items = [];
    if (hasValue(phoneValue)) {
      items.push({
        label: 'Call',
        icon: <FiPhone />,
        color: '#2563eb',
        onClick: () => {
          window.location.href = `tel:${phoneValue.replace(/\s+/g, '')}`;
        },
      });
    }
    if (phoneDigits.length > 0) {
      items.push({
        label: 'WhatsApp',
        icon: <FaWhatsapp />,
        color: '#16a34a',
        onClick: () => {
          window.open(`https://wa.me/${phoneDigits}`, '_blank', 'noopener,noreferrer');
        },
      });
    }
    if (hasValue(emailValue)) {
      items.push({
        label: 'Email',
        icon: <FiMail />,
        color: '#ea580c',
        onClick: () => {
          window.location.href = `mailto:${emailValue}`;
        },
      });
    }
    return items;
  }, [emailValue, phoneValue, phoneDigits]);

  if (actions.length === 0) {
    return <span className="contact-icons-cell contact-icons-cell--empty">—</span>;
  }

  return (
    <div
      className={`contact-icons-cell contact-icons-cell--menu ${className}`.trim()}
      onClick={(e) => e.stopPropagation()}
    >
      <ActionMenu
        actions={actions}
        trigger={<BsThreeDotsVertical className="contact-icons-cell__menu-trigger" />}
      />
    </div>
  );
};

export default ContactIconsCell;
