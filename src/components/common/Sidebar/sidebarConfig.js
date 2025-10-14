// Sidebar configuration for different user roles and departments

const programDepartmentItems = (isUser = false) => [
  {
    label: 'Applications Reports',
    path: '/program/applications_reports',
    type: 'list'
  },
  {
    label: 'Ration Reports',
    path: '/program/ration_report/list',
    type: 'list'
  },
  {
    label: 'Marriage Gifts',
    path: '/program/marriage_gifts/reports/list',
    type: 'list'
  },
  {
    label: 'Financial Assistance',
    path: '/program/financial_assistance/reports/list',
    type: 'list'
  },
  {
    label: 'Sewing Machine',
    path: '/program/sewing_machine/reports/list',
    type: 'list'
  },
  {
    label: 'Wheel Chair/Crutches',
    path: '/program/wheel_chair_or_crutches/reports/list',
    type: 'list'
  },
  {
    label: 'Water Reports',
    path: '/program/water/reports/list',
    type: 'list'
  },
  {
    label: 'Kasb Reports',
    path: '/program/kasb/reports/list',
    type: 'list'
  },
  {
    label: 'Kasb Training Reports',
    path: '/program/kasb-training/reports',
    type: 'list'
  },
  {
    label: 'Education Reports',
    path: '/program/education/reports/list',
    type: 'list'
  },
  {
    label: 'Tree Plantation Reports',
    path: '/program/tree_plantation/reports/list',
    type: 'list'
  },
  {
    label: 'Area Ration Reports',
    path: '/program/area_ration/reports/list',
    type: 'list'
  },
  {
    label: 'Targets',
    path: '/program/targets/reports/list',
    type: 'list'
  }
];

const storeDepartmentItems = (isUser = false) => [
  {
    label: 'Reports',
    path: '/store/reports/list',
    type: 'list'
  }
];

const procurementsDepartmentItems = (isUser = false) => [
  {
    label: 'Reports',
    path: '/procurements/reports/list',
    type: 'list'
  }
];

const accountsFinanceDepartmentItems = (isUser = false) => [
  {
    label: 'Reports',
    path: '/accounts_and_finance/reports/list',
    type: 'list'
  }
];

const adminDepartmentItems = () => [
  {
    label: 'User Management',
    path: '/admin/users',
    type: 'list',
    // subItems: [
    //   { label: 'View All Users', path: '/admin/users', type: 'list' },
    // ]
  },
  {
    label: 'Dashboard',
    path: '/admin',
    type: 'list',
    subItems: [
      { label: 'Admin Dashboard', path: '/admin', type: 'list' }
    ]
  },
  {
    label: 'Program',
    path: '/program',
    type: 'list',
    subItems: [
      { label: 'Program Dashboard', path: '/program', type: 'list' },
      {label: "Application Reports", path: "/program/applications_reports", type: "list"},
      {label: "Ration Report", path: "/program/ration_report/list", type: "list"},
      {label: "marriage_gifts", path: "/program/marriage_gifts/reports/list", type: "list"},
      {label: "financial_assistance", path: "/program/financial_assistance/reports/list", type: "list"},
      {label: "sewing_machine", path: "/program/sewing_machine/reports/list", type: "list"},
      {label: "wheel_chair_or_crutches", path: "/program/wheel_chair_or_crutches/reports/list", type: "list"},
      {label: "water", path: "/program/water/reports/list", type: "list"},
      {label: "kasb", path: "/program/kasb/reports/list", type: "list"},
      {label: "kasb_training", path: "/program/kasb-training/reports", type: "list"},
      {label: "education", path: "/program/education/reports/list", type: "list"},
      {label: "tree_plantation", path: "/program/tree_plantation/reports/list", type: "list"},
      {label: "area_ration", path: "/program/area_ration/reports/list", type: "list"},
      {label: "targets", path: "/program/targets/reports/list", type: "list"} 
    ]
  },
  {
    label: 'Store',
    path: '/store',
    type: 'list',
    subItems: [
      {label: "store_reports", path: "/store/reports/list", type: "list"}
    ]
  },
  {
    label: 'Fund Raising',
    path: '/fund_raising',
    type: 'list',
    subItems: [ 
      {label: "donations", path: "/donations/online_donations/list", type: "list"},
      {label: "donation_box", path: "/dms/donation_box/list", type: "list"},
      {label: "donation_box_donations", path: "/dms/donation-box-donations/list", type: "list"},
      {label: "donors", path: "/dms/donors/list", type: "list"} 
    ]
  },
  {
    label: 'Procurements',
    path: '/procurements',
    type: 'list',
    subItems: [
      {label: "procurements_reports", path: "/procurements/reports/list", type: "list"}
    ]
  },
  {
    label: 'Accounts & Finance',
    path: '/accounts_and_finance',
    type: 'list',
    subItems: [
      {label: "accounts_and_finance_reports", path: "/accounts_and_finance/reports/list", type: "list"}
    ]
  },
  {
    label: 'IT',
    path: '/it',
    type: 'list',
    subItems: [
      {label: "it_reports", path: "/it/reports/list", type: "list"}
    ]
  },
  {
    label: 'Marketing',
    path: '/marketing',
    type: 'list',
    subItems: [
      {label: "marketing_reports", path: "/marketing/reports/list", type: "list"}
    ]
  },
  {
    label: 'Audio Video',
    path: '/audio_video',
    type: 'list',
    subItems: [
      {label: "audio_video_reports", path: "/audio_video/reports/list", type: "list"}
    ]
  }
];

const fundRaisingDepartmentItems = (isUser = false) => [
  {
    label: 'Donations',
    path: '/donations/online_donations/list',
    type: 'list'
  },
  {
    label: 'Donation Box',
    path: '/dms/donation_box/list',
    type: 'list'
  },
  {
    label: 'Donation Box Donations',
    path: '/dms/donation-box-donations/list',
    type: 'list'
  },
  {
    label: 'Donors',
    path: '/dms/donors/list',
    type: 'list'
  },
  {
    label: 'Dashboard',
    path: '/fund_raising',
    type: 'list'
  }
];

// Department configurations
const departmentConfigs = {
  program: (isUser = false) => ({
    id: 'program',
    label: 'Program Department',
    items: programDepartmentItems(isUser)
  }),
  
  store: (isUser = false) => ({
    id: 'store',
    label: 'Store Department',
    items: storeDepartmentItems(isUser)
  }),
  
  procurements: (isUser = alse) => ({
    id: 'procurements',
    label: 'Procurements Department',
    items: procurementsDepartmentItems(isUser)
  }),
  
  accounts_and_finance: (isUser = false) => ({
    id: 'accounts_and_finance',
    label: 'Accounts & Finance',
    items: accountsFinanceDepartmentItems(isUser)
  }),
  
  admin: () => ({
    id: 'admin',
    label: 'Admin Panel',
    items: adminDepartmentItems()
  }),
  fund_raising: (isUser = false) => ({
    id: 'fund_raising',
    label: 'Fund Raising',
    items: fundRaisingDepartmentItems(isUser)
  })
};

// Get sidebar configuration based on user role and department
export const getSidebarConfig = (user) => {
  if (!user) return [];

  const isSuperAdmin = user.role === 'super_admin';
  const isAdmin = user.role === 'admin';
  const isUser = user.role === 'user';

  // Super admin sees all departments
  if (isSuperAdmin) {
    return [
      departmentConfigs.program(false),
      departmentConfigs.store(false),
      departmentConfigs.procurements(false),
      departmentConfigs.accounts_and_finance(false),
      departmentConfigs.admin(),
      departmentConfigs.fund_raising(false)
    ];
  }

  // Regular users and admins see only their department
  const userDepartment = user.department;
  const departmentConfig = departmentConfigs[userDepartment];
  
  if (departmentConfig) {
    return [departmentConfig(isUser)];
  }

  return [];
};

export default getSidebarConfig; 