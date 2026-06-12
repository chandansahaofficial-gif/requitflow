/**
 * LeadRadar — i18n Engine (i18n.js)
 * Loads locale JSON and translates all data-i18n elements.
 */

const LRI18n = (() => {
  let _strings = {};
  let _lang = 'en';

  /** Nested key access: get('login.title') */
  function get(key, fallback) {
    const parts = key.split('.');
    let cur = _strings;
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object') return fallback || key;
      cur = cur[p];
    }
    return cur != null ? String(cur) : (fallback || key);
  }

  /** Load a language JSON file and apply to DOM */
  async function load(lang) {
    lang = lang || 'en';
    try {
      const res = await fetch(`locales/${lang}.json`);
      if (!res.ok) throw new Error(`Locale ${lang} not found`);
      _strings = await res.json();
      _lang = lang;
    } catch (e) {
      // Fallback to English
      if (lang !== 'en') {
        try {
          const res2 = await fetch('locales/en.json');
          _strings = await res2.json();
          _lang = 'en';
        } catch {}
      }
    }
    translate();
    document.documentElement.lang = _lang;
    // RTL support
    document.documentElement.dir = (_lang === 'ar') ? 'rtl' : 'ltr';
  }

  /** Apply all data-i18n translations to DOM */
  function translate() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = get(key);
      if (val && val !== key) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = val;
        } else {
          el.textContent = val;
        }
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = get(key);
      if (val && val !== key) el.placeholder = val;
    });
  }

  return { load, get, translate, getLang: () => _lang };
})();

window.LRI18n = LRI18n;
