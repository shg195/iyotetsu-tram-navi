/* TramApp — single-screen tram guide. Theme-driven so one component renders
   all three visual directions. Exports to window: TramApp.
   Props: theme, lang, nowMin, dayType, locationAllowed (shared/controlled). */

function TramApp({ theme, lang, nowMin, nowSec, dayType, locationAllowed, heroVariant, heroBorderMode }) {
  const T = window.TRAM;
  const t = T.I18N[lang];
  const hv = (window.HERO_VARIANTS && window.HERO_VARIANTS[heroVariant]) || window.HERO_VARIANTS.bright;

  // ── per-instance UI state ──
  const initialFrom = locationAllowed ? 'okaido' : null;
  const [fromId, setFromId] = React.useState(initialFrom);
  const [usingNearest, setUsingNearest] = React.useState(locationAllowed);
  const [toId, setToId] = React.useState('dogo');
  const [picker, setPicker] = React.useState(null); // 'from' | 'to' | null
  const [limit, setLimit] = React.useState(4);
  const [openRoutes, setOpenRoutes] = React.useState({});
  const [heroVia, setHeroVia] = React.useState(false);
  const [aboutOpen, setAboutOpen] = React.useState(false);

  // keep nearest in sync if permission flips
  React.useEffect(() => {
    if (!locationAllowed && usingNearest) { setUsingNearest(false); setFromId(null); }
    if (locationAllowed && fromId == null && !picker) { setUsingNearest(true); setFromId('okaido'); }
  }, [locationAllowed]);

  const result = T.plan(fromId, toId, { nowMin, dayType, limit });

  const pick = (id) => {
    if (picker === 'from') { setFromId(id); setUsingNearest(id === 'okaido' && usingNearest ? usingNearest : false); }
    else { setToId(id); }
    setLimit(4); setOpenRoutes({}); setPicker(null);
  };
  const swap = () => { const f = fromId; setFromId(toId); setToId(f); setUsingNearest(false); setLimit(4); };

  // ── selector field ──
  const Field = ({ label, stopId, kind }) => {
    const filled = !!stopId;
    return (
      <button onClick={() => setPicker(kind)} style={{
        display: 'flex', alignItems: 'center', gap: 13, width: '100%', textAlign: 'left',
        background: 'transparent', border: 'none', cursor: 'pointer', padding: '14px 16px', fontFamily: theme.sans,
      }}>
        <div style={{ width: 16, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          {kind === 'from'
            ? <div style={{ width: 11, height: 11, borderRadius: 999, border: `3px solid ${theme.accent}` }} />
            : <svg width="14" height="16" viewBox="0 0 14 16" fill="none"><path d="M7 0C3.1 0 0 3 0 6.8 0 11.8 7 16 7 16s7-4.2 7-9.2C14 3 10.9 0 7 0z" fill={theme.accent} /><circle cx="7" cy="6.6" r="2.5" fill={theme.surface} /></svg>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, letterSpacing: 0.6, textTransform: 'uppercase' }}>{label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
            <span style={{ fontSize: 19, fontWeight: 600, color: filled ? theme.text : theme.textFaint, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {filled ? T.name(stopId, lang) : (kind === 'from' ? t.pickFrom : t.pickTo)}
            </span>
            {kind === 'from' && usingNearest && filled && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: theme.accent, flexShrink: 0 }}>
                <svg width="9" height="9" viewBox="0 0 9 9"><circle cx="4.5" cy="4.5" r="2" fill={theme.accent} /><circle cx="4.5" cy="4.5" r="4" stroke={theme.accent} strokeOpacity="0.4" strokeWidth="1" fill="none" /></svg>
                {t.near}
              </span>
            )}
          </div>
        </div>
        <svg width="7" height="12" viewBox="0 0 7 12" style={{ flexShrink: 0 }}><path d="M1 1l5 5-5 5" stroke={theme.textFaint} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    );
  };

  // ── route row (hero or compact) ──
  const timesLine = (r, big) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: theme.mono, flexWrap: 'wrap' }}>
      <span style={{ fontSize: big ? 15 : 13, fontWeight: 600, color: big ? hv.text : theme.text }}>{T.fmtTime(r.departMin)}</span>
      <span style={{ fontSize: big ? 11 : 10, color: big ? hv.muted : theme.textMuted, fontFamily: theme.sans }}>{t.depart}</span>
      <span style={{ fontSize: big ? 12 : 11, color: big ? hv.muted : theme.textFaint }}>→</span>
      <span style={{ fontSize: big ? 14 : 12.5, fontWeight: 500, color: big ? hv.muted : theme.textMuted }}>≈{T.fmtTime(r.arriveMin)}</span>
      <span style={{ fontSize: big ? 11 : 10, color: big ? hv.muted : theme.textFaint, fontFamily: theme.sans }}>{t.arrive}</span>
      <span style={{ width: 1, height: 11, background: big ? hv.muted : theme.hairline, opacity: 0.5, margin: '0 1px' }} />
      <span style={{ fontSize: big ? 13 : 12, fontWeight: 600, color: big ? hv.muted : theme.textMuted }}>{r.travelMin}{lang === 'en' ? '' : '分'}{lang === 'en' ? ' min' : ''}</span>
    </div>
  );

  const Hero = ({ r }) => {
    const soonNow = r.waitMin != null && r.waitMin <= 0;
    const numSize = hv.key === 'white' ? 64 : 56;
    const heroBorder = hv.borderLine ? `3px solid ${heroBorderMode === '黒' ? '#1a1a17' : lineColor(r.lineId, theme)}` : hv.border;
    return (
      <div style={{ borderRadius: theme.radius, padding: hv.key === 'white' ? '17px 19px 16px' : '18px 20px 17px', position: 'relative', overflow: 'hidden',
        background: hv.bg, boxShadow: hv.shadow, border: heroBorder }}>
        {hv.accentBar && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: lineColor(r.lineId, theme) }} />}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <LineBadge lineId={r.lineId} theme={theme} size={26} />
            <span style={{ flex: '1 1 auto', fontSize: 16, fontWeight: 700, color: hv.text, fontFamily: theme.sans, whiteSpace: 'nowrap' }}>{T.rollSign(r.lineId, fromId, toId, lang)}</span>
            {!r.line.loop && <span style={{ fontSize: 11, color: hv.muted, fontFamily: theme.sans, flexShrink: 0 }}>{lang === 'en' ? r.line.en : r.line.ja}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 12 }}>
            {soonNow ? (
              <span style={{ fontSize: 40, fontWeight: 700, color: hv.num, fontFamily: theme.sans, lineHeight: 1, letterSpacing: -0.5 }}>{t.now}</span>
            ) : (
              <>
                <span style={{ fontSize: 11, fontWeight: 600, color: hv.muted, fontFamily: theme.sans, marginBottom: 9 }}>{lang === 'en' ? t.soon : 'あと'}</span>
                <span style={{ fontSize: numSize, fontWeight: 700, color: hv.num, fontFamily: theme.mono, lineHeight: 0.78, letterSpacing: -1.5 }}>{r.waitMin}</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: hv.muted, fontFamily: theme.sans, marginBottom: 9 }}>{lang === 'en' ? t.min : '分'}</span>
              </>
            )}
          </div>
          {timesLine(r, true)}
          {(() => {
            const pathNames = [T.name(fromId, lang), ...T.viaStops(r.lineId, fromId, toId, lang), T.name(toId, lang)].join(' → ');
            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button onClick={() => setHeroVia(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: hv.muted, fontFamily: theme.sans, fontSize: 11.5, fontWeight: 600 }}>
                    {t.via}
                    <svg width="9" height="6" viewBox="0 0 10 6" style={{ transform: heroVia ? 'rotate(180deg)' : 'none', transition: 'transform .18s' }}><path d="M1 1l4 4 4-4" stroke={hv.muted} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>
                {heroVia && (
                  <div style={{ marginTop: 8, fontSize: 12.5, color: hv.text, lineHeight: 1.7 }}>{pathNames}</div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    );
  };

  const Row = ({ r, last }) => {
    const rid = r.departMin + '_' + r.lineId;
    const open = !!openRoutes[rid];
    return (
      <div style={{ borderBottom: last ? 'none' : `1px solid ${theme.hairline}` }}>
        <button onClick={() => setOpenRoutes(p => ({ ...p, [rid]: !p[rid] }))} style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
          padding: '13px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: theme.sans }}>
          <LineBadge lineId={r.lineId} theme={theme} size={26} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 700, color: theme.text, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {T.rollSign(r.lineId, fromId, toId, lang)}
              </span>
              <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 700, color: theme.accent, fontFamily: theme.sans }}>
                {r.waitMin != null ? fmtWait(r.waitMin, lang, t) : T.fmtTime(r.departMin)}
              </span>
            </div>
            <div style={{ marginTop: 4 }}>{timesLine(r, false)}</div>
          </div>
          <svg width="6" height="11" viewBox="0 0 7 12" style={{ flexShrink: 0, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .18s' }}><path d="M1 1l5 5-5 5" stroke={theme.textFaint} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        {open && (
          <div style={{ padding: '0 16px 14px 54px', fontFamily: theme.sans }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, letterSpacing: 0.4, marginBottom: 4 }}>{t.via}</div>
            <div style={{ fontSize: 12.5, color: theme.text, lineHeight: 1.7 }}>
              {[T.name(fromId, lang), ...T.viaStops(r.lineId, fromId, toId, lang), T.name(toId, lang)].join(' → ')}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── results body ──
  const Card = ({ children, style }) => (
    <div style={{ background: theme.surface, borderRadius: theme.radius, boxShadow: theme.shadowSm, border: `1px solid ${theme.border}`, overflow: 'hidden', ...style }}>{children}</div>
  );

  const Notice = ({ title, body, tone }) => (
    <Card style={{ padding: '18px 18px' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 30, height: 30, borderRadius: 999, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: tone === 'warn' ? hexA(theme.accent, 0.14) : theme.surfaceAlt, color: theme.accent, fontSize: 16, fontWeight: 700, fontFamily: theme.mono }}>i</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, fontFamily: theme.sans }}>{title}</div>
          <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 4, lineHeight: 1.5, fontFamily: theme.sans }}>{body}</div>
        </div>
      </div>
    </Card>
  );

  let body;
  if (result.status === 'incomplete') {
    body = <Notice title={t.appName} body={t.selectBoth} />;
  } else if (result.status === 'same') {
    body = <Notice title={t.sameTitle} body={t.sameBody} tone="warn" />;
  } else if (result.status === 'none') {
    body = <Notice title={t.noneTitle} body={t.noneBody} tone="warn" />;
  } else if (result.status === 'ended') {
    const r0 = result.nextService;
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Notice title={t.endedTitle} body={t.endedBody} tone="warn" />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, letterSpacing: 0.6, textTransform: 'uppercase', padding: '0 4px 8px', fontFamily: theme.sans }}>
            {t.tomorrow} · {t.firstTrain}
          </div>
          <Card>{result.routes.map((r, i) => <Row key={i} r={r} last={i === result.routes.length - 1} />)}</Card>
        </div>
      </div>
    );
  } else {
    const [first, ...rest] = result.routes;
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Hero r={first} />
        {rest.length > 0 && <Card>{rest.map((r, i) => <Row key={i} r={r} last={i === rest.length - 1 && result.routes.length >= result.total} />)}</Card>}
        {(result.total > result.routes.length || limit > 4) && (
          <div style={{ display: 'flex', gap: 8 }}>
            {result.total > result.routes.length && (
              <button onClick={() => setLimit(limit + 4)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '13px', background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: theme.radiusSm,
                cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: theme.textMuted, fontFamily: theme.sans }}>
                {t.more}
                <svg width="11" height="11" viewBox="0 0 12 12"><path d="M6 1v10M1 6l5 5 5-5" stroke={theme.textMuted} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            )}
            {limit > 4 && (
              <button onClick={() => setLimit(4)} style={{
                flex: result.total > result.routes.length ? 'none' : 1, padding: '13px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: theme.radiusSm,
                cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: theme.textMuted, fontFamily: theme.sans }}>
                {t.less}
                <svg width="11" height="11" viewBox="0 0 12 12"><path d="M6 11V1M1 6l5-5 5 5" stroke={theme.textMuted} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── fare card ──
  const FareCard = () => (
    <Card style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: theme.text, fontFamily: theme.sans }}>{t.fare}</span>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: theme.accent, padding: '2px 8px', borderRadius: 999, background: hexA(theme.accent, theme.deviceDark ? 0.16 : 0.1), fontFamily: theme.sans }}>{t.flat}</span>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {[[t.adult + ' · ' + t.cash, T.FARE.adultCash], [t.adult + ' · ' + t.ic, T.FARE.adultIC], [t.child, T.FARE.child]].map(([lab, val], i) => (
          <div key={i} style={{ flex: 1, background: theme.surfaceAlt, borderRadius: theme.radiusSm, padding: '9px 10px' }}>
            <div style={{ fontSize: 10.5, color: theme.textMuted, fontFamily: theme.sans, marginBottom: 3 }}>{lab}</div>
            <div style={{ fontFamily: theme.mono, fontWeight: 600, color: theme.text }}>
              <span style={{ fontSize: 12 }}>¥</span><span style={{ fontSize: 19 }}>{val}</span>
              <span style={{ fontSize: 10, color: theme.textFaint, fontFamily: theme.sans }}>{t.forEach}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  // ── header / lang toggle ──
  const langToggle = (
    <div style={{ display: 'flex', background: theme.surfaceAlt, borderRadius: 999, padding: 2, border: `1px solid ${theme.border}` }}>
      {['ja', 'en'].map(L => (
        <button key={L} onClick={() => window.__setTramLang && window.__setTramLang(L)} style={{
          padding: '4px 11px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, fontFamily: theme.sans,
          background: lang === L ? theme.accent : 'transparent', color: lang === L ? theme.accentText : theme.textMuted }}>
          {L === 'ja' ? '日本語' : 'EN'}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ position: 'relative', background: theme.bg, display: 'flex', flexDirection: 'column', fontFamily: theme.sans }}>
      {/* header */}
      <div style={{ padding: '20px 18px 14px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', background: theme.bg, borderBottom: `1px solid ${theme.hairline}` }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {['1', '2', '3', '5', '6'].map(id => <div key={id} style={{ width: 7, height: 7, borderRadius: 2, background: lineColor(id, theme) }} />)}
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: theme.text, letterSpacing: lang === 'en' ? 0 : 0.5 }}>{t.appName}</span>
          </div>
          {(() => {
            const cs = (((nowSec == null ? nowMin * 60 : nowSec) % 86400) + 86400) % 86400;
            const pad = n => String(n).padStart(2, '0');
            const hh = Math.floor(cs / 3600), mm = Math.floor((cs % 3600) / 60), ss = cs % 60;
            return (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: theme.textFaint, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>{lang === 'en' ? 'NOW' : '現在'}</span>
                <span style={{ fontFamily: theme.mono, fontWeight: 700, color: theme.text, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: 21 }}>{hh}:{pad(mm)}</span>
                  <span style={{ fontSize: 15, color: theme.textMuted }}>:{pad(ss)}</span>
                </span>
              </div>
            );
          })()}
        </div>
        {langToggle}
      </div>

      {/* body */}
      <div style={{ padding: '14px 16px 26px' }}>
        {/* selector */}
        <Card style={{ position: 'relative', marginBottom: 16 }}>
          <Field label={t.from} stopId={fromId} kind="from" />
          <div style={{ height: 1, background: theme.hairline, marginLeft: 45 }} />
          <Field label={t.to} stopId={toId} kind="to" />
          <button onClick={swap} title={t.swap} style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: 999,
            background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowSm, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M4 2v9M4 11l-2.2-2.4M4 11l2.2-2.4M12 14V5M12 5l-2.2 2.4M12 5l2.2 2.4" stroke={theme.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </Card>

        {body}

        <div style={{ marginTop: 16 }}><FareCard /></div>

        {/* service status link */}
        <a href="https://www.iyotetsu.co.jp/" target="_blank" rel="noopener" style={{
          display: 'flex', alignItems: 'center', gap: 11, marginTop: 12, padding: '13px 16px', textDecoration: 'none',
          background: theme.surface, borderRadius: theme.radius, border: `1px solid ${theme.border}`, boxShadow: theme.shadowSm }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: hexA(theme.accent, theme.deviceDark ? 0.18 : 0.1) }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.4" stroke={theme.accent} strokeWidth="1.5" /><path d="M8 4.6v3.6l2.4 1.4" stroke={theme.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{t.status}</div>
            <div style={{ fontSize: 11, color: theme.textFaint, marginTop: 1 }}>{t.official}</div>
          </div>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 11L11 3M11 3H5M11 3v6" stroke={theme.textFaint} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>

        {/* estimate footnote (above) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 14, borderTop: `1px solid ${theme.hairline}`, paddingTop: 14 }}>
          <span style={{ fontSize: 11.5, color: theme.textMuted, lineHeight: 1.4 }}>{t.estNote}</span>
        </div>

        {/* about / disclaimer (collapsible, below) */}
        <div style={{ marginTop: 4 }}>
          <button onClick={() => setAboutOpen(o => !o)} style={{
            display: 'flex', alignItems: 'center', gap: 7, width: '100%', background: 'transparent', border: 'none',
            padding: '9px 4px', cursor: 'pointer', fontFamily: theme.sans }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><circle cx="8" cy="8" r="6.4" stroke={theme.textMuted} strokeWidth="1.3" /><path d="M8 7v4M8 4.7v.1" stroke={theme.textMuted} strokeWidth="1.5" strokeLinecap="round" /></svg>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: theme.textMuted }}>{t.about}</span>
            <svg width="10" height="6" viewBox="0 0 10 6" style={{ marginLeft: 'auto', transform: aboutOpen ? 'rotate(180deg)' : 'none', transition: 'transform .18s' }}><path d="M1 1l4 4 4-4" stroke={theme.textFaint} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          {aboutOpen && (
            <div style={{ padding: '2px 6px 6px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 11.5, color: theme.textMuted, lineHeight: 1.65, margin: 0 }}>{t.unofficial}</p>
              <p style={{ fontSize: 11.5, color: theme.textMuted, lineHeight: 1.65, margin: 0 }}>{t.estimateNote2}</p>
              <p style={{ fontSize: 11, color: theme.textFaint, lineHeight: 1.6, margin: 0, fontFamily: theme.mono, letterSpacing: 0.2 }}>{t.dataBasis}</p>
            </div>
          )}
        </div>
      </div>

      {picker && (
        <StopPicker mode={picker} theme={theme} lang={lang} t={t} locationAllowed={locationAllowed}
          onPick={pick} onClose={() => setPicker(null)} />
      )}
    </div>
  );
}

window.TramApp = TramApp;
