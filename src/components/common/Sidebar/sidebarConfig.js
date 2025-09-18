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
  
  procurements: (isUser = false) => ({
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
      departmentConfigs.admin()
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