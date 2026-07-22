import React from 'react';
import { CAMPAIGN_TEMPLATE_SLOTS } from './campaignConstants';

const CampaignCommunicationSection = ({
  form,
  onToggleAutomation,
  onSlotChange,
}) => {
  if (!form.is_recurring) return null;

  return (
    <div className="form-section">
      <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>Recurring donor communication</h3>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', lineHeight: 1.5 }}>
        On the 2nd of each month: send <strong>thank you</strong> to enrolled donors who already
        donated to this campaign/project this month; send <strong>reminder</strong> to those who have not.
      </p>

      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          name="monthly_donor_automation_enabled"
          checked={form.monthly_donor_automation_enabled}
          onChange={onToggleAutomation}
          style={{ width: '18px', height: '18px' }}
        />
        Enable monthly donor check (2nd of month)
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {CAMPAIGN_TEMPLATE_SLOTS.map((slot) => {
          const row = form.communication_templates?.[slot.key] || {};
          return (
            <div
              key={slot.key}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '14px',
                background: '#fafafa',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={!!row.enabled}
                  onChange={(e) => onSlotChange(slot.key, 'enabled', e.target.checked)}
                />
                {slot.label}
              </label>
              <div className="form-grid-2">
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280' }}>Email template ID</label>
                  <input
                    type="number"
                    className="form-input"
                    value={row.email_template_id || ''}
                    onChange={(e) => onSlotChange(slot.key, 'email_template_id', e.target.value)}
                    placeholder="Active email template ID"
                    min={0}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280' }}>WhatsApp template ID</label>
                  <input
                    type="number"
                    className="form-input"
                    value={row.whatsapp_template_id || ''}
                    onChange={(e) => onSlotChange(slot.key, 'whatsapp_template_id', e.target.value)}
                    placeholder="Active WhatsApp template ID"
                    min={0}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CampaignCommunicationSection;
