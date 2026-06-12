/**
 * LeadRadar — Theme Engine (theme.js)
 * Manages 10 preset 3D themes + custom color support.
 * All themes update CSS variables on :root.
 */

const LR_THEMES = {
  'light-white': {
    name: 'Light Premium White',
    primary:   '#4F7CFF',
    secondary: '#7C5CFF',
    tertiary:  '#00D4FF',
    glow:      'rgba(79,124,255,0.12)',
    hot:       '#FF3B6B',
    warm:      '#F59E0B',
    cold:      '#00C3E5',
    bg:        '#F4F6F9',
    surface:   '#FFFFFF',
    surface2:  '#EAEFF8',
    border:    '#D0D7E5',
    border2:   '#B0C0DF',
    text:      '#0F172A',
    muted:     '#475569',
    dim:       '#94A3B8',
    inputBg:   '#FFFFFF',
    headerBg:  'rgba(255, 255, 255, 0.92)',
    navBg:     'rgba(255, 255, 255, 0.96)'
  },
  'ai-neon': {
    name: '3D AI Neon Blue + Violet',
    primary:   '#4F7CFF',
    secondary: '#7C5CFF',
    tertiary:  '#00E5FF',
    glow:      'rgba(79,124,255,0.45)',
    hot:       '#FF3B6B',
    warm:      '#F59E0B',
    cold:      '#00E5FF',
    bg:        '#070A12',
    surface:   '#0D1424',
    surface2:  '#111A2E',
    border:    '#1E2D4A',
    border2:   '#2A3F68',
  },
  'cyber-aurora': {
    name: '3D Cyber Aurora Blue + Cyan',
    primary:   '#00D4FF',
    secondary: '#0066FF',
    tertiary:  '#00FFD1',
    glow:      'rgba(0,212,255,0.45)',
    hot:       '#FF4D6D',
    warm:      '#FFB800',
    cold:      '#00FFD1',
    bg:        '#030D18',
    surface:   '#051220',
    surface2:  '#071828',
    border:    '#0D2A40',
    border2:   '#123858',
  },
  'midnight-purple': {
    name: '3D Midnight Purple + Pink',
    primary:   '#9B59FF',
    secondary: '#FF3B8B',
    tertiary:  '#FF00FF',
    glow:      'rgba(155,89,255,0.45)',
    hot:       '#FF3B8B',
    warm:      '#FF8C00',
    cold:      '#9B59FF',
    bg:        '#09040F',
    surface:   '#120718',
    surface2:  '#180A22',
    border:    '#2A1040',
    border2:   '#3C1860',
  },
  'emerald-green': {
    name: '3D Emerald Green + Lime',
    primary:   '#10D98A',
    secondary: '#A3E635',
    tertiary:  '#00FF88',
    glow:      'rgba(16,217,138,0.45)',
    hot:       '#FF4444',
    warm:      '#FFB800',
    cold:      '#10D98A',
    bg:        '#030F09',
    surface:   '#04150C',
    surface2:  '#051A0F',
    border:    '#0A3020',
    border2:   '#104030',
  },
  'sunset-orange': {
    name: '3D Sunset Orange + Amber',
    primary:   '#FF6B35',
    secondary: '#F59E0B',
    tertiary:  '#FFD700',
    glow:      'rgba(255,107,53,0.45)',
    hot:       '#FF3B3B',
    warm:      '#FFD700',
    cold:      '#60A5FA',
    bg:        '#0F0800',
    surface:   '#180E00',
    surface2:  '#201200',
    border:    '#3D2000',
    border2:   '#5A3000',
  },
  'luxury-gold': {
    name: '3D Luxury Dark + Gold',
    primary:   '#C9A84C',
    secondary: '#FFD700',
    tertiary:  '#FFA500',
    glow:      'rgba(201,168,76,0.45)',
    hot:       '#FF4444',
    warm:      '#FFD700',
    cold:      '#94A3B8',
    bg:        '#080600',
    surface:   '#100C00',
    surface2:  '#181200',
    border:    '#332800',
    border2:   '#504000',
  },
  'mono-gray': {
    name: '3D Sleek Monochrome Gray + Blue',
    primary:   '#94A3B8',
    secondary: '#5B8FFF',
    tertiary:  '#64748B',
    glow:      'rgba(148,163,184,0.35)',
    hot:       '#FF6B6B',
    warm:      '#FBBF24',
    cold:      '#5B8FFF',
    bg:        '#080A0E',
    surface:   '#0D1018',
    surface2:  '#121620',
    border:    '#1E2535',
    border2:   '#2A3448',
  },
  'glass-electric': {
    name: '3D Glass Black + Electric Blue',
    primary:   '#00B4FF',
    secondary: '#0066FF',
    tertiary:  '#00E5FF',
    glow:      'rgba(0,180,255,0.5)',
    hot:       '#FF2D55',
    warm:      '#FF9500',
    cold:      '#00E5FF',
    bg:        '#030306',
    surface:   '#050510',
    surface2:  '#080818',
    border:    '#0F0F30',
    border2:   '#181848',
  },
  'cosmic-purple': {
    name: '3D Cosmic Purple + Magenta',
    primary:   '#8B5CF6',
    secondary: '#EC4899',
    tertiary:  '#FF00FF',
    glow:      'rgba(139,92,246,0.5)',
    hot:       '#EC4899',
    warm:      '#F59E0B',
    cold:      '#8B5CF6',
    bg:        '#06030F',
    surface:   '#0A0618',
    surface2:  '#0D0822',
    border:    '#1C1040',
    border2:   '#281858',
  },
  'teal-lime': {
    name: '3D Futuristic Teal + Lime',
    primary:   '#14B8A6',
    secondary: '#84CC16',
    tertiary:  '#00FFD1',
    glow:      'rgba(20,184,166,0.45)',
    hot:       '#FF4444',
    warm:      '#FFB800',
    cold:      '#14B8A6',
    bg:        '#030D0B',
    surface:   '#051510',
    surface2:  '#071A15',
    border:    '#0D3028',
    border2:   '#124038',
  }
};

function applyTheme(themeKey, customColors) {
  const theme = LR_THEMES[themeKey] || LR_THEMES['ai-neon'];
  const colors = Object.assign({}, theme, customColors || {});
  const r = document.documentElement;
  const isLight = themeKey === 'light-white';

  // Toggle helper class so CSS can override hardcoded dark values
  document.documentElement.classList.toggle('theme-light', isLight);

  r.style.setProperty('--primary',   colors.primary);
  r.style.setProperty('--secondary', colors.secondary);
  r.style.setProperty('--tertiary',  colors.tertiary);
  r.style.setProperty('--glow',      colors.glow);
  r.style.setProperty('--hot',       colors.hot);
  r.style.setProperty('--warm',      colors.warm);
  r.style.setProperty('--cold',      colors.cold);
  r.style.setProperty('--bg',        colors.bg);
  r.style.setProperty('--surface',   colors.surface);
  r.style.setProperty('--surface2',  colors.surface2);
  r.style.setProperty('--border',    colors.border);
  r.style.setProperty('--border2',   colors.border2);

  // Handle dynamic text and input colors for light mode
  r.style.setProperty('--text',      colors.text || '#F0F4FF');
  r.style.setProperty('--muted',     colors.muted || '#7A90B8');
  r.style.setProperty('--dim',       colors.dim || '#2A3F68');
  r.style.setProperty('--input-bg',  colors.inputBg || 'rgba(17, 26, 46, 0.7)');
  r.style.setProperty('--header-bg', colors.headerBg || 'rgba(13, 20, 36, 0.92)');
  r.style.setProperty('--nav-bg',    colors.navBg || 'rgba(13, 20, 36, 0.96)');

  // Light-mode derived variables
  if (isLight) {
    r.style.setProperty('--card-bg',    'rgba(255,255,255,0.85)');
    r.style.setProperty('--card-shadow','0 4px 24px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.8)');
    r.style.setProperty('--overlay-bg', 'rgba(0,0,0,0.35)');
    r.style.setProperty('--modal-bg',   'rgba(255,255,255,0.98)');
    r.style.setProperty('--drawer-bg',  'rgba(248,250,255,0.98)');
    r.style.setProperty('--toast-bg',   'rgba(255,255,255,0.98)');
    r.style.setProperty('--select-opt', colors.surface);
  } else {
    r.style.setProperty('--card-bg',    'rgba(13,20,36,0.8)');
    r.style.setProperty('--card-shadow','0 20px 60px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.07)');
    r.style.setProperty('--overlay-bg', 'rgba(0,0,0,0.6)');
    r.style.setProperty('--modal-bg',   'rgba(13,20,36,0.96)');
    r.style.setProperty('--drawer-bg',  'rgba(10,16,28,0.98)');
    r.style.setProperty('--toast-bg',   'rgba(13,20,36,0.96)');
    r.style.setProperty('--select-opt', '#111A2E');
  }

  // Derive button gradient
  r.style.setProperty('--button-3d', `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.tertiary} 100%)`);
  r.style.setProperty('--button-shadow', `0 10px 28px ${colors.glow}, inset 0 1px 2px rgba(255,255,255,0.3)`);
  r.style.setProperty('--border-glow', colors.glow);
  r.style.setProperty('--glow-color', colors.glow);

  // Glow intensity (stored separately)
  const intensity = parseFloat(LRPrefs.get('glowIntensity') || 1);
  applyGlowIntensity(intensity);
}

function applyGlowIntensity(val) {
  const r = document.documentElement;
  const raw = LRPrefs.get('theme') || 'ai-neon';
  const theme = LR_THEMES[raw] || LR_THEMES['ai-neon'];
  const base = theme.glow.match(/[\d.]+,[\d.]+,[\d.]+/)?.[0] || '79,124,255';
  r.style.setProperty('--glow', `rgba(${base},${Math.min(0.8, val * 0.5)})`);
  r.style.setProperty('--button-shadow', `0 ${Math.round(10 * val)}px ${Math.round(28 * val)}px rgba(${base},${Math.min(0.7, val * 0.4)}), inset 0 1px 2px rgba(255,255,255,0.3)`);
}

window.LRThemes = { themes: LR_THEMES, apply: applyTheme, applyGlow: applyGlowIntensity };
