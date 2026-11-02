import { STORES, generateLocalId, putQueueItem, getRecord } from './db';
import {
  listAidAppsOffline,
  getAidAppOffline,
  saveAidAppLocal,
  parseAidServerId,
} from './aidOffline';

function nowIso() {
  return new Date().toISOString();
}

function wrapSuccess(data, message = 'OK') {
  return { success: true, message, data };
}

async function enqueue({ type, localId, dependsOn, payload }) {
  const queueId = generateLocalId();
  await putQueueItem({
    queueId,
    type,
    localId,
    dependsOn: dependsOn || null,
    payload,
    status: 'pending',
    error: null,
    createdAt: nowIso(),
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dms-offline-queue-changed'));
  }
  return queueId;
}

function resolveLocalKey(id) {
  const s = String(id || '');
  if (s.startsWith('local_') || s.startsWith('aid_')) return s;
  if (/^\d+$/.test(s)) return `aid_${s}`;
  return s;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file'));
      return;
    }
    // Already a data URL string
    if (typeof file === 'string' && file.startsWith('data:')) {
      resolve(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file for offline storage'));
    reader.readAsDataURL(file);
  });
}

export function canHandleAidOffline(config) {
  const method = (config.method || 'get').toLowerCase();
  const url = (config.url || '').split('?')[0];

  if (method === 'get' && url === '/aid/applications') return true;
  if (method === 'get' && /^\/aid\/applications\/[^/]+$/.test(url)) return true;
  if (method === 'post' && url === '/aid/applications') return true;
  if (method === 'patch' && /^\/aid\/applications\/[^/]+$/.test(url)) return true;
  if (method === 'post' && /^\/aid\/applications\/[^/]+\/verify$/.test(url)) {
    return true;
  }
  if (
    method === 'post' &&
    /^\/aid\/applications\/[^/]+\/attachments\/upload$/.test(url)
  ) {
    return true;
  }
  return false;
}

export async function handleAidOfflineRequest(config) {
  const method = (config.method || 'get').toLowerCase();
  const url = (config.url || '').split('?')[0];
  const params = config.params || {};
  let body = config.data;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  if (method === 'get' && url === '/aid/applications') {
    return listAidAppsOffline(params);
  }

  const getOne = url.match(/^\/aid\/applications\/([^/]+)$/);
  if (method === 'get' && getOne) {
    return getAidAppOffline(getOne[1]);
  }

  if (method === 'post' && url === '/aid/applications') {
    const localId = generateLocalId();
    const record = {
      ...body,
      id: localId,
      status: body.status || 'draft',
      application_no: body.application_no || `OFFLINE-${localId.slice(-8)}`,
      created_at: nowIso(),
      updated_at: nowIso(),
      stage: 'draft',
    };
    await saveAidAppLocal(record, { synced: false, localId, serverId: null });
    await enqueue({
      type: 'CREATE_AID_APPLICATION',
      localId,
      payload: body,
    });
    return wrapSuccess(record, 'Saved offline (draft) — will sync when online');
  }

  const patchOne = url.match(/^\/aid\/applications\/([^/]+)$/);
  if (method === 'patch' && patchOne) {
    const key = resolveLocalKey(patchOne[1]);
    const existing = await getRecord(STORES.aidApplications, key);
    if (!existing) {
      throw new Error('Application not available offline');
    }
    const merged = {
      ...(existing.record || {}),
      ...body,
      updated_at: nowIso(),
    };
    await saveAidAppLocal(merged, {
      synced: false,
      localId: existing.localId,
      serverId: existing.serverId,
    });
    await enqueue({
      type: 'UPDATE_AID_APPLICATION',
      localId: existing.localId,
      payload: {
        serverId: existing.serverId,
        patch: body,
      },
    });
    return wrapSuccess(
      {
        ...merged,
        id: existing.serverId ?? existing.localId,
        local_id: existing.localId,
        _pending_sync: true,
      },
      'Updated offline — will sync when online',
    );
  }

  const uploadOne = url.match(
    /^\/aid\/applications\/([^/]+)\/attachments\/upload$/,
  );
  if (method === 'post' && uploadOne) {
    const key = resolveLocalKey(uploadOne[1]);
    const existing = await getRecord(STORES.aidApplications, key);
    if (!existing) {
      throw new Error('Application not available offline');
    }

    let file = null;
    let context = 'verification';
    let description = '';
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      file = body.get('file');
      context = String(body.get('context') || 'verification');
      description = String(body.get('description') || '');
    } else if (body && typeof body === 'object') {
      file = body.file || null;
      context = String(body.context || 'verification');
      description = String(body.description || '');
    }
    if (!file) {
      throw new Error('No file provided for offline attachment');
    }

    const dataUrl = await fileToDataUrl(file);
    const localAttId = generateLocalId();
    const fileName =
      (file && file.name) ||
      (typeof body?.file_name === 'string' && body.file_name) ||
      'attachment';
    const attRecord = {
      id: localAttId,
      file_url: dataUrl,
      file_name: fileName,
      mime_type: (file && file.type) || 'application/octet-stream',
      context,
      description,
      _offline_pending: true,
      created_at: nowIso(),
    };

    const merged = {
      ...(existing.record || {}),
      attachments: [attRecord, ...((existing.record || {}).attachments || [])],
      updated_at: nowIso(),
    };
    await saveAidAppLocal(merged, {
      synced: false,
      localId: existing.localId,
      serverId: existing.serverId,
    });

    return wrapSuccess(
      attRecord,
      'Attachment saved offline — will upload when online',
    );
  }

  const verifyOne = url.match(/^\/aid\/applications\/([^/]+)\/verify$/);
  if (method === 'post' && verifyOne) {
    const key = resolveLocalKey(verifyOne[1]);
    const existing = await getRecord(STORES.aidApplications, key);
    if (!existing) {
      throw new Error('Application not available offline');
    }
    if (!existing.serverId && !parseAidServerId(existing.localId)) {
      throw new Error('Cannot verify a new offline-only draft until it is synced');
    }
    const merged = {
      ...(existing.record || {}),
      ...body,
      status: body.status || existing.record?.status || 'under_review',
      verification_notes:
        body.verification_notes ?? existing.record?.verification_notes,
      verification_checklist:
        body.verification_checklist ?? existing.record?.verification_checklist,
      verified_at: nowIso(),
      updated_at: nowIso(),
      _offline_verified: true,
    };
    await saveAidAppLocal(merged, {
      synced: false,
      localId: existing.localId,
      serverId: existing.serverId,
    });
    await enqueue({
      type: 'VERIFY_AID_APPLICATION',
      localId: existing.localId,
      payload: {
        serverId: existing.serverId || parseAidServerId(existing.localId),
        body,
      },
    });
    return wrapSuccess(
      {
        ...merged,
        id: existing.serverId ?? existing.localId,
        local_id: existing.localId,
        _pending_sync: true,
      },
      'Verification saved offline — will sync when online',
    );
  }

  throw new Error(`Unsupported Aid offline request: ${method} ${url}`);
}

// re-export helper used by aidOffline if needed
export { resolveLocalKey };
