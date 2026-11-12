// Preserve focus and editing state when a view's data changes.
export const editing = (el) => !!el?.matches('input,textarea,select,[contenteditable="true"]');
export const control = (el) => !!el?.closest('button,a,input,textarea,select,summary,[contenteditable="true"]');
const selector = (el) => {
  if (el?.dataset.a) return `[data-a="${CSS.escape(el.dataset.a)}"]`;
  if (el?.dataset.c) return `[data-c="${CSS.escape(el.dataset.c)}"]`;
  return el?.id ? `#${CSS.escape(el.id)}` : null;
};
export function replaceView(root, html) {
  const active = document.activeElement, owned = root.contains(active), key = owned && selector(active);
  const selection = owned && active.selectionStart != null ? [active.selectionStart, active.selectionEnd] : null;
  const selected = owned && active.tagName === 'SELECT' ? active.value : null;
  const scroll = root.scrollTop;
  root.innerHTML = html;
  // Monthly stats refresh must not restart the character's idle pose.
  for (const portrait of root.querySelectorAll('.profile-sprite')) {
    for (const animation of portrait.getAnimations()) animation.currentTime = performance.now();
  }
  if (owned) {
    const next = key && root.querySelector(key);
    (next || root).focus({preventScroll:true});
    if (next && selection && next.setSelectionRange) next.setSelectionRange(...selection);
    if (next && selected != null && [...next.options].some(o => o.value === selected)) next.value = selected;
  }
  root.scrollTop = scroll;
}
export function dialogController(modal, background) {
  let opened = false, opener = null, openerKey = null;
  const focusables = () => [...modal.querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]')]
    .filter(el => !el.disabled && el.getClientRects().length);
  const first = () => (focusables()[0] || modal).focus({preventScroll:true});
  return {
    sync(show) {
      modal.hidden = !show;
      if (show === opened) return;
      opened = show;
      if (show) { opener = document.activeElement; openerKey = selector(opener); }
      for (const el of background()) if (el) el.inert = show;
      document.body.classList.toggle('dialog-open', show);
      if (show) first();
      else {
        const back = opener?.isConnected ? opener : openerKey && document.querySelector(openerKey);
        back?.focus({preventScroll:true});
      }
    },
    key(e) {
      if (!opened || e.key !== 'Tab') return;
      const all = focusables(), at = all.indexOf(document.activeElement);
      if (!all.length) { e.preventDefault(); first(); return; }
      if (e.shiftKey && at <= 0) { e.preventDefault(); all.at(-1).focus(); }
      else if (!e.shiftKey && (at < 0 || at === all.length - 1)) { e.preventDefault(); all[0].focus(); }
    },
    contain() { if (opened && !modal.contains(document.activeElement)) first(); },
  };
}
