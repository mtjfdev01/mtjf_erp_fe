// Sidebar configuration for different user roles and departments
import { canViewModule, isSuperAdmin } from '../../../utils/permissions';

const programDepartmentItems = (isUser = false) => [
  {
    label: 'Applications Reports',
    path: '/program/applications_reports',
    type: 'list',
    module: 'applications_reports'
  },
  {
    label: 'Ration Reports',
    path: '/program/ration_report/list',
    type: 'list',
    module: 'ration_reports'
  },
  {
    label: 'Marriage Gifts',
    path: '/program/marriage_gifts/reports/list',
    type: 'list',
    module: 'marriage_gifts'
  },
  {
    label: 'Financial Assistance',
    path: '/program/financial_assistance/reports/list',
    type: 'list',
    module: 'financial_assistance'
  },
  {
    label: 'Sewing Machine',
    path: '/program/sewing_machine/reports/list',
    type: 'list',
    module: 'sewing_machine'
  },
  {
    label: 'Wheel Chair/Crutches',
    path: '/program/wheel_chair_or_crutches/reports/list',
    type: 'list',
    module: 'wheel_chair_or_crutches'
  },
  {
    label: 'Water Reports',
    path: '/program/water/reports/list',
    type: 'list',
    module: 'water'
  },
  {
    label: 'Kasb Reports',
    path: '/program/kasb/reports/list',
    type: 'list',
    module: 'kasb'
  },
  {
    label: 'Kasb Training Reports',
    path: '/program/kasb-training/reports',
    type: 'list',
    module: 'kasb_training'
  },
  {
    label: 'Education Reports',
    path: '/program/education/reports/list',
    type: 'list',
    module: 'education'
  },
  {
    label: 'Tree Plantation Reports',
    path: '/program/tree_plantation/reports/list',
    type: 'list',
    module: 'tree_plantation'
  },
  {
    label: 'Area Ration Reports',
    path: '/program/area_ration/reports/list',
    type: 'list',
    module: 'area_ration'
  },
  {
    label: 'Targets',
    path: '/program/targets/reports/list',
    type: 'list',
    module: 'targets'
  }
];

const storeDepartmentItems = (isUser = false) => [
  {
    label: 'Reports',
    path: '/store/reports/list',
    type: 'list',
    module: 'reports'
  }
];

const procurementsDepartmentItems = (isUser = false) => [
  {
    label: 'Reports',
    path: '/procurements/reports/list',
    type: 'list',
    module: 'reports'
  }
];

const accountsFinanceDepartmentItems = (isUser = false) => [
  {
    label: 'Reports',
    path: '/accounts_and_finance/reports/list',
    type: 'list',
    module: 'reports'
  }
];

const adminDepartmentItems = () => [
  {
    label: 'User Management',
    path: '/admin/users',
    type: 'list',
    module: 'user_management'
    // subItems: [
    //   { label: 'View All Users', path: '/admin/users', type: 'list' },
    // ]
  },
  {
    label: 'Dashboard',
    path: '/admin',
    type: 'list',
    module: 'admin_dashboard',
    subItems: [
      { label: 'Admin Dashboard', path: '/admin', type: 'list' }
    ]
  },
  {
    label: 'Program',
    path: '/program',
    type: 'list',
    module: 'program_admin',
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
    module: 'store_admin',
    subItems: [
      {label: "store_reports", path: "/store/reports/list", type: "list"}
    ]
  },
  {
    label: 'Fund Raising',
    path: '/fund_raising',
    type: 'list',
    module: 'fund_raising_admin',
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
    module: 'procurements_admin',
    subItems: [
      {label: "procurements_reports", path: "/procurements/reports/list", type: "list"}
    ]
  },
  {
    label: 'Accounts & Finance',
    path: '/accounts_and_finance',
    type: 'list',
    module: 'accounts_finance_admin',
    subItems: [
      {label: "accounts_and_finance_reports", path: "/accounts_and_finance/reports/list", type: "list"}
    ]
  },
  {
    label: 'IT',
    path: '/it',
    type: 'list',
    module: 'it_admin',
    subItems: [
      {label: "it_reports", path: "/it/reports/list", type: "list"}
    ]
  },
  {
    label: 'Marketing',
    path: '/marketing',
    type: 'list',
    module: 'marketing_admin',
    subItems: [
      {label: "marketing_reports", path: "/marketing/reports/list", type: "list"}
    ]
  },
  {
    label: 'Audio Video',
    path: '/audio_video',
    type: 'list',
    module: 'audio_video_admin',
    subItems: [
      {label: "audio_video_reports", path: "/audio_video/reports/list", type: "list"}
    ]
  }
];

const fundRaisingDepartmentItems = (isUser = false) => [
  {
    label: 'Donations',
    path: '/donations/online_donations/list',
    type: 'list',
    module: 'donations'
  },
  {
    label: 'Donation Box',
    path: '/dms/donation_box/list',
    type: 'list',
    module: 'donation_box'
  },
  {
    label: 'Donation Box Donations',
    path: '/dms/donation-box-donations/list',
    type: 'list',
    module: 'donation_box_donations'
  },
  {
    label: 'Donors',
    path: '/dms/donors/list',
    type: 'list',
    module: 'donors'
  },
  // {
  //   label: 'Reports',
  //   path: '/dms/reports/create',
  //   type: 'create',
  //   module: 'reports'
  // },
  {
    label: 'Dashboard',
    path: '/fund_raising',
    type: 'list',
    module: 'dashboard'
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
  }),
  fund_raising: (isUser = false) => ({
    id: 'fund_raising',
    label: 'Fund Raising',
    items: fundRaisingDepartmentItems(isUser)
  })
};
 
// Filter items based on user permissions
const filterItemsByPermissions = (items, permissions, department) => {
  if (!permissions || !department) {
    return items; // Return all items if no permissions (fallback)
  }

  return items.filter(item => {
    // If item has no module, show it (for backward compatibility)
    if (!item.module) {
      return true;
    }

    // Check if user has permission to view this module
    return canViewModule(permissions, department, item.module);
  });
};

// Get sidebar configuration based on user role, department, and permissions
export const getSidebarConfig = (user, permissions = null) => {
  if (!user) return [];

  const isSuperAdminRole = user.role === 'super_admin';
  const isSuperAdminPermission = isSuperAdmin(permissions);
  const isUser = user.role === 'user';

  // Super admin sees all departments (check both role and permission)
  if (isSuperAdminRole || isSuperAdminPermission) {
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
    const config = departmentConfig(isUser);
    
    // Filter items based on permissions if available
    if (permissions && userDepartment) {
      return [{
        ...config,
        items: filterItemsByPermissions(config.items, permissions, userDepartment)
      }];
    }
    
    // Fallback to role-based if no permissions
    return [config];
  }

  return [];
};

export default getSidebarConfig; 