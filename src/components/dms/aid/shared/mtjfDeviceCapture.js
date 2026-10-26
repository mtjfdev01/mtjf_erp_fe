/**
 * SecuGen fingerprint capture — aligned with official Demo 1.
 *
 * Demo 1 (webapi.secugen.com/Demo1):
 *   POST https://localhost:8443/SGIFPCapture
 *   body: Timeout=10000&Quality=50&licstr=...&templateFormat=ISO
 *   via XMLHttpRequest (async)
 *   response: { ErrorCode, BMPBase64, ... }
 *
 * WebAPI Client listens on HTTPS :8443 (Connect compatibility / current client).
 * Older docs mention :8000 — kept as fallback only.
 */

/** Same order as Demo 1 first, then legacy ports. */
const SECUGEN_CAPTURE_URLS = [
  'https://localhost:8443/SGIFPCapture',
  'https://127.0.0.1:8443/SGIFPCapture',
  'https://localhost:8000/SGIFPCapture',
  'https://127.0.0.1:8000/SGIFPCapture',
  'http://localhost:8000/SGIFPCapture',
  'http://127.0.0.1:8000/SGIFPCapture',
];

const SECUGEN_ERROR_MESSAGES = {
  3: 'SecuGen drivers not installed correctly (ErrorCode 3)',
  51: 'No SecuGen device found — plug in the reader (ErrorCode 51)',
  53: 'Device busy — reconnect the fingerprint reader (ErrorCode 53)',
  54: 'Capture timed out — place finger on the sensor (ErrorCode 54)',
  55: 'Poor image quality — clean finger and try again (ErrorCode 55)',
  59: 'Device busy — reconnect the fingerprint reader (ErrorCode 59)',
  10001: 'SecuGen license error (ErrorCode 10001)',
  10002: 'SecuGen invalid domain for this license (ErrorCode 10002)',
  10003: 'SecuGen license expired (ErrorCode 10003)',
  // Official docs: WebAPI did not receive Origin from the browser
  10004:
    'SecuGen ErrorCode 10004 — Origin header missing. Do not open SGIFPCapture in the address bar. Click “Capture from device” from the Consent/Zakat page (http/https app URL) so the browser sends Origin. Trust https://localhost:8443 once if prompted.',
};

function asDataUrl(rawBase64, mime) {
  const b64 = String(rawBase64 || '').trim();
  if (!b64) return null;
  if (b64.startsWith('data:')) return b64;
  return `data:${mime};base64,${b64}`;
}

function normalizeBridgeResult(raw) {
  if (!raw) return null;
  const dataUrl = raw.dataUrl || raw.data_url || raw.image || null;
  const url = raw.url || null;
  if (!dataUrl && !url) return null;
  return { dataUrl: dataUrl || null, url: url || null, source: raw.source || null };
}

async function captureViaBridge(kind, opts = {}) {
  const api = typeof window !== 'undefined' ? window.mtjfDevices : null;
  if (!api) return null;
  try {
    if (kind === 'thumb' && typeof api.captureThumb === 'function') {
      return normalizeBridgeResult(
        await api.captureThumb({ device: 'secugen', ...opts }),
      );
    }
    if (kind === 'signature' && typeof api.captureSignature === 'function') {
      return normalizeBridgeResult(
        await api.captureSignature({
          device: 'epad',
          model: 'VP9801',
          ...opts,
        }),
      );
    }
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err));
  }
  return null;
}

/**
 * Match Demo 1: XMLHttpRequest POST (avoids some fetch/CORS preflight quirks).
 */
function xhrPostForm(url, body, timeoutMs) {
  return new Promise((resolve, reject) => {
    const xmlhttp = new XMLHttpRequest();
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        xmlhttp.abort();
      } catch {
        /* ignore */
      }
      reject(
        new Error(
          `SecuGen request timed out (${url}). Is WebAPI Client running?`,
        ),
      );
    }, timeoutMs);

    xmlhttp.onreadystatechange = function onReady() {
      if (xmlhttp.readyState !== 4 || settled) return;
      settled = true;
      window.clearTimeout(timer);

      if (xmlhttp.status === 200) {
        try {
          resolve(JSON.parse(xmlhttp.responseText));
        } catch {
          reject(
            new Error(
              `SecuGen returned non-JSON from ${url}: ${String(
                xmlhttp.responseText || '',
              ).slice(0, 120)}`,
            ),
          );
        }
        return;
      }

      if (xmlhttp.status === 404) {
        reject(new Error(`SecuGen endpoint not found (404): ${url}`));
        return;
      }

      if (xmlhttp.status === 0) {
        reject(
          new Error(
            `Cannot reach SecuGen at ${url} (status 0). Open that URL in this browser once and accept the certificate, then retry Capture.`,
          ),
        );
        return;
      }

      reject(new Error(`SecuGen HTTP ${xmlhttp.status} from ${url}`));
    };

    xmlhttp.onerror = function onErr() {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      reject(
        new Error(
          `Network error calling ${url}. Trust the local cert (open the URL once) or check CORS / local-network permission in DevTools.`,
        ),
      );
    };

    try {
      // Match Demo 1 exactly: open + send only (no custom headers).
      // Browsers then send Origin automatically on this cross-origin POST.
      xmlhttp.open('POST', url, true);
      xmlhttp.send(body);
    } catch (err) {
      window.clearTimeout(timer);
      settled = true;
      reject(
        err instanceof Error
          ? err
          : new Error(`Failed to open SecuGen request: ${String(err)}`),
      );
    }
  });
}

function buildCaptureParams(opts = {}) {
  const timeout = Number(opts.timeoutMs) > 0 ? Number(opts.timeoutMs) : 10000;
  const quality = Number(opts.quality) > 0 ? Number(opts.quality) : 50;
  // Demo 1: empty licstr is valid for trial / licensed client installs
  const licstr =
    opts.licstr != null
      ? String(opts.licstr)
      : typeof window !== 'undefined' && window.__SECUGEN_LICSTR__ != null
        ? String(window.__SECUGEN_LICSTR__)
        : '';

  // Parameter names match Demo 1 exactly
  let params = `Timeout=${timeout}`;
  params += `&Quality=${quality}`;
  params += `&licstr=${encodeURIComponent(licstr)}`;
  params += `&templateFormat=ISO`;
  return { params, timeout };
}

function resultFromSecugenJson(json) {
  const errCode = Number(json?.ErrorCode);
  if (errCode !== 0) {
    throw new Error(
      SECUGEN_ERROR_MESSAGES[errCode] ||
        `SecuGen capture failed (ErrorCode ${errCode})`,
    );
  }

  const dataUrl =
    asDataUrl(json.BMPBase64, 'image/bmp') ||
    asDataUrl(json.PNGBase64, 'image/png') ||
    asDataUrl(json.ImageDataBase64, 'image/bmp');

  if (!dataUrl) {
    throw new Error('SecuGen ErrorCode 0 but no BMPBase64/PNG image in response');
  }

  return {
    dataUrl,
    source: 'secugen_webapi',
    meta: {
      model: json.Model || null,
      serial: json.SerialNumber || null,
      quality: json.ImageQuality ?? null,
      nfiq: json.NFIQ ?? null,
      manufacturer: json.Manufacturer || null,
    },
  };
}

/**
 * Call SecuGen WebAPI SGIFPCapture (Demo 1 compatible).
 */
export async function captureSecuGenViaWebApi(opts = {}) {
  const { params, timeout } = buildCaptureParams(opts);
  const urls = Array.isArray(opts.urls) && opts.urls.length
    ? opts.urls
    : SECUGEN_CAPTURE_URLS;

  const errors = [];

  for (const url of urls) {
    try {
      const json = await xhrPostForm(url, params, timeout + 8000);
      return resultFromSecugenJson(json);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${url} → ${message}`);
      // Device/sensor errors from a reachable service — stop (don't try other ports)
      if (/ErrorCode|timed out — place finger|Poor image|No SecuGen device|license expired|drivers not installed/i.test(message)) {
        throw err instanceof Error ? err : new Error(message);
      }
    }
  }

  throw new Error(
    `SecuGen capture failed on all endpoints.\n${errors.join('\n')}`,
  );
}

/**
 * Capture applicant thumb: optional bridge, then SecuGen WebAPI (Demo 1).
 */
export async function captureThumb(opts = {}) {
  const origin =
    typeof window !== 'undefined' ? String(window.location?.origin || '') : '';
  if (!origin || origin === 'null' || origin.startsWith('file:')) {
    throw new Error(
      'SecuGen needs a real page Origin (http:// or https://). Open the DMS in the browser (not a file:// page), then Capture.',
    );
  }

  try {
    const fromBridge = await captureViaBridge('thumb', opts);
    if (fromBridge?.dataUrl || fromBridge?.url) {
      return { ...fromBridge, source: fromBridge.source || 'secugen' };
    }
  } catch (err) {
    // Bridge present but failed — surface that; still try WebAPI
    if (opts.bridgeOnly) throw err;
  }
  return captureSecuGenViaWebApi(opts);
}

/**
 * Capture signature pad (bridge only for now — ePad).
 */
export async function captureSignature(opts = {}) {
  const fromBridge = await captureViaBridge('signature', opts);
  if (fromBridge?.dataUrl || fromBridge?.url) {
    return { ...fromBridge, source: fromBridge.source || 'epad_vp9801' };
  }
  throw new Error(
    'Signature pad bridge not available (window.mtjfDevices.captureSignature)',
  );
}

export function getDeviceCaptureHints() {
  return {
    thumb:
      'Uses SecuGen WebAPI like Demo 1: POST https://localhost:8443/SGIFPCapture. Place finger, then Capture.',
    signature:
      'Requires ePad VP9801 bridge (window.mtjfDevices.captureSignature).',
  };
}

export { SECUGEN_CAPTURE_URLS };
