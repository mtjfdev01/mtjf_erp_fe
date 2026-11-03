import axiosInstance from '../utils/axios';
import {
  STORES,
  getPendingQueue,
  updateQueueItem,
  removeSyncedLocalRecord,
  getRecord,
  putRecord,
  deleteRecord,
} from './db';
import { parseAidServerId } from './aidOffline';

const DEVICE_ID_KEY = 'dms_offline_device_id';

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `device_${crypto.randomUUID()}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function storeForType(type) {
  switch (type) {
    case 'CREATE_DONOR':
    case 'UPDATE_DONOR':
      return STORES.donors;
    case 'CREATE_DONATION':
    case 'UPDATE_DONATION':
      return STORES.donations;
    case 'CREATE_DONATION_BOX_DONATION':
      return STORES.boxDonations;
    case 'CREATE_AID_APPLICATION':
    case 'UPDATE_AID_APPLICATION':
    case 'VERIFY_AID_APPLICATION':
      return STORES.aidApplications;
    default:
      return null;
  }
}

function isAidType(type) {
  return (
    type === 'CREATE_AID_APPLICATION' ||
    type === 'UPDATE_AID_APPLICATION' ||
    type === 'VERIFY_AID_APPLICATION'
  );
}

/** Bypass offline axios adapter so sync can hit the real API. */
function onlineConfig(extra = {}) {
  return { ...extra, _offlineSync: true };
}

async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}

/**
 * Upload any checklist attachments stored as data: URLs while offline,
 * then rewrite the patch so the server receives real file URLs.
 */
async function resolveOfflineAttachmentsInPayload(serverId, payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const checklist = payload.verification_checklist;
  if (!checklist || typeof checklist !== 'object') return payload;

  const nextChecklist = { ...checklist };
  let changed = false;

  for (const [key, entry] of Object.entries(checklist)) {
    if (!entry || typeof entry !== 'object') continue;
    const atts = Array.isArray(entry.attachments) ? entry.attachments : [];
    if (!atts.length) continue;

    const nextAtts = [];
    for (const att of atts) {
      const url = String(att?.url || att?.file_url || '').trim();
      const pending =
        att?._offline_pending || (url.startsWith('data:') && url.includes(','));
      if (pending && url.startsWith('data:')) {
        const blob = await dataUrlToBlob(url);
        const fd = new FormData();
        fd.append('file', blob, att.name || att.file_name || 'attachment');
        fd.append(
          'context',
          key === 'site_visit' ? 'site_visit' : 'verification',
        );
        fd.append('description', key);
        const res = await axiosInstance.post(
          `/aid/applications/${serverId}/attachments/upload`,
          fd,
          onlineConfig(),
        );
        const row = res.data?.data;
        if (!row?.file_url) {
          throw new Error('Offline attachment upload returned no file URL');
        }
        nextAtts.push({
          id: row.id ?? null,
          url: row.file_url,
          name: row.file_name || att.name || att.file_name || 'Attached file',
        });
        changed = true;
      } else {
        const cleaned = { ...att };
        delete cleaned._offline_pending;
        if (cleaned.file_url && !cleaned.url) cleaned.url = cleaned.file_url;
        nextAtts.push(cleaned);
      }
    }

    nextChecklist[key] = {
      ...entry,
      attachments: nextAtts,
      attachment_url: nextAtts[0]?.url || '',
      attachment_name: nextAtts[0]?.name || '',
      attachment_id: nextAtts[0]?.id ?? null,
    };
  }

  if (!changed) return payload;
  return { ...payload, verification_checklist: nextChecklist };
}

async function syncAidQueueItem(item) {
  const type = item.type;
  if (type === 'CREATE_AID_APPLICATION') {
    const res = await axiosInstance.post(
      '/aid/applications',
      item.payload,
      onlineConfig(),
    );
    const created = res.data?.data;
    const serverId = created?.id;
    if (serverId) {
      const local = await getRecord(STORES.aidApplications, item.localId);
      if (local) {
        await putRecord(STORES.aidApplications, {
          ...local,
          serverId: Number(serverId),
          synced: true,
          record: {
            ...(local.record || {}),
            ...(created || {}),
            id: Number(serverId),
          },
          localId: `aid_${serverId}`,
        });
        // remove old local key if renamed
        if (item.localId !== `aid_${serverId}`) {
          await deleteRecord(STORES.aidApplications, item.localId);
        }
      }
    }
    await removeSyncedLocalRecord(item.localId, null, item.queueId);
    return { success: true };
  }

  if (type === 'UPDATE_AID_APPLICATION') {
    const serverId =
      item.payload?.serverId ||
      parseAidServerId(item.localId);
    if (!serverId) {
      throw new Error('Missing server id for Aid update');
    }
    const rawPatch = item.payload?.patch || item.payload;
    const patch = await resolveOfflineAttachmentsInPayload(serverId, rawPatch);
    await axiosInstance.patch(
      `/aid/applications/${serverId}`,
      patch,
      onlineConfig(),
    );
    const local = await getRecord(STORES.aidApplications, item.localId);
    if (local) {
      const nextRecord = {
        ...(local.record || {}),
        ...(patch || {}),
        id: Number(serverId),
      };
      await putRecord(STORES.aidApplications, {
        ...local,
        synced: true,
        serverId: Number(serverId),
        record: nextRecord,
      });
    }
    await removeSyncedLocalRecord(null, null, item.queueId);
    return { success: true };
  }

  if (type === 'VERIFY_AID_APPLICATION') {
    const serverId =
      item.payload?.serverId ||
      parseAidServerId(item.localId);
    if (!serverId) {
      throw new Error('Missing server id for Aid verify');
    }
    const rawBody = item.payload?.body || {};
    const body = await resolveOfflineAttachmentsInPayload(serverId, rawBody);
    await axiosInstance.post(
      `/aid/applications/${serverId}/verify`,
      body,
      onlineConfig(),
    );
    const local = await getRecord(STORES.aidApplications, item.localId);
    if (local) {
      await putRecord(STORES.aidApplications, {
        ...local,
        synced: true,
        serverId: Number(serverId),
        record: {
          ...(local.record || {}),
          ...(body || {}),
          id: Number(serverId),
        },
      });
    }
    await removeSyncedLocalRecord(null, null, item.queueId);
    return { success: true };
  }

  throw new Error(`Unknown Aid sync type: ${type}`);
}

export async function syncOfflineQueue() {
  const pending = await getPendingQueue();
  if (!pending.length) {
    return { success: true, synced: 0, failed: 0, message: 'Nothing to sync' };
  }

  const dmsActions = pending.filter((q) => !isAidType(q.type));
  const aidActions = pending.filter((q) => isAidType(q.type));

  let synced = 0;
  let failed = 0;

  // Aid: sync client-side against Aid APIs (order: create → update → verify)
  const aidOrder = {
    CREATE_AID_APPLICATION: 0,
    UPDATE_AID_APPLICATION: 1,
    VERIFY_AID_APPLICATION: 2,
  };
  aidActions.sort(
    (a, b) => (aidOrder[a.type] ?? 9) - (aidOrder[b.type] ?? 9),
  );

  for (const item of aidActions) {
    try {
      await syncAidQueueItem(item);
      synced += 1;
    } catch (err) {
      failed += 1;
      item.status = 'failed';
      item.error =
        err.response?.data?.message || err.message || 'Aid sync failed';
      await updateQueueItem(item);
    }
  }

  // DMS donors/donations: existing bulk sync endpoint
  if (dmsActions.length) {
    const actions = dmsActions.map((q) => ({
      queue_id: q.queueId,
      type: q.type,
      local_id: q.localId,
      depends_on: q.dependsOn || undefined,
      payload: q.payload,
    }));

    const res = await axiosInstance.post(
      '/dms/sync/offline',
      {
        device_id: getDeviceId(),
        actions,
      },
      onlineConfig(),
    );

    const data = res.data?.data;
    const results = data?.results || [];

    for (const r of results) {
      const queueItem = dmsActions.find((q) => q.queueId === r.queue_id);
      if (!queueItem) continue;

      if (r.success) {
        synced += 1;
        const store = storeForType(queueItem.type);
        await removeSyncedLocalRecord(
          queueItem.localId,
          store,
          queueItem.queueId,
        );
      } else {
        queueItem.status = 'failed';
        queueItem.error = r.error || 'Sync failed';
        failed += 1;
        await updateQueueItem(queueItem);
      }
    }
  }

  if (synced > 0 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dms-offline-queue-changed'));
  }

  return {
    success: failed === 0,
    synced,
    failed,
    message:
      failed === 0
        ? `Synced ${synced} record(s)`
        : `Synced ${synced}; ${failed} failed`,
  };
}
