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
 * Print a single Aid DOM node (hides the rest of the page via body.aid-printing).
 * By default scales the target so Application / Zakat / Marriage Gift fit on one A4 page.
 * @param {HTMLElement | null} el
 * @param {{ fitSinglePage?: boolean }} [options]
 */
export function printAidElement(el, options = {}) {
  if (!el) return;
  const fitSinglePage = options.fitSinglePage !== false;

  el.classList.add('aid-print-target');
  if (fitSinglePage) {
    el.classList.add('aid-print-single-page');
    // Hide non-print chrome while measuring so scale matches the printed layout
    el.classList.add('aid-print-measuring');
    const height = Math.max(el.scrollHeight, el.offsetHeight, 1);
    el.classList.remove('aid-print-measuring');
    const scale = Math.min(1, A4_PRINTABLE_HEIGHT_PX / height);
    el.style.setProperty('--aid-print-scale', String(scale));
    if (supportsZoom()) {
      el.classList.add('aid-print-use-zoom');
      el.style.zoom = String(scale);
    } else {
      el.classList.add('aid-print-use-transform');
    }
  }

  document.body.classList.add('aid-printing');
  window.print();
  window.setTimeout(() => {
    document.body.classList.remove('aid-printing');
    el.classList.remove(
      'aid-print-target',
      'aid-print-single-page',
      'aid-print-measuring',
      'aid-print-use-zoom',
      'aid-print-use-transform',
    );
    el.style.removeProperty('--aid-print-scale');
    el.style.zoom = '';
  }, 400);
}
