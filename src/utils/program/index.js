// Vulnerabilities list for ration_report
export const ration_vulnerabilities = [
  'Widows',
  'Divorced',
  'Disable',
  'Indegent',
  'Orphan'
];

// Vulnerabilities list for marriage_gifts
export const marriage_gifts_vulnerabilities = [
  'Orphans',
  'Divorced',
  'Disable',
  'Indegent'
];

// Vulnerabilities list for financial_assistance
export const financial_assistance_vulnerabilities = [
  'Widow',
  'Divorced',
  'Disable',
  'Extreme Poor'
]; 

// Vulnerabilities list for sewing_machine
export const sewing_machine_vulnerabilities = [
  'Orphans',
  'Divorced',
  'Disable',
  'Indegent'
]; 

// Vulnerabilities list for wheel_chair_or_crutches
export const wheel_chair_or_crutches_vulnerabilities = [
  'Orphans',
  'Divorced',
  'Disable',
  'Indegent'
];

// Vulnerabilities list for health
export const health_vulnerabilities = [
  'Widows',
  'Divorced',
  'Disable',
  'Indegent',
  'Orphans',
];

// Vulnerabilities list for education
export const education_vulnerabilities = [
  'Orphans',
  'Divorced',
  'Disable',
  'Indegent'
];

// Vulnerabilities list for water
export const water_program_systems = [
  'Hand Pump Indoor',
  'Hand Pump Outdoor',
  'Water Motor Indoor',
  'Water Motor Outdoor',
  'Affrideve HP',
  'WF PLANT'
];

// Activity types for water program
export const water_activity_types = [
  'Survey', 'Installation', 'Monitoring'
];

// Centers list for kasb program
export const kasb_centers = [
  'Tulamba',
  'Abdul Hakim'
];

// All vulnerabilities types in program 
export const program_vulnerabilities = [
  { id: 1, key: 'widows', title: 'Widows' },
  { id: 2, key: 'orphans', title: 'Orphans' },
  { id: 3, key: 'women_headed_households', title: 'Women-Headed Households' },
  { id: 4, key: 'divorced_women', title: 'Divorced Women' },
  { id: 5, key: 'abandoned_women', title: 'Abandoned Women' },
  { id: 6, key: 'people_with_disabilities', title: 'People with Disabilities' },
  { id: 7, key: 'elderly_no_support', title: 'Elderly with No Support' },
  { id: 8, key: 'daily_wage_laborers', title: 'Daily Wage Laborers' },
  { id: 9, key: 'idps', title: 'Internally Displaced Persons (IDPs)' },
  { id: 10, key: 'religious_minorities', title: 'Religious Minorities in Need' },
  { id: 11, key: 'desert_area_inhabitants', title: 'Desert Area Inhabitants (e.g., Tharparkar)' },
  { id: 12, key: 'unemployed_youth', title: 'Unemployed Youth' },
  { id: 13, key: 'students_ultra_poor', title: 'Students from Ultra-Poor Families' },
  { id: 14, key: 'malnourished_families', title: 'Malnourished Families' },
  { id: 15, key: 'natural_disaster_victims', title: 'Victims of Natural Disasters' },
];

// All programs list
export const programs_list = [ 
  { id: 1, key: 'food_security', label: 'Food Security', logo: '/public/assets/images/program_logos/ration.png' },
  { id: 2, key: 'community_services', label: 'Community Services', logo: '/public/assets/images/program_logos/ration.png' },
  { id: 3, key: 'education', label: 'Education', logo: '/public/assets/images/program_logos/education.png' },
  { id: 4, key: 'water_clean_water', label: 'Water & Clean Water', logo: '/public/assets/images/program_logos/water.png' },
  { id: 5, key: 'kasb', label: 'KASB', logo: '/public/assets/images/program_logos/kasb.png' },
  { id: 6, key: 'green_initiative', label: 'Green Initiative', logo: '/public/assets/images/program_logos/kasb.png' },
  { id: 7, key: 'widows_and_orphans_care_program', label: 'Widows and Orphans Care Program', logo: '/public/assets/images/program_logos/maskan.png' },
  { id: 8, key: 'livelihood_support_program', label: 'Livelihood Support Program', logo: '/public/assets/images/program_logos/kasb.png' },
  { id: 9, key: 'disaster_management', label: 'Disaster Management', logo: '/public/assets/images/program_logos/disaster_management.png' },
];

/** Subprograms: `program_id` matches `programs_list[].id` */
export const subprograms_list = [
  { id: 1, program_id: 1, key: 'food_security_general', label: 'General distribution' },
  { id: 2, program_id: 1, key: 'food_security_targeted', label: 'Targeted assistance' },
  { id: 3, program_id: 2, key: 'community_services_general', label: 'General' },
  { id: 4, program_id: 2, key: 'community_services_outreach', label: 'Outreach' },
  { id: 5, program_id: 3, key: 'education_general', label: 'General' },
  { id: 6, program_id: 3, key: 'education_scholarships', label: 'Scholarships' },
  { id: 7, program_id: 4, key: 'water_hand_pumps', label: 'Hand pumps' },
  { id: 8, program_id: 4, key: 'water_filtration', label: 'Filtration systems' },
  { id: 9, program_id: 5, key: 'kasb_tulamba', label: 'Tulamba center' },
  { id: 10, program_id: 5, key: 'kasb_abdul_hakim', label: 'Abdul Hakim center' },
  { id: 11, program_id: 6, key: 'green_initiative_general', label: 'General' },
  { id: 12, program_id: 6, key: 'green_initiative_afforestation', label: 'Afforestation' },
  { id: 13, program_id: 7, key: 'wocp_general', label: 'General' },
  { id: 14, program_id: 7, key: 'wocp_shelter', label: 'Shelter support' },
  { id: 15, program_id: 8, key: 'livelihood_general', label: 'General' },
  { id: 16, program_id: 8, key: 'livelihood_skills', label: 'Skills training' },
  { id: 17, program_id: 9, key: 'disaster_relief', label: 'Relief operations' },
  { id: 18, program_id: 9, key: 'disaster_preparedness', label: 'Preparedness' },
];

/** Resolve display labels from keys (e.g. for read-only views). */
export const getProgramLabelByKey = (key) => {
  if (key == null || key === '') return '';
  return programs_list.find((p) => p.key === key)?.label ?? key;
};

export const getSubprogramLabelByKey = (key) => {
  if (key == null || key === '') return '';
  return subprograms_list.find((s) => s.key === key)?.label ?? key;
};