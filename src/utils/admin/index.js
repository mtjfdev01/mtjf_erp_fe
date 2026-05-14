export const departments = [
  "admin",
  "store",
  "procurements",
  "accounts_and_finance",
  "program",
  "it",
  "hr",
  "marketing",
  "audio_video",
  "fund_raising",
  "meal",
  "health",
  "executive_office",
  "ceo",
  "internal_audit",
  "crd",
  "aas_lab"
];

/** Departments that have `/{slug}/tasks/...` routes (keep aligned with App.jsx). */
export const taskRouteDepartmentSlugs = [
  "program",
  "store",
  "procurements",
  "accounts_and_finance",
  "fund_raising",
  "admin",
  "it",
  "hr",
  "marketing",
  "audio_video",
];

const TASK_ROUTE_DEPT_SET = new Set(taskRouteDepartmentSlugs);

/** True if `slug` is a first-segment department used for task list/reports URLs. */
export const isTaskRouteDepartment = (slug) =>
  TASK_ROUTE_DEPT_SET.has(String(slug || "").trim().toLowerCase());

