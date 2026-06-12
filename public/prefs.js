/**
 * LeadRadar — User Preferences (prefs.js)
 * Stores/loads all user settings from localStorage.
 */

const PREFS_KEY = 'lr_prefs';
const PROFILE_KEY = 'lr_profile';

const LRPrefs = {
  _data: null,

  _load() {
    if (!this._data) {
      try { this._data = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); }
      catch { this._data = {}; }
    }
    return this._data;
  },

  get(key) { return this._load()[key]; },

  set(key, val) {
    const d = this._load();
    d[key] = val;
    localStorage.setItem(PREFS_KEY, JSON.stringify(d));
    return this;
  },

  getAll() { return Object.assign({}, this._load()); },

  reset() { this._data = {}; localStorage.removeItem(PREFS_KEY); }
};

const LRProfile = {
  _data: null,

  _load() {
    if (!this._data) {
      try { this._data = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); }
      catch { this._data = {}; }
    }
    return this._data;
  },

  get(key)     { return this._load()[key] || ''; },
  getAll()     { return Object.assign({}, this._load()); },

  set(key, val) {
    const d = this._load();
    d[key] = val;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(d));
    return this;
  },

  save(obj) {
    const d = Object.assign(this._load(), obj);
    this._data = d;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(d));
  },

  clear() { this._data = null; localStorage.removeItem(PROFILE_KEY); }
};

/** Country → suggested language map */
const COUNTRY_LANG_MAP = {
  in: 'hi', bd: 'bn', fr: 'fr', de: 'de', es: 'es', br: 'pt', pt: 'pt',
  jp: 'ja', kr: 'ko', cn: 'zh', tw: 'zh', ru: 'ru', tr: 'tr', th: 'th',
  vn: 'vi', id: 'id', my: 'ms', sa: 'ar', ae: 'ar', eg: 'ar', it: 'it',
  nl: 'nl', be: 'nl', ar: 'es', mx: 'es', co: 'es', cl: 'es', pe: 'es',
};

function suggestLangForCountry(countryCode) {
  return COUNTRY_LANG_MAP[countryCode] || 'en';
}

/** Apply stored font to <html> */
function applyFont(font) {
  if (!font) return;
  document.documentElement.style.setProperty('--font', `'${font}', sans-serif`);
  document.body.style.fontFamily = `'${font}', sans-serif`;
}

/** Boot — apply all saved preferences */
function bootPreferences() {
  const theme   = LRPrefs.get('theme')           || 'ai-neon';
  const font    = LRPrefs.get('font')            || 'Inter';
  const custom  = JSON.parse(LRPrefs.get('customColors') || '{}');

  // Theme
  if (window.LRThemes) LRThemes.apply(theme, custom);

  // Font
  applyFont(font);
}

window.LRPrefs       = LRPrefs;
window.LRProfile     = LRProfile;
window.suggestLang   = suggestLangForCountry;
window.applyFont     = applyFont;
window.bootPrefs     = bootPreferences;
