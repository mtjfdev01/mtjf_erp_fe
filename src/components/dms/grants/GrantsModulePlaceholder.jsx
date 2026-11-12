import React from 'react';
import { useLocation } from 'react-router-dom';

const GrantsModulePlaceholder = () => {
  const location = useLocation();

  let title = 'Grants Management';
  let subtitle = 'Grants & Applications Workspace';

  if (location.pathname.includes('/funders')) {
    title = 'Grants — Funders Directory';
    subtitle = 'Manage grant funding partners, contacts, and donor profiles';
  } else if (location.pathname.includes('/applications')) {
    title = 'Grants — Applications & Proposals';
    subtitle = 'Track grant proposal pipeline, submissions, and status';
  } else if (location.pathname.includes('/disbursements')) {
    title = 'Grants — Disbursements & Reports';
    subtitle = 'Monitor grant tranches, compliance milestones, and utilization reports';
  }

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, Segoe UI, system-ui, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
          Fundraising &nbsp;/&nbsp; Grants &nbsp;/&nbsp; {title}
        </span>
        <h1 style={{ margin: '6px 0 0 0', fontSize: '24px', fontWeight: 600, color: '#0F172A' }}>
          {title}
        </h1>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          minHeight: '380px',
          background: '#FFFFFF',
          border: '1px dashed #CBD5E1',
          borderRadius: '12px',
          color: '#475569',
          textAlign: 'center',
          padding: '36px 24px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#EFF6FF',
            color: '#1559B7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a6 6 0 1 0 0 12a6 6 0 1 0 0-12M8.5 13L7 22l5-3 5 3-1.5-9" />
          </svg>
        </div>
        <span style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A' }}>
          {title}
        </span>
        <span style={{ fontSize: '14px', color: '#64748B', maxWidth: '420px' }}>
          {subtitle}
        </span>
      </div>
    </div>
  );
};

export default GrantsModulePlaceholder;
