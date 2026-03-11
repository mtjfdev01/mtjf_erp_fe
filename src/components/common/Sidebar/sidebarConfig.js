// Sidebar configuration for different user roles and departments
import { canViewModule, isSuperAdmin } from '../../../utils/permissions';

const TASK_MODULE_KEYS = new Set(['tasks', 'tasking']);

const TASK_ROUTE_MAP = {
  admin: { label: 'Admin Tasks', basePath: '/admin/tasks' },
  program: { label: 'Program Tasks', basePath: '/program/tasks' },
  store: { label: 'Store Tasks', basePath: '/store/tasks' },
  procurements: { label: 'Procurements Tasks', basePath: '/procurements/tasks' },
  accounts_and_finance: { label: 'Accounts & Finance Tasks', basePath: '/accounts_and_finance/tasks' },
  fund_raising: { label: 'Fund Raising Tasks', basePath: '/fund_raising/tasks' },
  it: { label: 'IT Tasks', basePath: '/it/tasks' },
  hr: { label: 'HR Tasks', basePath: '/hr/tasks' },
  marketing: { label: 'Marketing Tasks', basePath: '/marketing/tasks' },
  audio_video: { label: 'Audio Video Tasks', basePath: '/audio_video/tasks' },
};

const hasTaskAccessForDepartment = (permissions, departmentKey) => (
  canViewModule(permissions, departmentKey, 'tasks') ||
  canViewModule(permissions, departmentKey, 'tasking')
);

const hasGlobalTaskingAccess = (permissions) => (
  permissions?.tasks?.view === true ||
  permissions?.tasks?.list_view === true ||
  permissions?.tasking?.tasks?.view === true ||
  permissions?.tasking?.tasks?.list_view === true
);

const buildUnifiedTaskingGroup = (user, permissions, includeAll = false) => {
  const taskItems = Object.entries(TASK_ROUTE_MAP)
    .filter(([departmentKey]) => includeAll || hasTaskAccessForDepartment(permissions, departmentKey))
    .map(([departmentKey, routeConfig]) => ({
      label: routeConfig.label,
      path: `${routeConfig.basePath}/list`,
      type: 'list',
      module: 'tasks',
      subItems: [
        { label: 'Tasks List', path: `${routeConfig.basePath}/list`, type: 'list' },
        { label: 'Tasks Dashboard', path: `${routeConfig.basePath}/reports`, type: 'list' },
      ],
      meta: { department: departmentKey },
    }));

  // Fallback for users with generic tasking permission but no explicit department task flags.
  if (!includeAll && taskItems.length === 0 && hasGlobalTaskingAccess(permissions) && user?.department) {
    const fallbackRoute = TASK_ROUTE_MAP[user.department];
    if (fallbackRoute) {
      taskItems.push({
        label: fallbackRoute.label,
        path: `${fallbackRoute.basePath}/list`,
        type: 'list',
        module: 'tasks',
        subItems: [
          { label: 'Tasks List', path: `${fallbackRoute.basePath}/list`, type: 'list' },
          { label: 'Tasks Dashboard', path: `${fallbackRoute.basePath}/reports`, type: 'list' },
        ],
        meta: { department: user.department },
      });
    }
  }

  if (taskItems.length === 0) {
    return null;
  }

  return {
    id: 'tasking_global',
    label: 'Tasking',
    items: taskItems,
  };
};

const programDepartmentItems = (isUser = false) => [
  {
    label: 'Tasking',
    path: '/program/tasks/list',
    type: 'list',
    module: 'tasks',
    subItems: [
      { label: 'Tasking List', path: '/program/tasks/list', type: 'list' },
      { label: 'Tasking Dashboard', path: '/program/tasks/reports', type: 'list' }
    ]
  },
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
    label: 'Tasking',
    path: '/store/tasks/list',
    type: 'list',
    module: 'tasking',
    subItems:[
      {label:'Tasking List',path:'/store/tasks/list',type:'list',module:'tasking'},
      {label:'Tasking Dashboard',path:'/store/tasks/reports',type:'list',module:'tasking'}
    ]
  },
  {
    label: 'Reports',
    path: '/store/reports/list',
    type: 'list',
    module: 'reports'
  }
];

const procurementsDepartmentItems = (isUser = false) => [
  {
    label: 'Tasking',
    path: '/procurements/tasks/list',
    type: 'list',
    module: 'tasks',
    subItems:[
      {label:'Tasking List',path:'/procurements/tasks/list',type:'list',module:'tasks'},
      {label:'Tasking Dashboard',path:'/procurements/tasks/reports',type:'list',module:'tasks'}
    ]
  },
  {
    label: 'Reports',
    path: '/procurements/reports/list',
    type: 'list',
    module: 'reports'
  }
];

const accountsFinanceDepartmentItems = (isUser = false) => [
  {
    label: 'Tasking',
    path: '/accounts_and_finance/tasks/list',
    type: 'list',
    module: 'tasks',
    subItems:[
      {label:'Tasking List',path:'/accounts_and_finance/tasks/list',type:'list',module:'tasks'},
      {label:'Tasking Dashboard',path:'/accounts_and_finance/tasks/reports',type:'list',module:'tasks'}
    ]
  },
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
      {label: "donors", path: "/dms/donors/list", type: "list"},
      {label: "volunteers", path: "/dms/volunteers/list", type: "list"},
      {label: "surveys", path: "/dms/surveys/list", type: "list"},
      {label: "events", path: "/dms/events/list", type: "list"},
      {label: "campaigns", path: "/dms/campaigns/list", type: "list"}
    ]
  },
  {
    label: 'Geographic',
    path: '/dms/geographic/countries/list',
    type: 'list',
    module: 'geographic_admin',
    subItems: [
      { label: 'Countries', path: '/dms/geographic/countries/list', type: 'list' },
      { label: 'Regions', path: '/dms/geographic/regions/list', type: 'list' },
      { label: 'Districts', path: '/dms/geographic/districts/list', type: 'list' },
      { label: 'Tehsils', path: '/dms/geographic/tehsils/list', type: 'list' },
      { label: 'Cities', path: '/dms/geographic/cities/list', type: 'list' },
      { label: 'Routes', path: '/dms/geographic/routes/list', type: 'list' }
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
  },
  {
    label: 'HR',
    path: '/hr/careers/jobs/list',
    type: 'list',
    module: 'hr_admin',
    subItems: [
      { label: 'Jobs', path: '/hr/careers/jobs/list', type: 'list' },
      { label: 'Applications', path: '/hr/career/applications/list', type: 'list' }
    ]
  }
];

const hrDepartmentItems = (isUser = false) => [
  {
    label: 'Jobs',
    path: '/hr/careers/jobs/list',
    type: 'list',
    module: 'jobs'
  },
  {
    label: 'Applications',
    path: '/hr/career/applications/list',
    type: 'list',
    module: 'applications'
  },
  {
    label: 'Tasking',
    path: '/hr/tasks/list',
    type: 'list',
    module: 'tasks',
    subItems: [
      { label: 'Tasking List', path: '/hr/tasks/list', type: 'list', module: 'tasks' },
      { label: 'Tasking Dashboard', path: '/hr/tasks/reports', type: 'list', module: 'tasks' }
    ]
  },
  {
    label: 'Complaints',
    path: '/hr/complaints/list',
    type: 'list',
    module: 'complaints',
    subItems: [
      { label: 'Complaints List', path: '/hr/complaints/list', type: 'list', module: 'complaints' },
      { label: 'Complaints Dashboard', path: '/hr/complaints/reports', type: 'list', module: 'complaints' }
    ]
  }
];

const geographicItems = (isUser = false) => [
  { label: 'Countries', path: '/dms/geographic/countries/list', type: 'list', module: 'geographic_countries' },
  { label: 'Regions', path: '/dms/geographic/regions/list', type: 'list', module: 'geographic_regions' },
  { label: 'Districts', path: '/dms/geographic/districts/list', type: 'list', module: 'geographic_districts' },
  { label: 'Tehsils', path: '/dms/geographic/tehsils/list', type: 'list', module: 'geographic_tehsils' },
  { label: 'Cities', path: '/dms/geographic/cities/list', type: 'list', module: 'geographic_cities' },
  { label: 'Routes', path: '/dms/geographic/routes/list', type: 'list', module: 'geographic_routes' }
];

const fundRaisingDepartmentItems = (isUser = false) => [
  {
    label: 'Donations',
    path: '/donations/online_donations/list',
    type: 'list',
    module: 'online_donations'
  },
  // {
  //   label: 'Offline Donations',
  //   path: '/donations/offline_donations/list',
  //   type: 'list',
  //   module: 'offline_donations'
  // },
  {
    label: 'Online Donors',
    path: '/dms/donors/online/list',
    type: 'list',
    module: 'online_donors'
  },
  {
    label: 'Offline Donors',
    path: '/dms/donors/offline/list',
    type: 'list',
    module: 'offline_donors'
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
    label: 'Volunteers',
    path: '/dms/volunteers/list',
    type: 'list',
    module: 'volunteers'
  },
  {
    label: 'Surveys',
    path: '/dms/surveys/list',
    type: 'list',
    module: 'surveys'
  },
  {
    label: 'Events',
    path: '/dms/events/list',
    type: 'list',
    module: 'events'
  },
  {
    label: 'Campaigns',
    path: '/dms/campaigns/list',
    type: 'list',
    module: 'campaigns'
  },
  // {
  //   label: 'Reports',
  //   path: '/dms/reports/create',
  //   type: 'create',
  //   module: 'reports'
  // },
  {
    label: 'Tasking',
    path: '/fund_raising/tasks/list',
    type: 'list',
    module: 'tasks',
    subItems: [
      { label: 'Tasking List', path: '/fund_raising/tasks/list', type: 'list' },
      { label: 'Tasking Dashboard', path: '/fund_raising/tasks/reports', type: 'list' }
    ]
  },
  {
    label: 'Dashboard',
    path: '/fund_raising',
    type: 'list',
    module: 'dashboard'
  }
];

const taskingItems = (isUser = false) => [
  {
    label: 'Tasking List',
    path: '/tasking/tasks/list',
    type: 'list',
    module: 'tasks'
  },
  {
    label: 'Tasking Dashboard',
    path: '/tasking/tasks/reports',
    type: 'list',
    module: 'tasks'
  },
];

// IT department menu
const itDepartmentItems = () => [
  {
    label: 'Tasking',
    path: '/it/tasks/list',
    type: 'list',
    module: 'tasks',
    subItems: [
      { label: 'Tasking List', path: '/it/tasks/list', type: 'list', module: 'tasks' },
      { label: 'Tasking Dashboard', path: '/it/tasks/reports', type: 'list', module: 'tasks' }
    ]
  },
  {
    label: 'Complaints',
    path: '/it/complaints/list',
    type: 'list',
    module: 'complaints',
    subItems: [
      { label: 'Complaints List', path: '/it/complaints/list', type: 'list', module: 'complaints' },
      { label: 'Complaints Dashboard', path: '/it/complaints/reports', type: 'list', module: 'complaints' }
    ]
  }
];

// Marketing department menu
const marketingDepartmentItems = () => [
  {
    label: 'Tasking',
    path: '/marketing/tasks/list',
    type: 'list',
    module: 'tasks',
    subItems: [
      { label: 'Tasking List', path: '/marketing/tasks/list', type: 'list', module: 'tasks' },
      { label: 'Tasking Dashboard', path: '/marketing/tasks/reports', type: 'list', module: 'tasks' }
    ]
  },
  {
    label: 'Complaints',
    path: '/marketing/complaints/list',
    type: 'list',
    module: 'complaints',
    subItems: [
      { label: 'Complaints List', path: '/marketing/complaints/list', type: 'list', module: 'complaints' },
      { label: 'Complaints Dashboard', path: '/marketing/complaints/reports', type: 'list', module: 'complaints' }
    ]
  }
];

// Audio Video department menu
const audioVideoDepartmentItems = () => [
  {
    label: 'Tasking',
    path: '/audio_video/tasks/list',
    type: 'list',
    module: 'tasks',
    subItems: [
      { label: 'Tasking List', path: '/audio_video/tasks/list', type: 'list', module: 'tasks' },
      { label: 'Tasking Dashboard', path: '/audio_video/tasks/reports', type: 'list', module: 'tasks' }
    ]
  },
  {
    label: 'Complaints',
    path: '/audio_video/complaints/list',
    type: 'list',
    module: 'complaints',
    subItems: [
      { label: 'Complaints List', path: '/audio_video/complaints/list', type: 'list', module: 'complaints' },
      { label: 'Complaints Dashboard', path: '/audio_video/complaints/reports', type: 'list', module: 'complaints' }
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
  }),
  fund_raising: (isUser = false) => ({
    id: 'fund_raising',
    label: 'Fund Raising',
    items: fundRaisingDepartmentItems(isUser)
  }),
  geographic: (isUser = false) => ({
    id: 'geographic',
    label: 'Geographic',
    items: geographicItems(isUser)
  }),
  hr: (isUser = false) => ({
    id: 'hr',
    label: 'HR',
    items: hrDepartmentItems(isUser)
  }),
  tasking: (isUser = false) => ({
    id: 'tasking',
    label: 'Tasking',
    items: taskingItems(isUser)
  }),
  it: (isUser = false) => ({
    id: 'it',
    label: 'IT',
    items: itDepartmentItems(isUser)
  }),
  marketing: (isUser = false) => ({
    id: 'marketing',
    label: 'Marketing',
    items: marketingDepartmentItems(isUser)
  }),
};
 
// Filter items based on user permissions
const filterItemsByPermissions = (items, permissions, department) => {
  if (!permissions || !department) {
    return items; // Return all items if no permissions (fallback)
  }

  return items.filter(item => {
    // Tasks are shown from a dedicated global Tasking section only.
    if (item.module && TASK_MODULE_KEYS.has(item.module)) {
      return false;
    }

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
    const unifiedTaskingGroup = buildUnifiedTaskingGroup(user, permissions, true);
    return [
      departmentConfigs.program(false),
      departmentConfigs.store(false),
      departmentConfigs.procurements(false),
      departmentConfigs.accounts_and_finance(false),
      departmentConfigs.admin(),
      departmentConfigs.fund_raising(false),
      departmentConfigs.geographic(false),
      departmentConfigs.hr(false),
      ...(unifiedTaskingGroup ? [unifiedTaskingGroup] : [])
    ];
  }

  // For non-super-admin users, sidebar is derived from permission map only.
  if (!permissions) return [];

  const sections = Object.keys(departmentConfigs)
    .map((departmentKey) => {
      const config = departmentConfigs[departmentKey](isUser);
      const filteredItems = filterItemsByPermissions(
        config.items,
        permissions,
        departmentKey,
      );

      return {
        ...config,
        items: filteredItems,
      };
    })
    .filter((section) => section.items.length > 0);

  const unifiedTaskingGroup = buildUnifiedTaskingGroup(user, permissions, false);
  if (unifiedTaskingGroup) {
    sections.push(unifiedTaskingGroup);
  }

  return sections;
};

export default getSidebarConfig; 