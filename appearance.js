(() => {
  'use strict';

  const KEY = 'sborka.appearance.v1';
  const defaults = Object.freeze({theme:'system',wallpaper:'plain',accent:'pine',size:'normal'});
  const allowed = {
    theme:['system','light','dark'],
    wallpaper:['plain','grid','blueprint','warm'],
    accent:['pine','blue','clay'],
    size:['normal','large'],
  };
  const root = document.documentElement;
  const byId = id => document.getElementById(id);

  function normalize(value) {
    const result = {...defaults};
    if (value && typeof value === 'object') {
      for (const field of Object.keys(defaults)) {
        if (allowed[field].includes(value[field])) result[field] = value[field];
      }
    }
    return result;
  }

  function read() {
    try { return normalize(JSON.parse(localStorage.getItem(KEY))); }
    catch (_) { return {...defaults}; }
  }

  let appearance = read();
  function apply() {
    for (const [field,value] of Object.entries(appearance)) root.dataset[field] = value;
    const dark = appearance.theme === 'dark' ||
      (appearance.theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#111b1b' : '#f1eee6';
  }
  apply();

  function persist() {
    try { localStorage.setItem(KEY,JSON.stringify(appearance)); }
    catch (_) { /* Appearance still works for this visit. */ }
  }

  function syncChoices() {
    for (const input of overlay.querySelectorAll('input[type="radio"]')) {
      const field = input.name.replace(/^appearance-/, '');
      const selected = appearance[field] === input.value;
      input.checked = selected;
      input.parentElement.classList.toggle('is-selected',selected);
    }
  }

  let previousFocus = null;
  const overlay = byId('settings-dialog');
  const closeButton = byId('settings-close');
  const focusables = () => [...overlay.querySelectorAll('button,input:not([disabled])')];
  function open() {
    previousFocus = document.activeElement;
    syncChoices();
    overlay.classList.remove('hide');
    document.body.classList.add('settings-open');
    closeButton.focus();
  }
  function close() {
    overlay.classList.add('hide');
    document.body.classList.remove('settings-open');
    previousFocus?.focus?.();
  }

  byId('settings-open').addEventListener('click',open);
  closeButton.addEventListener('click',close);
  overlay.addEventListener('click',event => { if (event.target === overlay) close(); });
  overlay.addEventListener('change',event => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== 'radio') return;
    const field = input.name.replace(/^appearance-/, '');
    if (!allowed[field]?.includes(input.value)) return;
    appearance = {...appearance,[field]:input.value};
    apply();
    persist();
    syncChoices();
  });
  byId('settings-reset').addEventListener('click',() => {
    appearance = {...defaults};
    apply();
    persist();
    syncChoices();
  });
  document.addEventListener('keydown',event => {
    if (overlay.classList.contains('hide')) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    const items = focusables();
    const first = items[0], last = items.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change',() => {
    if (appearance.theme === 'system') apply();
  });
})();
