import axiosInstance from './axios';

/**
 * @param {object} [options]
 * @param {string} [options.from] - YYYY-MM-DD inclusive
 * @param {string} [options.to] - YYYY-MM-DD inclusive
 * @param {import('axios').AxiosInstance} [options.client]
 */
export async function fetchStoreDailyMonthSum(options = {}) {
  const { from, to, client = axiosInstance } = options;
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await client.get('/new-dashboard/dashboard-report/store-daily-month-sum', { params });
  if (res.data?.success === false) throw new Error(res.data?.message || 'Failed to load store sum');
  return res.data?.data;
}

export async function fetchProcurementsDailyMonthSum(options = {}) {
  const { from, to, client = axiosInstance } = options;
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await client.get('/new-dashboard/dashboard-report/procurements-daily-month-sum', { params });
  if (res.data?.success === false) throw new Error(res.data?.message || 'Failed to load procurements sum');
  return res.data?.data;
}

export async function fetchAccountsAndFinanceDailyMonthSum(options = {}) {
  const { from, to, client = axiosInstance } = options;
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await client.get('/new-dashboard/dashboard-report/accounts-and-finance-daily-month-sum', { params });
  if (res.data?.success === false) throw new Error(res.data?.message || 'Failed to load accounts sum');
  return res.data?.data;
}

export async function fetchAlHasanainClgMonthSum(options = {}) {
  const { from, to, client = axiosInstance } = options;
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await client.get('/new-dashboard/dashboard-report/al-hasanain-clg-month-sum', { params });
  if (res.data?.success === false) throw new Error(res.data?.message || 'Failed to load al hasanain sum');
  return res.data?.data;
}

export async function fetchAasCollectionCentersReportMonthSum(options = {}) {
  const { from, to, client = axiosInstance } = options;
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await client.get('/new-dashboard/dashboard-report/aas-collection-centers-report-month-sum', { params });
  if (res.data?.success === false) throw new Error(res.data?.message || 'Failed to load AAS sum');
  return res.data?.data;
}

export async function fetchDreamSchoolReportsMonthSum(options = {}) {
  const { from, to, client = axiosInstance } = options;
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await client.get('/new-dashboard/dashboard-report/dream-school-reports-month-sum', { params });
  if (res.data?.success === false) throw new Error(res.data?.message || 'Failed to load Dream School sum');
  return res.data?.data;
}

export async function fetchHealthReportsMonthSum(options = {}) {
  const { from, to, client = axiosInstance } = options;
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await client.get('/new-dashboard/dashboard-report/health-reports-month-sum', { params });
  if (res.data?.success === false) throw new Error(res.data?.message || 'Failed to load Health sum');
  return res.data?.data;
}

export default {
  fetchStoreDailyMonthSum,
  fetchProcurementsDailyMonthSum,
  fetchAccountsAndFinanceDailyMonthSum,
  fetchAlHasanainClgMonthSum,
  fetchAasCollectionCentersReportMonthSum,
  fetchDreamSchoolReportsMonthSum,
  fetchHealthReportsMonthSum,
};

