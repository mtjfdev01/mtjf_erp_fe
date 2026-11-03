/**
 * Approx printable height for A4 with ~10mm margins (96dpi).
 * Used to scale a form so an individual print fits on one page.
 */
const A4_PRINTABLE_HEIGHT_PX = 1040;

const supportsZoom = () => {
  try {
    return typeof CSS !== 'undefined' && CSS.supports && CSS.supports('zoom', '0.5');
  } catch {
    return false;
  }
};

/**
 * Prefer zoom: it shrinks layout height (transform does not → extra blank pages).
 */
const applyFitScale = (el, { allowTransform = true } = {}) => {
  el.classList.add('aid-print-single-page', 'aid-print-measuring');
  const height = Math.max(el.scrollHeight, el.offsetHeight, 1);
  el.classList.remove('aid-print-measuring');
  const scale = Math.min(1, A4_PRINTABLE_HEIGHT_PX / height);
  el.style.setProperty('--aid-print-scale', String(scale));
  if (supportsZoom() || !allowTransform) {
    el.classList.add('aid-print-use-zoom');
    el.style.zoom = String(scale);
  } else {
    el.classList.add('aid-print-use-transform');
  }
};

const clearFitScale = (el) => {
  el.classList.remove(
    'aid-print-single-page',
    'aid-print-measuring',
    'aid-print-use-zoom',
    'aid-print-use-transform',
  );
  el.style.removeProperty('--aid-print-scale');
  el.style.zoom = '';
};

/**
 * Print a single Aid DOM node (hides the rest of the page via body.aid-printing).
 * By default scales the target so Application / Zakat / Marriage Gift fit on one A4 page.
 * Preview "print both" zooms each page (no transform) so the job is exactly 2 sheets.
 * @param {HTMLElement | null} el
 * @param {{ fitSinglePage?: boolean }} [options]
 */
export function printAidElement(el, options = {}) {
  if (!el) return;
  const fitSinglePage = options.fitSinglePage !== false;
  const previewPages = el.classList.contains('aid-preview-print-root')
    ? Array.from(el.querySelectorAll('.aid-preview--page1, .aid-preview--page2'))
    : [];

  el.classList.add('aid-print-target');

  if (fitSinglePage) {
    applyFitScale(el);
  } else if (previewPages.length) {
    // Zoom only — transform keeps full layout height and prints as ~4 pages
    previewPages.forEach((page) => applyFitScale(page, { allowTransform: false }));
  }

  document.body.classList.add('aid-printing');
  window.print();
  window.setTimeout(() => {
    document.body.classList.remove('aid-printing');
    el.classList.remove('aid-print-target');
    clearFitScale(el);
    previewPages.forEach((page) => clearFitScale(page));
  }, 400);
}
