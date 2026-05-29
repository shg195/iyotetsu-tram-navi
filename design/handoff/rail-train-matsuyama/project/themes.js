/* Three visual directions. Shared type system, divergent color/mode/shape.
   All keep info legibility first (practical guidance tool). Exposed as window.TRAM_THEMES. */
(function () {
  const SANS = '"IBM Plex Sans JP", -apple-system, system-ui, sans-serif';
  const MONO = '"IBM Plex Mono", ui-monospace, "SF Mono", monospace';

  const THEMES = {
    // A — 時刻表ボード : light, neutral, departure-board hero
    board: {
      key: 'board',
      labelJa: '時刻表ボード', labelEn: 'Departure Board',
      deviceDark: false, sans: SANS, mono: MONO,
      bg: '#f1f0ec', surface: '#ffffff', surfaceAlt: '#f8f7f3',
      text: '#1a1a17', textMuted: '#6c6b62', textFaint: '#a3a298',
      border: '#e4e2da', hairline: '#edece5',
      accent: '#1a1a17', accentText: '#ffffff',
      heroBg: '#1a1a17', heroText: '#ffffff', heroMuted: 'rgba(255,255,255,0.62)',
      heroNum: '#ffffff',
      radius: 16, radiusSm: 10, radiusChip: 8,
      chip: 'solid', // solid line-color badge
      shadow: '0 1px 2px rgba(20,20,15,0.05), 0 8px 24px rgba(20,20,15,0.06)',
      shadowSm: '0 1px 2px rgba(20,20,15,0.06)',
      glow: false, density: 1,
    },

    // B — ナイトホーム : dark platform LED display
    night: {
      key: 'night',
      labelJa: 'ナイトホーム', labelEn: 'Night Platform',
      deviceDark: true, sans: SANS, mono: MONO,
      bg: '#0c0e11', surface: '#15181d', surfaceAlt: '#1b1f25',
      text: '#eef1f4', textMuted: '#98a0aa', textFaint: '#5b626c',
      border: '#262b32', hairline: '#20242b',
      accent: '#ffb31a', accentText: '#15120a',
      heroBg: 'linear-gradient(160deg,#181c22 0%,#10131800 100%), radial-gradient(120% 90% at 80% -10%, rgba(255,179,26,0.16), transparent 60%)',
      heroBgFlat: '#13171c',
      heroText: '#eef1f4', heroMuted: 'rgba(238,241,244,0.55)', heroNum: '#ffd166',
      radius: 18, radiusSm: 12, radiusChip: 9,
      chip: 'glow', // outlined glowing badge
      shadow: '0 1px 0 rgba(255,255,255,0.03), 0 12px 30px rgba(0,0,0,0.5)',
      shadowSm: '0 1px 0 rgba(255,255,255,0.03)',
      glow: true, density: 1,
    },

    // C — 道後ウォーム : warm paper, friendly cards, onsen terracotta
    warm: {
      key: 'warm',
      labelJa: '道後ウォーム', labelEn: 'Dōgo Warm',
      deviceDark: false, sans: SANS, mono: MONO,
      bg: '#f4ece0', surface: '#fffdf9', surfaceAlt: '#fbf4e9',
      text: '#2c2520', textMuted: '#7d7167', textFaint: '#ad9f90',
      border: '#ece0cf', hairline: '#f1e8da',
      accent: '#bd5b3c', accentText: '#fff6ef',
      heroBg: '#bd5b3c', heroText: '#fff6ef', heroMuted: 'rgba(255,246,239,0.7)', heroNum: '#fff6ef',
      radius: 22, radiusSm: 14, radiusChip: 999,
      chip: 'tint', // tinted soft pill
      shadow: '0 2px 4px rgba(120,80,50,0.05), 0 12px 30px rgba(120,80,50,0.08)',
      shadowSm: '0 1px 2px rgba(120,80,50,0.06)',
      glow: false, density: 1,
    },
  };

  window.TRAM_THEMES = THEMES;

  // Hero ("次発") card variations — tuned for outdoor / daylight legibility.
  window.HERO_VARIANTS = {
    bright: {
      key: 'bright', labelJa: '明るい強調色', labelEn: 'Bright accent fill',
      bg: '#f3a712', text: '#241a00', muted: 'rgba(36,26,0,0.62)', num: '#241a00',
      shadow: '0 6px 22px rgba(214,140,10,0.42)', border: 'none', accentBar: false,
    },
    white: {
      key: 'white', labelJa: '白地＋系統色の枠', labelEn: 'White + line-color frame',
      bg: '#ffffff', text: '#1a1a17', muted: '#6c6b62', num: '#1a1a17',
      shadow: '0 6px 16px rgba(20,20,15,0.10), 0 18px 44px rgba(20,20,15,0.17)', border: 'none', borderLine: true, accentBar: false,
    },
    navy: {
      key: 'navy', labelJa: '濃紺（黒より明るい暗色）', labelEn: 'Deep navy',
      bg: '#1e2c50', text: '#eef2fb', muted: 'rgba(238,242,251,0.62)', num: '#ffffff',
      shadow: '0 8px 26px rgba(30,44,80,0.32)', border: 'none', accentBar: false,
    },
  };
})();
