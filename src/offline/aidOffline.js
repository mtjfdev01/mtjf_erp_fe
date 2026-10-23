/**
 * Aid offline lock — pull accessible Data Entry + Verification apps into IndexedDB.
 */
import axiosInstance from '../utils/axios';
import {
  STORES,
  putRecord,
  getRecord,
  getAllRecords,
  clearStore,
  deleteRecord,
  generateLocalId,
} from './db';

const META_KEY = 'aid_lock_meta';

function nowIso() {
  return new Date().toISOString();
}

function appLocalId(serverId) {
  return `aid_${serverId}`;
}

export function isAidLocalId(id) {
  return String(id || '').startsWith('local_') || String(id || '').startsWith('aid_');
}

export function parseAidServerId(localId) {
  const s = String(localId || '');
  if (s.startsWith('aid_')) {
    const n = Number(s.slice(4));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

async function putAidApp(record, { serverId, localId, synced = true } = {}) {
  const sid = serverId ?? record?.id ?? null;
  const lid = localId || (sid ? appLocalId(sid) : generateLocalId());
  const row = {
    localId: lid,
    serverId: sid != null ? Number(sid) : null,
    record: { ...record, id: sid ?? lid },
    synced,
    updatedAt: nowIso(),
    lockedAt: nowIso(),
  };
  await putRecord(STORES.aidApplications, row);
  return row;
}

async function fetchAllPages(params) {
  const pageSize = 50;
  let page = 1;
  let totalPages = 1;
  const rows = [];
  while (page <= totalPages && page <= 40) {
    const res = await axiosInstance.get('/aid/applications', {
      params: { ...params, page, pageSize },
    });
    const chunk = res.data?.data || [];
    rows.push(...chunk);
    totalPages = Math.max(1, Number(res.data?.totalPages) || 1);
    if (!chunk.length) break;
    page += 1;
  }
  return rows;
}

/**
 * Download Aid apps the current user can access (entry + drafts + verification)
 * and lock them in IndexedDB. Call while still ONLINE before enabling offline mode.
 */
export async function pullAndLockAidOfflineData() {
  const [entryRows, draftRows, verifyRows] = await Promise.all([
    fetchAllPages({ queue: 'entry' }),
    fetchAllPages({ queue: 'drafts' }),
    fetchAllPages({}), // verification process list (excludes drafts on BE)
  ]);

  const byId = new Map();
  for (const row of [...entryRows, ...draftRows, ...verifyRows]) {
    if (row?.id == null) continue;
    byId.set(Number(row.id), row);
  }

  // Replace previous lock (keep pending local-only creates in queue separately)
  const existing = await getAllRecords(STORES.aidApplications);
  for (const row of existing) {
    if (row.synced !== false || row.serverId) {
      // will be overwritten / cleared below
    }
  }
  await clearStore(STORES.aidApplications);

  // Re-store any unsynced local-only creates from previous session that are still in queue
  // (cleared above — recover from sync queue payloads if needed later)

  const ids = [...byId.keys()];
  const details = [];
  // Fetch full records in batches
  const concurrency = 5;
  for (let i = 0; i < ids.length; i += concurrency) {
    const slice = ids.slice(i, i + concurrency);
    const part = await Promise.all(
      slice.map(async (id) => {
        try {
          const res = await axiosInstance.get(`/aid/applications/${id}`);
          return res.data?.data || byId.get(id);
        } catch {
          return byId.get(id);
        }
      }),
    );
    details.push(...part.filter(Boolean));
  }

  for (const app of details) {
    await putAidApp(app, { serverId: app.id, synced: true });
  }

  await putRecord(STORES.aidMeta, {
    localId: META_KEY,
    lockedAt: nowIso(),
    count: details.length,
    queues: ['entry', 'drafts', 'verification'],
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dms-offline-queue-changed'));
  }

  return { count: details.length };
}

export async function getAidLockMeta() {
  return getRecord(STORES.aidMeta, META_KEY);
}

export async function listAidAppsOffline(params = {}) {
  const all = await getAllRecords(STORES.aidApplications);
  let rows = all.map((r) => ({
    ...(r.record || {}),
    id: r.serverId ?? r.record?.id ?? r.localId,
    local_id: r.localId,
    _offline: true,
    _pending_sync: r.synced === false,
  }));

  const queue = String(params.queue || '').trim();
  const status = String(params.status || '').trim();
  const stage = String(params.stage || '').trim();
  const search = String(params.search || '').trim().toLowerCase();
  const aidType = String(params.requested_aid_type || '').trim();
  const district = String(params.district || '').trim().toLowerCase();
  const province = String(params.province || '').trim().toLowerCase();
  const city = String(params.city || '').trim().toLowerCase();

  if (queue === 'drafts') {
    rows = rows.filter((r) => String(r.status || '').toLowerCase() === 'draft');
  } else if (queue === 'entry') {
    rows = rows.filter((r) => String(r.status || '').toLowerCase() !== 'draft');
    if (stage) {
      rows = rows.filter(
        (r) => String(r.stage || '').toLowerCase() === stage.toLowerCase(),
      );
    }
  } else if (!queue) {
    // Verification process: hide drafts
    rows = rows.filter((r) => String(r.status || '').toLowerCase() !== 'draft');
  }

  if (status) {
    rows = rows.filter(
      (r) => String(r.status || '').toLowerCase() === status.toLowerCase(),
    );
  }
  if (aidType) {
    rows = rows.filter((r) => r.requested_aid_type === aidType);
  }
  if (district) {
    rows = rows.filter(
      (r) =>
        String(r.beneficiary?.district || r.district || '')
          .toLowerCase()
          .trim() === district,
    );
  }
  if (province) {
    rows = rows.filter(
      (r) =>
        String(r.beneficiary?.province || r.province || '')
          .toLowerCase()
          .trim() === province,
    );
  }
  if (city) {
    rows = rows.filter(
      (r) =>
        String(r.beneficiary?.city || r.city || '')
          .toLowerCase()
          .trim() === city,
    );
  }
  if (search) {
    rows = rows.filter((r) => {
      const hay = [
        r.application_no,
        r.title,
        r.family_head_name,
        r.family_head_cnic,
        r.beneficiary?.full_name,
        r.beneficiary?.cnic,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(search);
    });
  }

  const sortField = String(params.sortField || 'updated_at');
  const sortOrder =
    String(params.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 1 : -1;
  rows.sort((a, b) => {
    const av = a[sortField] || a.updated_at || a.created_at || '';
    const bv = b[sortField] || b.updated_at || b.created_at || '';
    if (av === bv) return 0;
    return av > bv ? sortOrder : -sortOrder;
  });

  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20));
  const total = rows.length;
  const start = (page - 1) * pageSize;
  const data = rows.slice(start, start + pageSize);

  return {
    success: true,
    message: 'Offline Aid applications',
    data,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    stage_counts: {},
    filter_options: { districts: [], provinces: [], cities: [] },
    _offline: true,
  };
}

export async function getAidAppOffline(id) {
  const key = String(id);
  let row = await getRecord(STORES.aidApplications, key);
  if (!row && /^\d+$/.test(key)) {
    row = await getRecord(STORES.aidApplications, appLocalId(key));
  }
  if (!row) {
    throw new Error('Application not available offline. Re-download while online.');
  }
  return {
    success: true,
    message: 'OK',
    data: {
      ...(row.record || {}),
      id: row.serverId ?? row.record?.id ?? row.localId,
      local_id: row.localId,
      _offline: true,
      _pending_sync: row.synced === false,
    },
  };
}

export async function saveAidAppLocal(app, { synced = false, localId, serverId } = {}) {
  return putAidApp(app, { synced, localId, serverId });
}

export async function saveAidFormDraft(formKey, payload) {
  await putRecord(STORES.aidFormDrafts, {
    localId: formKey,
    payload,
    updatedAt: nowIso(),
  });
}

export async function loadAidFormDraft(formKey) {
  const row = await getRecord(STORES.aidFormDrafts, formKey);
  return row?.payload || null;
}

export async function clearAidFormDraft(formKey) {
  await deleteRecord(STORES.aidFormDrafts, formKey);
}
