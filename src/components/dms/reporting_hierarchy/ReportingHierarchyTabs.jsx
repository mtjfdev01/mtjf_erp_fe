import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  { id: 'people', label: 'People', path: '/dms/reporting-hierarchy' },
  {
    id: 'organogram',
    label: 'Employee Organogram',
    path: '/dms/reporting-hierarchy/organogram',
  },
  {
    id: 'import',
    label: 'Import',
    path: '/dms/reporting-hierarchy/import',
  },
  { id: 'edges', label: 'Edges', path: '/dms/reporting-hierarchy/edges' },
];

const ReportingHierarchyTabs = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const active = pathname.includes('/organogram')
    ? 'organogram'
    : pathname.includes('/import')
      ? 'import'
      : pathname.includes('/edges')
        ? 'edges'
        : 'people';

  return (
    <div className="rh-tabs" role="tablist" aria-label="Reporting hierarchy views">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`rh-tab ${active === tab.id ? 'active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default ReportingHierarchyTabs;
