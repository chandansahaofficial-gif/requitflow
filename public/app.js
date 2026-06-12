'use strict';

/* ─── Auth guard ──────────────────────────────────────────────────── */
if (!sessionStorage.getItem('lr_auth')) {
  window.location.replace('login.html');
}

/* ══════════════════════════════════════════════════════════════════
   PREMIUM UI SYSTEM — Profile, Welcome, Theme, i18n, Settings
   ══════════════════════════════════════════════════════════════════ */

/* ── Boot preferences immediately (before DOMContentLoaded) ───── */
if (window.bootPrefs) bootPrefs();

/* ── Track dashboard stats ──────────────────────────────────────── */
let _dashStats = JSON.parse(localStorage.getItem('lr_dashStats') || '{"total":0,"hot":0,"warm":0,"cold":0,"today":0,"searches":0}');

function saveDashStats() {
  localStorage.setItem('lr_dashStats', JSON.stringify(_dashStats));
}

function _updateDashboardBase() {
  const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setEl('dashTotal',   _dashStats.total);
  setEl('dashHot',     _dashStats.hot);
  setEl('dashWarm',    _dashStats.warm);
  setEl('dashCold',    _dashStats.cold);
  setEl('dashToday',   _dashStats.today);
  setEl('dashSearches',_dashStats.searches);
}
// Full updateDashboard (also updates Analytics KPIs) is defined at the bottom of this file.

/* ── Section navigation ─────────────────────────────────────────── */
function showSection(id) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navMap = {
    'dashboard-section': 'nav-dashboard',
    'leads-section':     'nav-leads',
    'companies-section': 'nav-companies',
    'analytics-section': 'nav-analytics',
    'messages-section':  'nav-messages',
  };
  const navId = navMap[id];
  if (navId) {
    const btn = document.getElementById(navId);
    if (btn) btn.classList.add('active');
  }

  // Show/hide the lead form panel only on leads section
  const formArea = document.getElementById('sidebarFormArea');
  if (formArea) formArea.style.display = (id === 'leads-section') ? '' : 'none';

}

/* ── Profile dropdown ────────────────────────────────────────────── */
function toggleProfileDropdown() {
  document.getElementById('profileDropdown')?.classList.toggle('open');
}

function closeProfileDropdown() {
  document.getElementById('profileDropdown')?.classList.remove('open');
}

document.addEventListener('click', e => {
  const avatarBtn = document.getElementById('avatarBtn');
  const dropdown  = document.getElementById('profileDropdown');
  if (dropdown && avatarBtn && !avatarBtn.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.remove('open');
  }
});

/* ── Logout ──────────────────────────────────────────────────────── */
function handleLogout() {
  sessionStorage.removeItem('lr_auth');
  sessionStorage.removeItem('lr_isNew');
  window.location.replace('login.html');
}

/* ── Welcome message ─────────────────────────────────────────────── */
function buildWelcomeMessage(profile, isNew, lang) {
  const name = (profile.fullName || '').trim();
  const fname = name.split(' ')[0] || '';

  const msgs = {
    en: { back: `Welcome back, ${name}`, new: `Welcome to LeadRadar, ${name}`, noname: 'Welcome to LeadRadar', sub: "Let's find your next best leads today." },
    hi: { back: `वापसी पर स्वागत है, ${name}`, new: `LeadRadar में आपका स्वागत है, ${name}`, noname: 'LeadRadar में आपका स्वागत है', sub: 'आज आपके सर्वश्रेष्ठ लीड्स खोजते हैं।' },
    bn: { back: `আবার স্বাগতম, ${name}`, new: `LeadRadar-এ স্বাগতম, ${name}`, noname: 'LeadRadar-এ স্বাগতম', sub: 'আজ আপনার সেরা লিড খুঁজে বের করি।' },
    es: { back: `Bienvenido de nuevo, ${name}`, new: `Bienvenido a LeadRadar, ${name}`, noname: 'Bienvenido a LeadRadar', sub: 'Encontremos tus mejores clientes hoy.' },
    fr: { back: `Bon retour, ${name}`, new: `Bienvenue sur LeadRadar, ${name}`, noname: 'Bienvenue sur LeadRadar', sub: "Trouvons vos meilleurs prospects aujourd'hui." },
    de: { back: `Willkommen zurück, ${name}`, new: `Willkommen bei LeadRadar, ${name}`, noname: 'Willkommen bei LeadRadar', sub: 'Finden wir heute Ihre besten Leads.' },
    ar: { back: `مرحباً بعودتك، ${name}`, new: `مرحباً بك في LeadRadar، ${name}`, noname: 'مرحباً بك في LeadRadar', sub: 'لنجد أفضل عملائك المحتملين اليوم.' },
    pt: { back: `Bem-vindo de volta, ${name}`, new: `Bem-vindo ao LeadRadar, ${name}`, noname: 'Bem-vindo ao LeadRadar', sub: 'Vamos encontrar seus melhores leads hoje.' },
    it: { back: `Bentornato, ${name}`, new: `Benvenuto su LeadRadar, ${name}`, noname: 'Benvenuto su LeadRadar', sub: 'Troviamo i tuoi migliori lead oggi.' },
    ja: { back: `おかえりなさい、${name}`, new: `LeadRadarへようこそ、${name}`, noname: 'LeadRadarへようこそ', sub: '今日も最高のリードを見つけましょう。' },
    ko: { back: `다시 오신 것을 환영합니다, ${name}`, new: `LeadRadar에 오신 것을 환영합니다, ${name}`, noname: 'LeadRadar에 오신 것을 환영합니다', sub: '오늘도 최고의 리드를 찾아드리겠습니다.' },
    zh: { back: `欢迎回来，${name}`, new: `欢迎使用 LeadRadar，${name}`, noname: '欢迎使用 LeadRadar', sub: '今天让我们找到您最好的线索。' },
    ru: { back: `С возвращением, ${name}`, new: `Добро пожаловать в LeadRadar, ${name}`, noname: 'Добро пожаловать в LeadRadar', sub: 'Давайте найдём ваших лучших клиентов сегодня.' },
  };

  const set = msgs[lang] || msgs['en'];
  let main = name ? (isNew ? set.new : set.back) : set.noname;
  return { main, sub: set.sub };
}

/* ── Apply welcome to header ─────────────────────────────────────── */
function applyWelcomeHeader(profile, isNew, lang) {
  const { main, sub } = buildWelcomeMessage(profile, isNew, lang);
  const mainEl = document.getElementById('welcomeMain');
  const subEl  = document.getElementById('welcomeSub');
  const name = profile.fullName || '';
  if (mainEl) {
    if (name) {
      const idx = main.lastIndexOf(name);
      if (idx > -1) {
        mainEl.innerHTML = main.slice(0, idx)
          + `<span class="welcome-name">${name}</span>`
          + main.slice(idx + name.length);
      } else {
        mainEl.textContent = main;
      }
    } else {
      mainEl.textContent = main;
    }
  }
  if (subEl) subEl.textContent = sub;
}

/* ── Profile dropdown header ─────────────────────────────────────── */
function updateDropdownHeader(profile) {
  const nameEl  = document.getElementById('dropdownName');
  const emailEl = document.getElementById('dropdownEmail');
  const avatarEl = document.getElementById('avatarInitials');
  if (nameEl)  nameEl.textContent  = profile.fullName || 'User';
  if (emailEl) emailEl.textContent = profile.email    || '—';
  if (avatarEl) {
    const initials = (profile.fullName || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    avatarEl.textContent = initials;
  }
}

/* ══════════════════════════════════════════════════════════════════
   SETTINGS DRAWER LOGIC
   ══════════════════════════════════════════════════════════════════ */

function openSettingsDrawer() {
  document.getElementById('settingsDrawer')?.classList.add('open');
  document.getElementById('settingsOverlay')?.classList.add('open');
  closeProfileDropdown();
  loadSettingsValues();
}

function closeSettingsDrawer() {
  document.getElementById('settingsDrawer')?.classList.remove('open');
  document.getElementById('settingsOverlay')?.classList.remove('open');
}

function loadSettingsValues() {
  const theme   = LRPrefs.get('theme')           || 'ai-neon';
  const font    = LRPrefs.get('font')            || 'Inter';
  const lang    = LRPrefs.get('language')        || 'en';
  const country = LRPrefs.get('defaultCountry')  || 'us';
  const sbPos   = LRPrefs.get('sidebarPosition') || 'left';

  // Theme grid active state
  document.querySelectorAll('.theme-preset-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });

  // Font
  const fs = document.getElementById('fontSelect');
  if (fs) { fs.value = font; updateFontPreview(font); }

  // Language
  const ls = document.getElementById('langSelect');
  if (ls) ls.value = lang;

  // Country
  const cs = document.getElementById('countrySelect');
  if (cs) cs.value = country;

  // Sidebar
  document.getElementById('sbLeft')?.classList.toggle('active',  sbPos === 'left');
  document.getElementById('sbRight')?.classList.toggle('active', sbPos === 'right');

  // Profile fields
  const profile = LRProfile.getAll();
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  setVal('pf-name',    profile.fullName || '');
  setVal('pf-email',   profile.email    || '');
  setVal('pf-phone',   profile.phone    || '');
  setVal('pf-website', profile.website  || '');

  // Glow slider
  const gs = document.getElementById('glowSlider');
  if (gs) gs.value = parseFloat(LRPrefs.get('glowIntensity') || 1);
}

/* Build theme preset buttons */
function buildThemeGrid() {
  const grid = document.getElementById('themeGrid');
  if (!grid || !window.LRThemes) return;
  const currentTheme = LRPrefs.get('theme') || 'ai-neon';
  grid.innerHTML = Object.entries(LRThemes.themes).map(([key, t]) => `
    <button class="theme-preset-btn ${key === currentTheme ? 'active' : ''}"
            data-theme="${key}" onclick="applyThemeSetting('${key}')">
      <div class="theme-dot" style="background:linear-gradient(135deg,${t.primary},${t.secondary})"></div>
      <span>${t.name.replace('3D ', '')}</span>
    </button>
  `).join('');
}

function applyThemeSetting(key) {
  LRPrefs.set('theme', key);
  LRThemes.apply(key);
  document.querySelectorAll('.theme-preset-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === key));
  showToast(' Theme applied!');
}

function applyCustomColor(prop, val) {
  document.documentElement.style.setProperty(`--${prop}`, val);
  const custom = JSON.parse(LRPrefs.get('customColors') || '{}');
  custom[prop] = val;
  LRPrefs.set('customColors', JSON.stringify(custom));
}

function applyCustomGlow(val) {
  const hex = val.replace('#', '');
  const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
  const glow = `rgba(${r},${g},${b},0.45)`;
  document.documentElement.style.setProperty('--glow', glow);
  document.documentElement.style.setProperty('--button-shadow', `0 10px 28px ${glow}, inset 0 1px 2px rgba(255,255,255,0.3)`);
  document.getElementById('cp-glow').value = val;
}

function applyGlowIntensitySlider(val) {
  LRPrefs.set('glowIntensity', val);
  if (window.LRThemes) LRThemes.applyGlow(parseFloat(val));
}

function applyFontSetting(font) {
  LRPrefs.set('font', font);
  if (window.applyFont) applyFont(font);
  updateFontPreview(font);
  showToast(` Font set to ${font}`);
}

function updateFontPreview(font) {
  const el = document.getElementById('fontPreview');
  if (el) { el.style.fontFamily = `'${font}', sans-serif`; }
}

async function applyLanguageSetting(lang) {
  LRPrefs.set('language', lang);
  LRProfile.set('language', lang);
  if (window.LRI18n) await LRI18n.load(lang);
  const isNew = sessionStorage.getItem('lr_isNew') === 'true';
  applyWelcomeHeader(LRProfile.getAll(), isNew, lang);
  showToast(' Language updated!');
}

function applyCountrySetting(country) {
  LRPrefs.set('defaultCountry', country);
  LRProfile.set('country', country);
  // Set default country code in lead search form
  const sel = document.getElementById('countryCode');
  if (sel && sel.querySelector(`option[value="${country}"]`)) sel.value = country;
  // Suggest language
  const suggested = window.suggestLang ? suggestLang(country) : 'en';
  const ls = document.getElementById('langSelect');
  if (ls) ls.value = suggested;
  showToast(` Country set — language suggestion: ${suggested.toUpperCase()}`);
}

function applySidebarSetting(pos) {
  LRPrefs.set('sidebarPosition', pos);
  if (window.applySidebarPos) applySidebarPos(pos);
  document.getElementById('sbLeft')?.classList.toggle('active',  pos === 'left');
  document.getElementById('sbRight')?.classList.toggle('active', pos === 'right');
  showToast(` Sidebar moved to ${pos}`);
}

function saveProfile() {
  const profile = {
    fullName: document.getElementById('pf-name')?.value.trim()    || LRProfile.get('fullName'),
    email:    document.getElementById('pf-email')?.value.trim()   || LRProfile.get('email'),
    phone:    document.getElementById('pf-phone')?.value.trim()   || LRProfile.get('phone'),
    website:  document.getElementById('pf-website')?.value.trim() || LRProfile.get('website'),
    country:  LRProfile.get('country'),
    language: LRProfile.get('language'),
  };
  LRProfile.save(profile);
  updateDropdownHeader(profile);
  const lang = LRPrefs.get('language') || 'en';
  const isNew = sessionStorage.getItem('lr_isNew') === 'true';
  applyWelcomeHeader(profile, isNew, lang);
  const btn = document.getElementById('saveProfileBtn');
  if (btn) { btn.textContent = '✓ Saved!'; setTimeout(() => { if (window.LRI18n) btn.setAttribute('data-i18n', 'settings.save'); btn.textContent = 'Save Changes'; }, 1800); }
}

/* ── Companies grid — full implementation is at the bottom of this file ── */


/* ─── Config ─────────────────────────────────────────────────────── */
const ENV = (typeof window.LEADRADAR_CONFIG === 'object' && window.LEADRADAR_CONFIG) ? window.LEADRADAR_CONFIG : {};
const ENV_TOKEN   = (ENV.APIFY_API_TOKEN || '').trim();
const ENV_RESULTS = parseInt(ENV.DEFAULT_MAX_RESULTS) || 20;
const ENV_COUNTRY = (ENV.DEFAULT_COUNTRY_CODE || '').trim().toLowerCase();

/* ─── State ──────────────────────────────────────────────────────── */
let allLeads = [];
let filteredLeads = [];
let activeFilter = 'All';
let searchQuery = '';
let activeTierFilter = 'All';
let isRunning = false;

/* ─── DOM ────────────────────────────────────────────────────────── */
const configForm   = document.getElementById('configForm');
const generateBtn  = document.getElementById('generateBtn');
const btnLabel     = document.getElementById('btnLabel');
const btnIcon      = document.getElementById('btnIcon');

const emptyState   = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const resultsContent = document.getElementById('resultsContent');
const errorState   = document.getElementById('errorState');

const leadsGrid    = document.getElementById('leadsGrid');      // <tbody>
const tableHead    = document.getElementById('tableHead');      // <thead>
const filterChips  = document.getElementById('filterChips');
const searchInput  = document.getElementById('searchLeads');
const exportCSV    = document.getElementById('exportCSV');

const statusDot    = document.getElementById('statusDot');
const statusText   = document.getElementById('statusText');
const loadingTitle = document.getElementById('loadingTitle');
const loadingSubtitle = document.getElementById('loadingSubtitle');

const modalBg      = document.getElementById('modalBackdrop');
const modalContent = document.getElementById('modalContent');
const modalClose   = document.getElementById('modalClose');

const tierSelector = document.getElementById('tierSelector');
const retryBtn     = document.getElementById('retryBtn');

const searchSource = document.getElementById('searchSource');
const bizTypeLabel = document.getElementById('bizTypeLabel');
const tagsContainer = document.getElementById('tagsContainer');
const businessTypeInput = document.getElementById('businessType');

/* ─── Source Schemas ─────────────────────────────────────────────── */
const SCHEMAS = {
  linkedin: {
    label: 'Job Title / Keyword',
    placeholder: 'e.g. Founder, Marketing Manager…',
    tags: [
      { v: 'founder', l: 'Founder' }, { v: 'ceo', l: 'CEO' },
      { v: 'software engineer', l: 'Engineer' }, { v: 'sales director', l: 'Sales' },
      { v: 'marketing manager', l: 'Marketing' }, { v: 'recruiter', l: 'Recruiter' },
      { v: 'real estate broker', l: 'Real Estate' }
    ],
    headers: ['', 'Profile Name', 'Tier', 'Score', 'Headline', 'Company', 'Location', 'Insight']
  },
  google: {
    label: 'Business Type',
    placeholder: 'e.g. dentist, gym, restaurant…',
    tags: [
      { v: 'dentist', l: 'Dentist' }, { v: 'restaurant', l: 'Restaurant' },
      { v: 'gym', l: 'Gym' }, { v: 'lawyer', l: 'Lawyer' },
      { v: 'plumber', l: 'Plumber' }, { v: 'spa', l: 'Spa' },
      { v: 'accountant', l: 'Accountant' }
    ],
    headers: ['', 'Business Name', 'Tier', 'Score', 'Phone', 'Website', 'Rating', 'Insight']
  },
  jobs: {
    label: 'Job Role / Target',
    placeholder: 'e.g. Software Engineer, Marketing…',
    tags: [
      { v: 'software engineer', l: 'Engineer' }, { v: 'designer', l: 'Designer' },
      { v: 'sales', l: 'Sales' }, { v: 'marketing', l: 'Marketing' },
      { v: 'data analyst', l: 'Data Analyst' }, { v: 'product manager', l: 'Product' }
    ],
    headers: ['', 'Job Title', 'Tier', 'Score', 'Company', 'Location', 'Platform', 'Insight']
  },
  employees: {
    label: 'Candidate Role',
    placeholder: 'e.g. Frontend Developer, Designer…',
    tags: [
      { v: 'developer', l: 'Developer' }, { v: 'designer', l: 'Designer' },
      { v: 'account executive', l: 'Sales' }, { v: 'project manager', l: 'PM' }
    ],
    headers: ['', 'Candidate Name', 'Tier', 'Score', 'Headline', 'Location', 'LinkedIn', 'Insight']
  }
};

/* ─── Init ───────────────────────────────────────────────────────── */
(function init() {
  const maxInput = document.getElementById('maxResults');
  if (maxInput) maxInput.value = ENV_RESULTS;

  if (ENV_COUNTRY) {
    const sel = document.getElementById('countryCode');
    if (sel && sel.querySelector(`option[value="${ENV_COUNTRY}"]`)) sel.value = ENV_COUNTRY;
  }

  updateSourceUI('linkedin');
  showState('empty');

  /* ── Boot premium UI ─────────────────────────────────────── */
  const profile = window.LRProfile ? LRProfile.getAll() : {};
  const isNew   = sessionStorage.getItem('lr_isNew') === 'true';
  const lang    = (window.LRPrefs ? LRPrefs.get('language') : null) || profile.language || 'en';

  // Welcome message
  applyWelcomeHeader(profile, isNew, lang);
  updateDropdownHeader(profile);

  // Apply saved country to lead form
  const savedCountry = window.LRPrefs ? LRPrefs.get('defaultCountry') : null;
  if (savedCountry) {
    const cSel = document.getElementById('countryCode');
    if (cSel && cSel.querySelector(`option[value="${savedCountry}"]`)) cSel.value = savedCountry;
  }

  // Load i18n
  if (window.LRI18n) {
    LRI18n.load(lang).then(() => {
      // After i18n loaded, re-apply welcome (might have been translated)
    });
  }

  // Build theme grid in settings
  buildThemeGrid();

  // Update dashboard stats
  updateDashboard();

  // Clear isNew flag after showing
  if (isNew) sessionStorage.setItem('lr_isNew', 'false');

  // Start on leads section (or dashboard)
  showSection('dashboard-section');
})();


searchSource.addEventListener('change', (e) => {
  updateSourceUI(e.target.value);
});

function updateSourceUI(source) {
  const conf = SCHEMAS[source] || SCHEMAS.linkedin;
  bizTypeLabel.textContent = conf.label;
  businessTypeInput.placeholder = conf.placeholder;
  
  tagsContainer.innerHTML = conf.tags.map(t => 
    `<button type="button" class="tag" data-value="${t.v}">${t.l}</button>`
  ).join('');

  tagsContainer.querySelectorAll('.tag').forEach(btn => {
    btn.addEventListener('click', () => {
      businessTypeInput.value = btn.dataset.value;
    });
  });

  tableHead.innerHTML = `<tr>${conf.headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
}

/* ─── Tier selector ──────────────────────────────────────────────── */
tierSelector.querySelectorAll('.tier-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    tierSelector.querySelectorAll('.tier-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTierFilter = btn.dataset.tier;
  });
});

/* ─── Filter pills ───────────────────────────────────────────────── */
filterChips.querySelectorAll('.fpill').forEach(chip => {
  chip.addEventListener('click', () => {
    filterChips.querySelectorAll('.fpill').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    applyFilters();
  });
});

/* ─── Search ─────────────────────────────────────────────────────── */
searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.toLowerCase().trim();
  applyFilters();
});

/* ─── Export CSV ─────────────────────────────────────────────────── */
exportCSV.addEventListener('click', () => {
  if (!filteredLeads.length) { showToast('No leads to export.'); return; }
  const source = searchSource.value;
  let headers = [];
  let rows = [];

  if (source === 'google') {
    headers = ['Business Name','Phone','Website','Address','Rating','Score','Tier','Maps URL','AI Insight'];
    rows = filteredLeads.map(l => [csv(l.name), csv(l.phone), csv(l.website), csv(l.address), l.rating||'', l.score, l.tier, csv(l.mapsUrl), csv(l.insight)]);
  } else if (source === 'linkedin') {
    headers = ['Profile Name','Headline','Company','Location','LinkedIn URL','Score','Tier','AI Insight'];
    rows = filteredLeads.map(l => [csv(l.name), csv(l.headline), csv(l.company), csv(l.location), csv(l.url), l.score, l.tier, csv(l.insight)]);
  } else if (source === 'jobs') {
    headers = ['Job Title','Company','Location','Platform URL','Score','Tier','AI Insight'];
    rows = filteredLeads.map(l => [csv(l.name), csv(l.company), csv(l.location), csv(l.url), l.score, l.tier, csv(l.insight)]);
  } else if (source === 'employees') {
    headers = ['Candidate Name','Headline','Location','LinkedIn URL','Score','Tier','AI Insight'];
    rows = filteredLeads.map(l => [csv(l.name), csv(l.headline), csv(l.location), csv(l.url), l.score, l.tier, csv(l.insight)]);
  }

  const blob = new Blob([[headers, ...rows].map(r => r.join(',')).join('\n')], { type: 'text/csv' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `leads_${source}_${Date.now()}.csv` });
  a.click();
  URL.revokeObjectURL(a.href);
  showToast(` Exported ${filteredLeads.length} leads`);
});


function csv(v) {
  if (!v) return '';
  const s = String(v).replace(/"/g, '""');
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
}

/* ─── Modal ──────────────────────────────────────────────────────── */
modalClose.addEventListener('click', () => modalBg.classList.add('hidden'));
modalBg.addEventListener('click', e => { if (e.target === modalBg) modalBg.classList.add('hidden'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') modalBg.classList.add('hidden'); });

function openModal(lead) {
  const source = searchSource.value;
  const c = lead.tier === 'Hot' ? '#f87171' : lead.tier === 'Warm' ? '#fbbf24' : '#60a5fa';
  let detailsHtml = '';

  if (source === 'google') {
    detailsHtml = `
      <div class="m-sub">${esc(lead.category || '')} · ${esc(lead.city || '')}</div>
      <div class="m-score-box">
        <div class="m-score-row"><span class="m-score-label">Lead Score</span><span class="m-score-val" style="color:${c}">${lead.score}/100</span></div>
        <div class="score-track" style="height:5px"><div class="score-fill sf-${lead.tier.toLowerCase()}" style="width:${lead.score}%"></div></div>
        <div style="margin-top:10px"><span class="tier-badge tb-${lead.tier.toLowerCase()}">${tierEmoji(lead.tier)} ${lead.tier}</span>
        ${lead.rating ? `<span style="color:#fbbf24;font-size:0.8rem;margin-left:8px">${renderStars(lead.rating)} ${lead.rating}</span>` : ''}</div>
      </div>
      <div class="m-section">
        <div class="m-section-title">Contact & Location</div>
        ${lead.phone ? `<div class="m-row"><span class="m-row-label">Phone</span><span class="m-row-value"><a href="tel:${esc(lead.phone)}">${esc(lead.phone)}</a></span></div>` : ''}
        ${lead.website ? `<div class="m-row"><span class="m-row-label">Website</span><span class="m-row-value"><a href="${esc(lead.website)}" target="_blank">${esc(lead.website)}</a></span></div>` : ''}
        ${lead.address ? `<div class="m-row"><span class="m-row-label">Address</span><span class="m-row-value">${esc(lead.address)}</span></div>` : ''}
        ${lead.mapsUrl ? `<div class="m-row"><span class="m-row-label">Maps</span><span class="m-row-value"><a href="${esc(lead.mapsUrl)}" target="_blank">View on Google Maps </a></span></div>` : ''}
      </div>
    `;
  } else {
    detailsHtml = `
      <div class="m-sub">${esc(lead.headline || '')} · ${esc(lead.company || '')}</div>
      <div class="m-score-box">
        <div class="m-score-row"><span class="m-score-label">Lead Score</span><span class="m-score-val" style="color:${c}">${lead.score}/100</span></div>
        <div class="score-track" style="height:5px"><div class="score-fill sf-${lead.tier.toLowerCase()}" style="width:${lead.score}%"></div></div>
        <div style="margin-top:10px"><span class="tier-badge tb-${lead.tier.toLowerCase()}">${tierEmoji(lead.tier)} ${lead.tier}</span></div>
      </div>
      <div class="m-section">
        <div class="m-section-title">Profile Info</div>
        ${lead.company ? `<div class="m-row"><span class="m-row-label">Company</span><span class="m-row-value">${esc(lead.company)}</span></div>` : ''}
        ${lead.location ? `<div class="m-row"><span class="m-row-label">Location</span><span class="m-row-value">${esc(lead.location)}</span></div>` : ''}
        ${lead.url ? `<div class="m-row"><span class="m-row-label">Link</span><span class="m-row-value"><a href="${esc(lead.url)}" target="_blank" rel="noopener">View Profile </a></span></div>` : ''}
      </div>
    `;
  }

  modalContent.innerHTML = `
    <div class="m-name">${esc(lead.name)}</div>
    ${detailsHtml}
    <div class="m-insight">
      <div class="m-insight-label"> AI Insight</div>
      ${esc(lead.insight)}
    </div>
  `;
  modalBg.classList.remove('hidden');
}

/* ─── Retry ──────────────────────────────────────────────────────── */
retryBtn.addEventListener('click', () => showState('empty'));

/* ─── Form submit ────────────────────────────────────────────────── */
configForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (isRunning) return;

  const token        = ENV_TOKEN;
  const businessType = businessTypeInput.value.trim();
  const location     = document.getElementById('location').value.trim();
  const maxResults   = parseInt(document.getElementById('maxResults').value) || ENV_RESULTS;
  const countryCode  = document.getElementById('countryCode').value.toLowerCase();
  const source       = searchSource.value;

  if (!token) { showToast('️ No API token found. Please add it to your backend config.'); return; }
  if (!businessType || !location) { showToast('️ Enter keyword and Location.'); return; }

  await runScraper({ token, businessType, location, maxResults, countryCode, tierFilter: activeTierFilter, source });
});

/* ─── Load Leads from Backend ──────────────────────────────────────── */
async function loadLeadsFromBackend() {
  const token = sessionStorage.getItem('lr_auth_token');
  if (!token) return;

  try {
    const res = await fetch('/api/leads', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch leads');
    
    const leads = await res.json();
    
    allLeads = leads;
    filteredLeads = leads;
    
    // Convert backend leads to frontend format
    // backend: { id, name, email, company, linkedin, source, score, tier, insight }
    // We will just render them
    
    if (leads.length > 0) {
      showState('results');
      document.getElementById('totalCount').textContent = leads.length;
      
      // Update UI stats manually or call existing methods
      const hot = leads.filter(l => l.tier === 'Hot').length;
      const warm = leads.filter(l => l.tier === 'Warm').length;
      const cold = leads.filter(l => l.tier === 'Cold').length;
      
      document.getElementById('hotCount').textContent = hot;
      document.getElementById('warmCount').textContent = warm;
      document.getElementById('coldCount').textContent = cold;
      
      _dashStats.total = leads.length;
      _dashStats.hot = hot;
      _dashStats.warm = warm;
      _dashStats.cold = cold;
      saveDashStats();
      updateDashboard();
      
      updateCompaniesGrid(leads);
      
      renderTable(leads);
    } else {
      showState('empty');
    }
  } catch (err) {
    console.error(err);
  }
}

/* ─── Scraper ────────────────────────────────────────────────────── */
async function runScraper({ token, businessType, location, maxResults, countryCode, tierFilter, source }) {
  isRunning = true;
  allLeads = []; filteredLeads = [];
  showState('loading');
  setStatus('loading', 'Scanning…');
  generateBtn.disabled = true;
  btnIcon.style.animation = 'spin 0.8s linear infinite';
  btnLabel.textContent = 'Scanning…';

  try {
    updateLoading('Running LeadRadar AI...', 'Executing Apify scraper in the backend...');
    
    const authToken = localStorage.getItem('token');
    if (!authToken) throw new Error('You must be logged in to generate leads.');

    const response = await fetch('/api/leads/apify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        businessType,
        location,
        maxResults,
        countryCode,
        source
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to generate leads');
    }

    const data = await response.json();
    
    let leads = data.leads || [];
    leads = leads.map(l => ({ ...l, tier: 'Warm', url: l.website || l.linkedin || '' }));

    if (tierFilter !== 'All') leads = leads.filter(l => l.tier === tierFilter);

    if (leads.length > 0) {
      allLeads = leads;
      filteredLeads = leads;
      
      showState('results');
      setStatus('success', `Scanning (${leads.length} found)`);

      const hot  = leads.filter(l => l.tier === 'Hot').length;
      const warm = leads.filter(l => l.tier === 'Warm').length;
      const cold = leads.filter(l => l.tier === 'Cold').length;
      
      let stat5 = leads.filter(l => l.phone).length;
      let stat6 = leads.filter(l => l.url).length;
      document.querySelector('#phoneCount').nextElementSibling.textContent = 'Phones';
      document.querySelector('#webCount').nextElementSibling.textContent = 'Websites';

      document.getElementById('totalCount').textContent = leads.length;
      document.getElementById('hotCount').textContent = hot;
      document.getElementById('warmCount').textContent = warm;
      document.getElementById('coldCount').textContent = cold;
      document.getElementById('phoneCount').textContent = stat5;
      document.getElementById('webCount').textContent = stat6;

      renderTable(leads);

      // Update dashboard stats
      _dashStats.total     += leads.length;
      _dashStats.hot       += hot;
      _dashStats.warm      += warm;
      _dashStats.cold      += cold;
      _dashStats.today     += leads.length;
      _dashStats.searches  += 1;
      saveDashStats();
      updateDashboard();

      updateCompaniesGrid(leads);
      showSection('leads-section');
    } else {
      throw new Error('No leads found.');
    }

  } catch (err) {
    console.error(err);
    showState('error');
    document.getElementById('errorMessage').textContent = err.message;
    setStatus('error', 'Error');
  } finally {
    isRunning = false;
    generateBtn.disabled = false;
    btnIcon.style.animation = '';
    btnLabel.textContent = 'Generate Leads';
  }
}

/* ─── Lead builders ──────────────────────────────────────────────── */

function buildGoogleLead(item, businessType, searchLocation) {
  const name       = item.title || item.name || 'Unknown Business';
  const phone      = item.phone || item.phoneUnformatted || '';
  const website    = item.website || '';
  const address    = item.address || item.formattedAddress || '';
  const rating     = parseFloat(item.totalScore || item.rating) || null;
  const reviewCount = parseInt(item.reviewsCount || item.userRatingsTotal) || 0;
  const category   = item.categoryName || item.categories?.[0] || businessType;
  const city       = item.city || searchLocation;
  const mapsUrl    = item.url || item.googleMapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(name + ' ' + address)}`;

  let score = 0;
  if (rating !== null) score += rating >= 4.5 ? 30 : rating >= 4 ? 22 : rating >= 3.5 ? 14 : rating >= 3 ? 8 : 3;
  else score += 10;
  if (reviewCount > 500) score += 20; else if (reviewCount > 200) score += 16;
  else if (reviewCount > 100) score += 12; else if (reviewCount > 50) score += 8;
  if (phone) score += 15;
  if (website) score += 15;
  if ((category || '').toLowerCase().includes(businessType.toLowerCase())) score += 10;
  if (address && address.length > 20) score += 10; else if (address) score += 5;
  score = Math.min(100, Math.max(1, score));

  const tier = score >= 70 ? 'Hot' : score >= 40 ? 'Warm' : 'Cold';
  const insight = genInsight('google', name, tier, businessType, category);

  return { name, phone, website, address, rating, reviewCount, category, city, mapsUrl, score, tier, insight, businessType };
}

function isValidLinkedInProfile(url, name, source) {
  if (!url) return false;

  // For LinkedIn profiles: URL must be a real /in/ profile
  if (source === 'linkedin' || source === 'employees') {
    if (!url.includes('linkedin.com/in/')) return false;
    // Reject generic/navigation pages
    if (/linkedin\.com\/in\/(login|signup|feed|mynetwork|jobs|messaging|notifications|search|pub|dir)/.test(url)) return false;
  }

  // For jobs: URL must be a jobs/view or jobs listing page
  if (source === 'jobs') {
    if (!url.includes('linkedin.com/jobs')) return false;
  }

  // Reject generic titles that are not real people
  const badNames = ['LinkedIn', 'Sign in', 'Sign In', 'Log in', 'Join', 'People', 'Search', 'Profile'];
  if (!name || name.length < 3 || badNames.some(b => name.toLowerCase().includes(b.toLowerCase()))) return false;

  // Name must look like a real person (at least 2 characters, no generic words)
  const nameWords = name.trim().split(' ');
  if (source !== 'jobs' && nameWords.length < 1) return false;

  return true;
}

function buildSearchLead(item, keyword, searchLocation, source) {
  const rawTitle = (item.title || '').trim();
  const url = item.url || '';
  const description = item.description || item.snippet || '';

  // Parse title into parts — LinkedIn titles are typically: "Name - Headline - Company | LinkedIn"
  let cleanTitle = rawTitle.replace(/\s*\|\s*LinkedIn\s*/gi, '').replace(/\s*-\s*LinkedIn\s*/gi, '');
  let titleParts = cleanTitle.split(/\s+-\s+/);

  let name = (titleParts[0] || '').trim();
  let headline = (titleParts[1] || '').trim();
  let company = (titleParts[2] || '').trim();

  // Jobs source: title format is usually "Job Title | Company | LinkedIn"
  if (source === 'jobs') {
    const jobParts = rawTitle.replace(/\s*\|\s*LinkedIn\s*/gi, '').split('|');
    name = (jobParts[0] || '').trim();
    company = (jobParts[1] || '').trim();
    headline = '';
  }

  // Try extracting company from description if missing
  if (!company && description) {
    const compMatch = description.match(/(?:at|@)\s+([A-Z][\w\s&.,'-]{2,40})/i);
    if (compMatch) company = compMatch[1].trim();
  }

  // Try extracting location from description if missing
  let location = searchLocation;
  if (description) {
    const locMatch = description.match(/(?:Based in|Location:|Located in|\u00b7\s*)([A-Z][\w\s,]+(?:Area|City|Region)?)/i);
    if (locMatch) location = locMatch[1].trim();
  }

  // ── VALIDATION ──────────────────────────────────────────────────────
  if (!isValidLinkedInProfile(url, name, source)) return null;
  // ────────────────────────────────────────────────────────────────────

  // ── SCORING ─────────────────────────────────────────────────────────
  let score = 30; // base score for passing validation

  // Profile completeness checks
  if (name && name.length > 3)    score += 10; // has a real name
  if (headline)                   score += 15; // has a headline
  if (company)                    score += 15; // has a company
  if (description && description.length > 60) score += 10; // rich description

  // Keyword relevance
  const kw = keyword.toLowerCase();
  if (headline.toLowerCase().includes(kw)) score += 15; // exact headline match
  else if (name.toLowerCase().includes(kw)) score += 8;
  else if (description.toLowerCase().includes(kw)) score += 5;

  // URL quality check — short vanity URLs are more likely real, full profiles
  const urlPath = url.split('/in/')?.[1] || '';
  if (urlPath && !/\d{8,}/.test(urlPath)) score += 5; // not a numeric ID = more likely genuine

  score = Math.min(100, Math.max(1, score));
  // ────────────────────────────────────────────────────────────────────

  const tier = score >= 70 ? 'Hot' : score >= 45 ? 'Warm' : 'Cold';
  const insight = genInsight(source, name, tier, keyword, company);

  return { name, headline, company, location, url, score, tier, insight, keyword };
}

/* ─── Insight generator ──────────────────────────────────────────── */
function genInsight(source, name, tier, keyword, company) {
  const fname = name.split(' ')[0];
  const pool = {
    google: {
      Hot: [`Strong ratings and solid customer engagement.`, `Established presence with proven traction.`],
      Warm: [`Growing but has gaps — your solution could accelerate them.`, `Moderate engagement — personalized outreach.`],
      Cold: [`Limited online presence — likely early-stage.`, `Cold prospect — build rapport before making a direct pitch.`]
    },
    linkedin: {
      Hot: [`${fname}'s headline perfectly matches "${keyword}". High-priority!`, `Great prospect. Highly relevant.`],
      Warm: [`${fname} is somewhat relevant to "${keyword}".`, `Mid-tier prospect. Check recent activity.`],
      Cold: [`Keyword match might be weak.`, `Low relevance. Nurture or deprioritize.`]
    },
    jobs: {
      Hot: [`Actively hiring for "${keyword}". Direct need identified!`, `Urgent role open at this company.`],
      Warm: [`Hiring, but might be competitive.`, `Good opportunity to pitch services related to "${keyword}".`],
      Cold: [`Job post might be old or broad.`, `Low relevance.`]
    },
    employees: {
      Hot: [`Actively open to work for "${keyword}". Reach out immediately!`, `Strong candidate available right now.`],
      Warm: [`Potentially open to new opportunities.`, `Good background for "${keyword}".`],
      Cold: [`Might not be actively looking.`, `Profile lacks details.`]
    }
  };
  const arr = pool[source]?.[tier] || pool.linkedin[tier];
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ─── Render results ─────────────────────────────────────────────── */
function renderResults(leads, businessType, location) {
  setStatus('success', `${leads.length} results`);
  showState('results');

  const hot   = leads.filter(l => l.tier === 'Hot').length;
  const warm  = leads.filter(l => l.tier === 'Warm').length;
  const cold  = leads.filter(l => l.tier === 'Cold').length;
  const source = searchSource.value;
  
  // Custom stats based on source
  let stat5 = 0, stat6 = 0;
  if (source === 'google') {
    stat5 = leads.filter(l => l.phone).length;
    stat6 = leads.filter(l => l.website).length;
    document.querySelector('#phoneCount').nextElementSibling.textContent = ' Phones';
    document.querySelector('#webCount').nextElementSibling.textContent = ' Websites';
  } else {
    stat5 = leads.filter(l => l.company).length;
    stat6 = leads.filter(l => l.url).length;
    document.querySelector('#phoneCount').nextElementSibling.textContent = ' Companies';
    document.querySelector('#webCount').nextElementSibling.textContent = ' Links';
  }

  countTo('totalCount', leads.length);
  countTo('hotCount',   hot);
  countTo('warmCount',  warm);
  countTo('coldCount',  cold);
  countTo('phoneCount', stat5);
  countTo('webCount',   stat6);

  filteredLeads = leads;
  activeFilter = 'All';
  searchQuery = '';
  searchInput.value = '';
  filterChips.querySelectorAll('.fpill').forEach((c,i) => c.classList.toggle('active', i===0));

  renderTable(leads);
}

function applyFilters() {
  let res = allLeads;
  if (activeFilter !== 'All') res = res.filter(l => l.tier === activeFilter);
  if (searchQuery) res = res.filter(l =>
    (l.name||'').toLowerCase().includes(searchQuery) ||
    (l.headline||'').toLowerCase().includes(searchQuery) ||
    (l.company||'').toLowerCase().includes(searchQuery) ||
    (l.location||'').toLowerCase().includes(searchQuery) ||
    (l.category||'').toLowerCase().includes(searchQuery)
  );
  filteredLeads = res;
  renderTable(res);
  const noRes = document.getElementById('noFilterResults');
  if (noRes) noRes.classList.toggle('hidden', res.length > 0);
}

function renderTable(leads) {
  leadsGrid.innerHTML = '';
  const source = searchSource.value;

  leads.forEach((lead, idx) => {
    const tr = document.createElement('tr');
    tr.style.animationDelay = `${Math.min(idx * 0.03, 0.5)}s`;

    let cellsHtml = '';
    const scoreCell = `
      <td>
        <div class="score-cell">
          <div class="score-track"><div class="score-fill sf-${lead.tier.toLowerCase()}" style="width:0%" data-target="${lead.score}"></div></div>
          <span class="score-num">${lead.score}</span>
        </div>
      </td>`;

    if (source === 'google') {
      cellsHtml = `
        <td style="width: 40px; text-align: center;"><input type="checkbox" class="lead-cb" data-id="${lead.id}" /></td>
        <td><div class="td-name" title="${esc(lead.name)}">${esc(lead.name)}</div></td>
        <td><span class="tier-badge tb-${lead.tier.toLowerCase()}">${tierEmoji(lead.tier)} ${lead.tier}</span></td>
        ${scoreCell}
        <td class="td-phone">${lead.phone ? `<a href="tel:${esc(lead.phone)}" onclick="event.stopPropagation()">${esc(lead.phone)}</a>` : '—'}</td>
        <td>${lead.website ? `<a href="${esc(lead.website)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${esc(lead.website.replace(/^https?:\/\//, ''))}</a>` : '—'}</td>
        <td class="rating-cell">${lead.rating ? `${renderStars(lead.rating)} ${lead.rating}` : '—'}</td>
        <td><div class="td-insight" title="${esc(lead.insight)}">${esc(lead.insight)}</div></td>
      `;
    } else if (source === 'linkedin') {
      cellsHtml = `
        <td style="width: 40px; text-align: center;"><input type="checkbox" class="lead-cb" data-id="${lead.id}" /></td>
        <td><div class="td-name" title="${esc(lead.name)}">${esc(lead.name)}</div></td>
        <td><span class="tier-badge tb-${lead.tier.toLowerCase()}">${tierEmoji(lead.tier)} ${lead.tier}</span></td>
        ${scoreCell}
        <td><div class="td-addr" title="${esc(lead.headline)}">${esc(lead.headline) || '—'}</div></td>
        <td><div class="td-addr" title="${esc(lead.company)}">${esc(lead.company) || '—'}</div></td>
        <td><div class="td-addr" title="${esc(lead.location)}">${esc(lead.location) || '—'}</div></td>
        <td><div class="td-insight" title="${esc(lead.insight)}">${esc(lead.insight)}</div></td>
      `;
    } else if (source === 'jobs') {
      cellsHtml = `
        <td style="width: 40px; text-align: center;"><input type="checkbox" class="lead-cb" data-id="${lead.id}" /></td>
        <td><div class="td-name" title="${esc(lead.name)}">${esc(lead.name)}</div></td>
        <td><span class="tier-badge tb-${lead.tier.toLowerCase()}">${tierEmoji(lead.tier)} ${lead.tier}</span></td>
        ${scoreCell}
        <td><div class="td-addr" title="${esc(lead.company)}">${esc(lead.company) || '—'}</div></td>
        <td><div class="td-addr" title="${esc(lead.location)}">${esc(lead.location) || '—'}</div></td>
        <td>${lead.url ? `<a href="${esc(lead.url)}" target="_blank" onclick="event.stopPropagation()">View Job</a>` : '—'}</td>
        <td><div class="td-insight" title="${esc(lead.insight)}">${esc(lead.insight)}</div></td>
      `;
    } else if (source === 'employees') {
      cellsHtml = `
        <td style="width: 40px; text-align: center;"><input type="checkbox" class="lead-cb" data-id="${lead.id}" /></td>
        <td><div class="td-name" title="${esc(lead.name)}">${esc(lead.name)}</div></td>
        <td><span class="tier-badge tb-${lead.tier.toLowerCase()}">${tierEmoji(lead.tier)} ${lead.tier}</span></td>
        ${scoreCell}
        <td><div class="td-addr" title="${esc(lead.headline)}">${esc(lead.headline) || '—'}</div></td>
        <td><div class="td-addr" title="${esc(lead.location)}">${esc(lead.location) || '—'}</div></td>
        <td>${lead.url ? `<a href="${esc(lead.url)}" target="_blank" onclick="event.stopPropagation()">View Profile</a>` : '—'}</td>
        <td><div class="td-insight" title="${esc(lead.insight)}">${esc(lead.insight)}</div></td>
      `;
    }

    tr.innerHTML = cellsHtml;
    tr.addEventListener('click', () => openModal(lead));
    leadsGrid.appendChild(tr);

    requestAnimationFrame(() => {
      const bar = tr.querySelector('.score-fill');
      if (bar) setTimeout(() => { bar.style.width = bar.dataset.target + '%'; }, 80 + idx * 25);
    });
  });
}

/* ─── Utilities ──────────────────────────────────────────────────── */
function showState(state) {
  emptyState.classList.add('hidden');
  loadingState.classList.add('hidden');
  resultsContent.classList.add('hidden');
  errorState.classList.add('hidden');
  if (state === 'empty')   emptyState.classList.remove('hidden');
  if (state === 'loading') { loadingState.classList.remove('hidden'); updateLoading(`Scanning ${searchSource.value === 'google' ? 'Google' : 'LinkedIn'}…`, 'This may take 30–90 seconds.'); }
  if (state === 'results') resultsContent.classList.remove('hidden');
  if (state === 'error')   errorState.classList.remove('hidden');
}

function updateLoading(title, sub) {
  if (loadingTitle) loadingTitle.textContent = title;
  if (loadingSubtitle) loadingSubtitle.textContent = sub;
}


function setStatus(type, text) {
  statusDot.className = `status-dot ${type}`;
  statusText.textContent = text;
}

function renderStars(r) {
  if (!r) return '';
  return ''.repeat(Math.floor(r)) + (r % 1 >= 0.5 ? '½' : '');
}

function tierEmoji(t) { return t === 'Hot' ? '' : t === 'Warm' ? '️' : '️'; }

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function countTo(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = performance.now();
  const dur = 700;
  (function step(now) {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1-p, 3)));
    if (p < 1) requestAnimationFrame(step);
  })(start);
}

let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 3000);
}

// Spin keyframe
document.head.insertAdjacentHTML('beforeend', '<style>@keyframes spin{to{transform:rotate(360deg)}}</style>');

/* ════════════════════════════════════════════════════════════════════
   ANALYTICS MODULE
   ════════════════════════════════════════════════════════════════════ */

const AN_KEY = 'lr_sessions';

function saveSession(leads, businessType, location, source) {
  const sessions = JSON.parse(localStorage.getItem(AN_KEY) || '[]');
  const hot  = leads.filter(l => l.tier === 'Hot').length;
  const warm = leads.filter(l => l.tier === 'Warm').length;
  const cold = leads.filter(l => l.tier === 'Cold').length;
  const avgScore = leads.length ? Math.round(leads.reduce((a,l)=>a+l.score,0)/leads.length) : 0;
  sessions.unshift({
    date: new Date().toISOString(),
    keyword: businessType,
    location, source,
    total: leads.length, hot, warm, cold, avgScore
  });
  // Keep last 50
  localStorage.setItem(AN_KEY, JSON.stringify(sessions.slice(0, 50)));
}

function renderAnalytics() {
  const stats = JSON.parse(localStorage.getItem('lr_dashStats') || '{"total":0,"hot":0,"warm":0,"cold":0,"today":0,"searches":0}');
  const sessions = JSON.parse(localStorage.getItem(AN_KEY) || '[]');

  // KPI cards
  const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setEl('an-total', stats.total || '—');
  setEl('an-rate', stats.total ? Math.round((stats.hot / stats.total) * 100) + '%' : '—');
  setEl('an-hot', stats.hot || '—');
  setEl('an-searches', stats.searches || '—');

  // Tier distribution bar chart
  const tierChart = document.getElementById('an-tier-chart');
  if (tierChart) {
    const total = stats.total || 1;
    const tiers = [
      { label: 'Hot',  count: stats.hot  || 0, color: 'var(--hot)',  cls: 'sf-hot' },
      { label: 'Warm', count: stats.warm || 0, color: 'var(--warm)', cls: 'sf-warm' },
      { label: 'Cold', count: stats.cold || 0, color: 'var(--cold)', cls: 'sf-cold' }
    ];
    tierChart.innerHTML = tiers.map(t => {
      const pct = Math.round((t.count / total) * 100);
      return `
        <div style="display:flex;flex-direction:column;gap:4px;">
          <div style="display:flex;justify-content:space-between;font-size:0.78rem;">
            <span style="color:var(--text);font-weight:600;">${t.label}</span>
            <span style="color:var(--muted);">${t.count} (${pct}%)</span>
          </div>
          <div style="background:var(--border);border-radius:4px;height:8px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${t.color};border-radius:4px;transition:width 0.8s ease;"></div>
          </div>
        </div>`;
    }).join('');
    if (!stats.total) tierChart.innerHTML = '<div style="color:var(--muted);font-size:0.8rem;text-align:center;padding:12px;">Generate leads to see analytics.</div>';
  }

  // Score distribution
  const scoreChart = document.getElementById('an-score-chart');
  if (scoreChart && sessions.length) {
    const avgScores = {
      google: [], linkedin: [], jobs: [], employees: []
    };
    sessions.forEach(s => {
      if (avgScores[s.source]) avgScores[s.source].push(s.avgScore);
    });
    const sources = [
      { key: 'google',    label: 'Google',   color: '#4F7CFF' },
      { key: 'linkedin',  label: 'LinkedIn', color: '#7C5CFF' },
      { key: 'jobs',      label: 'Jobs',     color: '#F59E0B' },
      { key: 'employees', label: 'Employees',color: '#10D98A' }
    ];
    const maxAvg = 100;
    scoreChart.innerHTML = sources.filter(s => avgScores[s.key].length).map(s => {
      const avg = Math.round(avgScores[s.key].reduce((a,v)=>a+v,0) / avgScores[s.key].length);
      const pct = Math.round((avg / maxAvg) * 100);
      return `
        <div style="display:flex;flex-direction:column;gap:4px;">
          <div style="display:flex;justify-content:space-between;font-size:0.78rem;">
            <span style="color:var(--text);font-weight:600;">${s.label}</span>
            <span style="color:var(--muted);">Avg Score: ${avg}</span>
          </div>
          <div style="background:var(--border);border-radius:4px;height:8px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${s.color};border-radius:4px;transition:width 0.8s ease;"></div>
          </div>
        </div>`;
    }).join('') || '<div style="color:var(--muted);font-size:0.8rem;text-align:center;padding:12px;">No session data yet.</div>';
  } else if (scoreChart) {
    scoreChart.innerHTML = '<div style="color:var(--muted);font-size:0.8rem;text-align:center;padding:12px;">No session data yet.</div>';
  }

  // Session history table
  const sessEl = document.getElementById('an-sessions');
  if (sessEl) {
    if (!sessions.length) {
      sessEl.innerHTML = '<div style="color:var(--muted);font-size:0.8rem;text-align:center;padding:12px;">No sessions recorded yet.</div>';
    } else {
      sessEl.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr 80px 60px 60px 60px 60px;gap:0;font-size:0.68rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;padding:8px 12px;border-bottom:1px solid var(--border);">
          <span>Keyword</span><span>Location</span><span>Source</span><span>Total</span><span>Hot</span><span>Warm</span><span>Avg</span>
        </div>
        ${sessions.slice(0, 20).map(s => `
          <div style="display:grid;grid-template-columns:1fr 1fr 80px 60px 60px 60px 60px;gap:0;font-size:0.8rem;padding:10px 12px;border-bottom:1px solid var(--border);transition:background 0.15s;" onmouseover="this.style.background='rgba(79,124,255,0.04)'" onmouseout="this.style.background=''">
            <span style="color:var(--text);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(s.keyword)}</span>
            <span style="color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(s.location)}</span>
            <span style="color:var(--muted);">${s.source || '—'}</span>
            <span style="color:var(--text);font-weight:600;">${s.total}</span>
            <span style="color:var(--hot);font-weight:600;">${s.hot}</span>
            <span style="color:var(--warm);font-weight:600;">${s.warm}</span>
            <span style="color:var(--primary);font-weight:600;">${s.avgScore}</span>
          </div>`).join('')}
      `;
    }
  }
}

function exportAnalyticsCSV() {
  const sessions = JSON.parse(localStorage.getItem(AN_KEY) || '[]');
  if (!sessions.length) { showToast('No session data to export.'); return; }
  const headers = ['Date','Keyword','Location','Source','Total','Hot','Warm','Cold','Avg Score'];
  const rows = sessions.map(s => [
    new Date(s.date).toLocaleDateString(), csv(s.keyword), csv(s.location), s.source,
    s.total, s.hot, s.warm, s.cold, s.avgScore
  ]);
  const blob = new Blob([[headers, ...rows].map(r => r.join(',')).join('\n')], { type: 'text/csv' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `analytics_${Date.now()}.csv` });
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Analytics exported!');
}

/* ════════════════════════════════════════════════════════════════════
   MESSAGES MODULE
   ════════════════════════════════════════════════════════════════════ */

const SENT_KEY = 'lr_sent_messages';
let _msgLeads = [];
let _selectedLead = null;
let _selectedTemplate = 'email';

function initMessagesModule() {
  // Load all leads from last session (allLeads in memory)
  _msgLeads = allLeads.length ? allLeads : [];
  renderMsgLeadsList(_msgLeads);
  renderSentLog();
}

function renderMsgLeadsList(leads) {
  const container = document.getElementById('msg-leads-list');
  if (!container) return;
  if (!leads.length) {
    container.innerHTML = '<div style="color:var(--muted);font-size:0.8rem;text-align:center;padding:16px;">Generate leads first to start outreach.</div>';
    return;
  }
  container.innerHTML = leads.slice(0, 100).map((l, i) => `
    <button onclick="selectMsgLead(${i})" style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;border:1px solid transparent;background:transparent;color:var(--text);font-family:inherit;font-size:0.8rem;cursor:pointer;text-align:left;width:100%;transition:all 0.15s;" id="msg-lead-${i}"
      onmouseover="this.style.background='rgba(79,124,255,0.06)'" onmouseout="this.style.background=_selectedLead===leads[${i}]?'rgba(79,124,255,0.1)':''">
      <span class="tier-badge tb-${(l.tier||'cold').toLowerCase()}" style="flex-shrink:0;min-width:36px;text-align:center;">${l.tier}</span>
      <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500;">${esc(l.name)}</span>
    </button>
  `).join('');
}

function filterMsgLeads(query) {
  if (!query.trim()) { renderMsgLeadsList(_msgLeads); return; }
  const q = query.toLowerCase();
  renderMsgLeadsList(_msgLeads.filter(l =>
    (l.name||'').toLowerCase().includes(q) ||
    (l.company||'').toLowerCase().includes(q) ||
    (l.headline||'').toLowerCase().includes(q)
  ));
}

function selectMsgLead(idx) {
  _selectedLead = _msgLeads[idx];
  document.querySelectorAll('[id^="msg-lead-"]').forEach(b => b.style.background = '');
  const btn = document.getElementById(`msg-lead-${idx}`);
  if (btn) btn.style.background = 'rgba(79,124,255,0.1)';
  const toEl = document.getElementById('msg-to');
  if (toEl) toEl.innerHTML = `To: <span style="color:var(--text);font-weight:600;">${esc(_selectedLead.name)}${_selectedLead.company ? ' · ' + esc(_selectedLead.company) : ''}</span>`;
  generateMessageTemplate();
}

function selectTemplate(type) {
  _selectedTemplate = type;
  ['email','linkedin','followup'].forEach(t => {
    const btn = document.getElementById(`tmpl-${t}`);
    if (btn) btn.classList.toggle('active', t === type);
  });
  const subWrap = document.getElementById('msg-subject-wrap');
  if (subWrap) subWrap.style.display = type === 'linkedin' ? 'none' : '';
  generateMessageTemplate();
}

function generateMessageTemplate() {
  if (!_selectedLead) return;
  const lead = _selectedLead;
  const fname = (lead.name || '').split(' ')[0];
  const company = lead.company || lead.category || 'your company';
  const subject = document.getElementById('msg-subject');
  const body = document.getElementById('msg-body');

  const yourName = (window.LRProfile ? LRProfile.get('fullName') : '') || 'Your Name';
  const yourTitle = (window.LRProfile ? LRProfile.get('website') : '') || 'your company';

  if (_selectedTemplate === 'email') {
    if (subject) subject.value = `Quick question about ${company}`;
    if (body) body.value =
`Hi ${fname},

I came across your profile and was impressed by what you're doing at ${company}.

I work with businesses like yours to help them [solve specific problem / unlock specific opportunity]. Based on your profile, I believe there's a strong fit.

Would you be open to a quick 15-minute call this week to explore if this could be a match?

Best regards,
${yourName}`;

  } else if (_selectedTemplate === 'linkedin') {
    if (subject) subject.value = '';
    if (body) body.value =
`Hi ${fname},

I noticed your work at ${company} and found it really impressive — especially [mention something specific].

I help [target audience] with [your solution]. Thought this could be relevant for you.

Would love to connect and share ideas. Happy to keep it brief!

— ${yourName}`;

  } else if (_selectedTemplate === 'followup') {
    if (subject) subject.value = `Following up — ${company}`;
    if (body) body.value =
`Hi ${fname},

Just wanted to follow up on my previous message about [topic].

I understand you're busy, so I'll keep this brief — I genuinely believe [your solution] could help ${company} with [specific benefit].

If now isn't the right time, no worries at all. Just let me know.

Best,
${yourName}`;
  }
}

function regenerateMessage() {
  if (!_selectedLead) { showToast('Select a lead first.'); return; }
  generateMessageTemplate();
  showToast('Message regenerated!');
}

function sendMessage() {
  const body = document.getElementById('msg-body');
  const subject = document.getElementById('msg-subject');
  if (!_selectedLead || !body?.value.trim()) { showToast('Select a lead and compose a message first.'); return; }
  const sent = JSON.parse(localStorage.getItem(SENT_KEY) || '[]');
  sent.unshift({
    date: new Date().toISOString(),
    leadName: _selectedLead.name,
    company: _selectedLead.company || '',
    tier: _selectedLead.tier,
    type: _selectedTemplate,
    subject: subject?.value || '',
    body: body.value
  });
  localStorage.setItem(SENT_KEY, JSON.stringify(sent.slice(0, 200)));
  renderSentLog();
  showToast(`Message marked as sent to ${_selectedLead.name}!`);
  body.value = '';
  if (subject) subject.value = '';
}

function copyMessage() {
  const body = document.getElementById('msg-body');
  const subject = document.getElementById('msg-subject');
  if (!body?.value.trim()) { showToast('Nothing to copy.'); return; }
  const full = (subject?.value ? 'Subject: ' + subject.value + '\n\n' : '') + body.value;
  navigator.clipboard.writeText(full).then(() => showToast('Copied to clipboard!')).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = full; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    showToast('Copied!');
  });
}

function renderSentLog() {
  const sent = JSON.parse(localStorage.getItem(SENT_KEY) || '[]');
  const log = document.getElementById('sent-log');
  const cnt = document.getElementById('sent-count');
  if (cnt) cnt.textContent = sent.length;
  if (!log) return;
  if (!sent.length) {
    log.innerHTML = '<div style="color:var(--muted);font-size:0.8rem;text-align:center;padding:12px;">No messages sent yet.</div>';
    return;
  }
  log.innerHTML = sent.slice(0, 50).map(s => `
    <div style="padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span class="tier-badge tb-${(s.tier||'cold').toLowerCase()}" style="font-size:0.6rem;">${s.tier}</span>
        <span style="font-weight:600;font-size:0.82rem;color:var(--text);">${esc(s.leadName)}</span>
        ${s.company ? `<span style="color:var(--muted);font-size:0.76rem;">· ${esc(s.company)}</span>` : ''}
        <span style="margin-left:auto;font-size:0.68rem;color:var(--dim);white-space:nowrap;">${new Date(s.date).toLocaleDateString()}</span>
      </div>
      ${s.subject ? `<div style="font-size:0.76rem;color:var(--muted);margin-bottom:2px;">Subject: ${esc(s.subject)}</div>` : ''}
      <div style="font-size:0.74rem;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(s.body.slice(0,100))}${s.body.length>100?'…':''}</div>
    </div>
  `).join('');
}

function clearSentMessages() {
  if (!confirm('Clear all sent message history?')) return;
  localStorage.removeItem(SENT_KEY);
  renderSentLog();
  showToast('Message history cleared.');
}

/* ════════════════════════════════════════════════════════════════════
   COMPANIES MODULE — enhanced with persistence
   ════════════════════════════════════════════════════════════════════ */

const COMPANIES_KEY = 'lr_companies';

function updateCompaniesGrid(leads) {
  // Extract + deduplicate companies
  const companies = [...new Map(
    leads.filter(l => l.company || l.name)
         .map(l => [l.company || l.name, l])
  ).values()];

  // Merge with previously saved
  const saved = JSON.parse(localStorage.getItem(COMPANIES_KEY) || '[]');
  const mergedMap = new Map(saved.map(c => [c.name, c]));
  companies.forEach(l => {
    const name = l.company || l.name;
    if (!mergedMap.has(name)) {
      mergedMap.set(name, {
        name,
        website: l.website || '',
        phone: l.phone || '',
        location: l.city || l.location || '',
        tier: l.tier,
        score: l.score,
        category: l.category || l.headline || '',
        addedAt: new Date().toISOString()
      });
    }
  });
  const allCompanies = [...mergedMap.values()].sort((a,b) => b.score - a.score);
  localStorage.setItem(COMPANIES_KEY, JSON.stringify(allCompanies.slice(0, 200)));
  renderCompaniesGrid();
}

function renderCompaniesGrid() {
  const grid = document.getElementById('companiesGrid');
  if (!grid) return;
  const companies = JSON.parse(localStorage.getItem(COMPANIES_KEY) || '[]');
  if (!companies.length) {
    grid.innerHTML = `<div class="coming-soon">
      <div class="coming-soon-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="16"/><line x1="15" y1="22" x2="15" y2="16"/><line x1="9" y1="16" x2="15" y2="16"/></svg></div>
      <h3>No companies yet. Generate leads to discover companies.</h3>
    </div>`;
    return;
  }

  // Section header with count + search + clear
  const existingControls = document.getElementById('companies-controls');
  if (!existingControls) {
    const header = document.querySelector('#companies-section .section-header');
    if (header) {
      const controls = document.createElement('div');
      controls.id = 'companies-controls';
      controls.style.cssText = 'display:flex;gap:8px;align-items:center;';
      controls.innerHTML = `
        <input type="text" placeholder="Search companies..." style="width:180px;" oninput="filterCompanies(this.value)" id="co-search" />
        <button class="csv-btn" onclick="exportCompaniesCSV()">Export CSV</button>
        <button class="csv-btn" onclick="clearCompanies()" style="border-color:rgba(255,59,107,0.3);background:rgba(255,59,107,0.06);color:var(--hot);">Clear</button>
      `;
      header.appendChild(controls);
    }
  }

  _renderCompanyCards(companies);
}

function _renderCompanyCards(companies) {
  const grid = document.getElementById('companiesGrid');
  if (!grid) return;
  grid.innerHTML = companies.slice(0, 48).map(c => `
    <div class="placeholder-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <div class="ph-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">${esc(c.name)}</div>
        <span class="tier-badge tb-${(c.tier||'cold').toLowerCase()}" style="font-size:0.6rem;flex-shrink:0;">${c.tier||'—'}</span>
      </div>
      ${c.category ? `<div class="ph-sub" style="font-size:0.72rem;">${esc(c.category)}</div>` : ''}
      ${c.location ? `<div class="ph-sub" style="font-size:0.72rem;">${esc(c.location)}</div>` : ''}
      <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
        ${c.phone ? `<a href="tel:${esc(c.phone)}" class="ph-badge" style="background:rgba(79,124,255,0.1);color:var(--primary);border-radius:20px;font-size:0.68rem;padding:2px 8px;">${esc(c.phone)}</a>` : ''}
        ${c.website ? `<a href="${esc(c.website)}" target="_blank" rel="noopener" class="ph-badge" style="background:rgba(16,217,138,0.1);color:#10D98A;border-radius:20px;font-size:0.68rem;padding:2px 8px;">Website</a>` : ''}
      </div>
    </div>
  `).join('');
}

function filterCompanies(q) {
  const companies = JSON.parse(localStorage.getItem(COMPANIES_KEY) || '[]');
  if (!q.trim()) { _renderCompanyCards(companies); return; }
  const lq = q.toLowerCase();
  _renderCompanyCards(companies.filter(c =>
    (c.name||'').toLowerCase().includes(lq) ||
    (c.category||'').toLowerCase().includes(lq) ||
    (c.location||'').toLowerCase().includes(lq)
  ));
}

function exportCompaniesCSV() {
  const companies = JSON.parse(localStorage.getItem(COMPANIES_KEY) || '[]');
  if (!companies.length) { showToast('No companies to export.'); return; }
  const headers = ['Company','Category','Location','Phone','Website','Tier','Score'];
  const rows = companies.map(c => [csv(c.name),csv(c.category),csv(c.location),csv(c.phone),csv(c.website),c.tier,c.score]);
  const blob = new Blob([[headers,...rows].map(r=>r.join(',')).join('\n')],{type:'text/csv'});
  const a = Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:`companies_${Date.now()}.csv`});
  a.click(); URL.revokeObjectURL(a.href);
  showToast(`Exported ${companies.length} companies!`);
}

function clearCompanies() {
  if (!confirm('Clear all saved companies?')) return;
  localStorage.removeItem(COMPANIES_KEY);
  renderCompaniesGrid();
  showToast('Companies cleared.');
}

/* ════════════════════════════════════════════════════════════════════
   WIRE UP: intercept section navigation to render data on demand
   ════════════════════════════════════════════════════════════════════ */

// Wrap showSection so navigating to Analytics/Companies/Messages renders live data
const _showSectionOrig = showSection;
window.showSection = showSection = function(id) {
  _showSectionOrig(id);
  if (id === 'analytics-section') renderAnalytics();
  if (id === 'companies-section') renderCompaniesGrid();
  if (id === 'messages-section')  initMessagesModule();
};

async function saveProfile() {
  const btn = document.getElementById('saveProfileBtn');
  if (btn) btn.textContent = 'Saving...';
  
  const payload = {
    smtpHost: document.getElementById('pf-smtpHost')?.value,
    smtpUser: document.getElementById('pf-smtpUser')?.value,
    smtpPass: document.getElementById('pf-smtpPass')?.value,
    openRouterKey: document.getElementById('pf-openRouterKey')?.value,
    apifyToken: document.getElementById('pf-apifyToken')?.value,
    apifyActorId: document.getElementById('pf-apifyActorId')?.value,
    n8nWebhookUrl: document.getElementById('pf-n8nWebhookUrl')?.value,
    n8nWebhookSecret: document.getElementById('pf-n8nWebhookSecret')?.value,
    n8nEnabled: document.getElementById('pf-n8nEnabled')?.checked
  };

  try {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to save settings');
    
    LRProfile.save({
      fullName: document.getElementById('pf-name')?.value,
      email: document.getElementById('pf-email')?.value,
      phone: document.getElementById('pf-phone')?.value,
      website: document.getElementById('pf-website')?.value,
    });

    showToast('Settings saved successfully!');
  } catch (err) {
    showToast('Error: ' + err.message);
  } finally {
    if (btn) btn.textContent = 'Save Changes';
  }
}

async function fetchBackendSettings() {
  try {
    const response = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (response.ok) {
      const data = await response.json();
      const user = data.user;
      
      const setVal = (id, v) => { const el = document.getElementById(id); if (el && v) el.value = v; };
      setVal('pf-smtpHost', user.smtpHost);
      setVal('pf-smtpUser', user.smtpUser);
      // We don't populate smtpPass or tokens for security if we don't want to, but MVP has it.
      setVal('pf-openRouterKey', user.openRouterKey);
      setVal('pf-apifyToken', user.apifyToken);
      setVal('pf-apifyActorId', user.apifyActorId);
      setVal('pf-n8nWebhookUrl', user.n8nWebhookUrl);
      setVal('pf-n8nWebhookSecret', user.n8nWebhookSecret);
      
      const n8nCb = document.getElementById('pf-n8nEnabled');
      if (n8nCb) n8nCb.checked = user.n8nEnabled;
    }
  } catch (e) {
    console.error('Failed to load backend settings', e);
  }
}

const _origOpenSettingsDrawer = window.openSettingsDrawer || (() => {});
window.openSettingsDrawer = function() {
  _origOpenSettingsDrawer();
  fetchBackendSettings();
}

async function testApify() {
  try {
    const token = document.getElementById('pf-apifyToken').value;
    const response = await fetch('/api/settings/test-apify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ apifyToken: token })
    });
    if (!response.ok) throw new Error((await response.json()).error);
    showToast('Apify connection successful!');
  } catch (err) { showToast('Apify Test Failed: ' + err.message); }
}

async function testN8n() {
  try {
    const url = document.getElementById('pf-n8nWebhookUrl').value;
    const secret = document.getElementById('pf-n8nWebhookSecret').value;
    const response = await fetch('/api/settings/test-n8n', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ n8nWebhookUrl: url, n8nWebhookSecret: secret })
    });
    if (!response.ok) throw new Error((await response.json()).error);
    showToast('n8n webhook connection successful!');
  } catch (err) { showToast('n8n Test Failed: ' + err.message); }
}

async function testSmtp() {
  try {
    const smtpHost = document.getElementById('pf-smtpHost')?.value;
    const smtpUser = document.getElementById('pf-smtpUser')?.value;
    const smtpPass = document.getElementById('pf-smtpPass')?.value;
    const response = await fetch('/api/settings/test-smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ smtpHost, smtpUser, smtpPass })
    });
    if (!response.ok) throw new Error((await response.json()).error);
    showToast('SMTP connection successful!');
  } catch (err) { showToast('SMTP Test Failed: ' + err.message); }
}

