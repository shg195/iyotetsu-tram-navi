/* Shared atoms for the tram app — line badges, color mapping, formatters.
   Exports to window: lineColor, LineBadge, fmtWait, Seg. Loaded before tram-app.jsx. */

// Brightened line colors for the dark "night" theme (legibility on near-black).
const NIGHT_LINE = { 1: '#2fd47e', 2: '#ff5a60', 3: '#ffa838', 5: '#4aa8ff', 6: '#c3c9d2' };

function lineColor(lineId, theme) {
  const base = window.TRAM.LINES[lineId].color;
  if (theme.key === 'night') return NIGHT_LINE[lineId] || base;
  return base;
}

// hex -> rgba
function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function LineBadge({ lineId, theme, size = 28 }) {
  const col = lineColor(lineId, theme);
  const fs = Math.round(size * 0.52);
  const base = {
    width: size, height: size, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: theme.mono, fontWeight: 600, fontSize: fs,
    borderRadius: theme.chip === 'tint' ? 999 : theme.radiusChip,
    lineHeight: 1, boxSizing: 'border-box',
  };
  let style;
  if (theme.chip === 'glow') {
    style = { ...base, background: hexA(col, 0.12), color: col,
      border: `1.5px solid ${col}`, boxShadow: `0 0 10px ${hexA(col, 0.45)}, inset 0 0 6px ${hexA(col, 0.15)}` };
  } else if (theme.chip === 'tint') {
    style = { ...base, background: hexA(col, 0.16), color: col };
  } else {
    style = { ...base, background: col, color: '#fff' };
  }
  return <div style={style}>{lineId}</div>;
}

function fmtWait(waitMin, lang, t) {
  if (waitMin == null) return null;
  if (waitMin <= 0) return t.now;
  return lang === 'en' ? `${t.soon} ${waitMin} ${t.min}` : `あと${waitMin}分`;
}

Object.assign(window, { lineColor, hexA, LineBadge, fmtWait });
