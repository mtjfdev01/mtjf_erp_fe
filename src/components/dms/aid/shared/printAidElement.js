/**
 * Print a single Aid DOM node (hides the rest of the page via body.aid-printing).
 * @param {HTMLElement | null} el
 */
export function printAidElement(el) {
  if (!el) return;
  el.classList.add('aid-print-target');
  document.body.classList.add('aid-printing');
  window.print();
  window.setTimeout(() => {
    document.body.classList.remove('aid-printing');
    el.classList.remove('aid-print-target');
  }, 300);
}
