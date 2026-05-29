/* Stop picker bottom sheet — fuzzy search, nearest-stop, line badges per stop.
   Exports to window: StopPicker. */

const FREQUENT = ['dogo', 'matsuyamashi', 'okaido', 'jr', 'otemachi', 'komachi'];

// which lines serve a given stop
function stopLines(stopId) {
  const out = [];
  for (const id of Object.keys(window.TRAM.PATHS)) {
    if (window.TRAM.PATHS[id].includes(stopId)) out.push(id);
  }
  return out;
}

function StopPicker({ mode, theme, lang, t, locationAllowed, onPick, onClose }) {
  const T = window.TRAM;
  const [q, setQ] = React.useState('');
  const inputRef = React.useRef(null);
  React.useEffect(() => { const id = setTimeout(() => inputRef.current && inputRef.current.focus(), 280); return () => clearTimeout(id); }, []);

  const results = q.trim() ? T.searchStops(q) : null;
  const near = T.nearestStops();

  const rowBtn = (stopId, opts = {}) => {
    const s = T.STOP_BY_ID[stopId];
    const serving = stopLines(stopId);
    return (
      <button key={stopId + (opts.k || '')} onClick={() => onPick(stopId)} style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        padding: '13px 18px', background: 'transparent', border: 'none',
        borderBottom: `1px solid ${theme.hairline}`, cursor: 'pointer', textAlign: 'left',
        fontFamily: theme.sans,
      }}>
        {opts.icon || (
          <div style={{ width: 22, height: 22, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 9, height: 9, borderRadius: 999, border: `2px solid ${theme.textFaint}` }} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, color: theme.text, fontWeight: 500, lineHeight: 1.25 }}>
            {T.name(s, lang)}
            {opts.note && <span style={{ fontSize: 12, color: theme.accent, fontWeight: 600, marginLeft: 8 }}>{opts.note}</span>}
          </div>
          <div style={{ fontSize: 12, color: theme.textFaint, marginTop: 2, letterSpacing: 0.2 }}>
            {lang === 'en' ? s.ja : s.romaji}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {serving.map(id => <LineBadge key={id} lineId={id} theme={theme} size={18} />)}
        </div>
      </button>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
      {/* scrim */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: theme.deviceDark ? 'rgba(0,0,0,0.55)' : 'rgba(20,20,15,0.32)', backdropFilter: 'blur(2px)' }} />
      {/* sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, top: 70,
        background: theme.surface, borderTopLeftRadius: theme.radius + 6, borderTopRightRadius: theme.radius + 6,
        boxShadow: '0 -10px 40px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'sheetUp 0.32s cubic-bezier(0.22,1,0.36,1)',
      }}>
        {/* handle + header */}
        <div style={{ padding: '10px 18px 10px', flexShrink: 0 }}>
          <div style={{ width: 40, height: 5, borderRadius: 999, background: theme.border, margin: '0 auto 12px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: theme.text, fontFamily: theme.sans }}>
              {mode === 'from' ? t.pickFrom : t.pickTo}
            </div>
            <button onClick={onClose} style={{
              width: 30, height: 30, borderRadius: 999, border: 'none', cursor: 'pointer',
              background: theme.surfaceAlt, color: theme.textMuted, fontSize: 16, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.sans,
            }}>✕</button>
          </div>
        </div>

        {/* search */}
        <div style={{ padding: '4px 18px 12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: theme.surfaceAlt, border: `1px solid ${theme.border}`, borderRadius: theme.radiusSm, padding: '0 12px' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="7" cy="7" r="5" stroke={theme.textFaint} strokeWidth="1.6" />
              <path d="M11 11l3.5 3.5" stroke={theme.textFaint} strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder={t.searchPh} style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent', padding: '11px 0',
              fontSize: 15, color: theme.text, fontFamily: theme.sans,
            }} />
            {q && <button onClick={() => setQ('')} style={{ border: 'none', background: 'transparent', color: theme.textFaint, cursor: 'pointer', fontSize: 15 }}>✕</button>}
          </div>
        </div>

        {/* list */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {results ? (
            results.length ? results.map(s => rowBtn(s.id)) : (
              <div style={{ padding: '32px 18px', textAlign: 'center', color: theme.textFaint, fontSize: 14, fontFamily: theme.sans }}>
                {lang === 'en' ? 'No matching stops' : '該当する電停がありません'}
              </div>
            )
          ) : (
            <div>
              {/* nearest (only when picking departure) */}
              {mode === 'from' && (
                locationAllowed ? (
                  <div style={{ padding: '4px 0 6px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, padding: '6px 18px 8px', fontFamily: theme.sans }}>{t.useNearest}</div>
                    {near.map((n, i) => rowBtn(n.id, {
                      k: 'near', note: i === 0 ? t.near : null,
                      icon: (
                        <div style={{ width: 22, height: 22, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="3" fill={i === 0 ? theme.accent : theme.textFaint} />
                            <circle cx="8" cy="8" r="6.5" stroke={i === 0 ? theme.accent : theme.textFaint} strokeOpacity="0.4" strokeWidth="1.4" />
                          </svg>
                        </div>
                      ),
                    }))}
                  </div>
                ) : (
                  <div style={{ margin: '4px 18px 10px', padding: '12px 14px', background: theme.surfaceAlt, borderRadius: theme.radiusSm, border: `1px dashed ${theme.border}` }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: theme.text, fontFamily: theme.sans }}>{t.locDenied}</div>
                    <div style={{ fontSize: 12.5, color: theme.textMuted, marginTop: 3, fontFamily: theme.sans }}>{t.locDeniedBody}</div>
                  </div>
                )
              )}
              <div style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, padding: '10px 18px 8px', fontFamily: theme.sans }}>{t.recent}</div>
              {FREQUENT.map(id => rowBtn(id, { k: 'freq' }))}
              <div style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, padding: '10px 18px 8px', fontFamily: theme.sans }}>{t.allStops}</div>
              {window.TRAM.STOPS.map(s => rowBtn(s.id, { k: 'all' }))}
              <div style={{ height: 20 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { StopPicker, stopLines });
