"use client";

// モジュール8: 画面本体（バンドル tram-app.jsx 由来、方向A「時刻表ボード」＋白地ヒーロー）。
// 既存lib（findRoutes/locateNearestStops/getFare/direction/data）に配線する。
// デモ用Tweaksパネルは本番では持たず、実時刻・実Geolocation・実曜日判定を使う。

import { useEffect, useMemo, useRef, useState } from "react";
import type { RouteId, RouteResult, StopId } from "@/types";
import { stopById } from "@/lib/data";
import { findRoutes } from "@/lib/route-search";
import { getFare } from "@/lib/fare";
import { rollSign, viaPath } from "@/lib/direction";
import { locateNearestStops } from "@/lib/geo";
import type { StopWithDistance } from "@/lib/geo";
import { BOARD_THEME as T, HERO_WHITE as HV, hexA } from "@/components/theme";
import { LineBadge, lineColor, fmtWait } from "@/components/TramAtoms";
import { StopPicker } from "@/components/StopPicker";
import { STRINGS, type Lang } from "@/components/i18n";

const SERVICE_STATUS_URL = "https://www.iyotetsu.co.jp/";

function stopName(id: StopId | null, lang: Lang): string {
  if (!id) return "";
  const s = stopById(id);
  if (!s) return id;
  return lang === "en" ? s.romaji : s.name;
}

// 系統の正式線名（"③番 松山市駅線" → "松山市駅線"）。バッジが番号を担うため番号接頭を外す。
function lineLabel(routeName: string): string {
  return routeName.replace(/^.番\s*/, "");
}

export function TramApp() {
  const [lang, setLang] = useState<Lang>("ja");
  const t = STRINGS[lang];

  const [fromId, setFromId] = useState<StopId | null>(null);
  const [toId, setToId] = useState<StopId | null>(null);
  const [usingNearest, setUsingNearest] = useState(false);
  const [picker, setPicker] = useState<"from" | "to" | null>(null);
  const [limit, setLimit] = useState(4);
  const [openRoutes, setOpenRoutes] = useState<Record<string, boolean>>({});
  const [heroVia, setHeroVia] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const [locationAllowed, setLocationAllowed] = useState(false);
  const [nearest, setNearest] = useState<StopWithDistance[]>([]);

  // 現在地→最寄り電停。許可時は出発を最寄りに自動設定（spec 2.1 #7）。
  const initialFromSet = useRef(false);
  useEffect(() => {
    let active = true;
    locateNearestStops(5).then((res) => {
      if (!active) return;
      if (res.status === "ok" && res.stops.length > 0) {
        setLocationAllowed(true);
        setNearest(res.stops);
        if (!initialFromSet.current && fromId == null) {
          initialFromSet.current = true;
          setFromId(res.stops[0].stop.id);
          setUsingNearest(true);
        }
      } else {
        setLocationAllowed(false);
      }
    });
    return () => {
      active = false;
    };
    // 初回マウント時のみ実行（位置情報は一度だけ取得）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ライブ時計（秒、spec 6.1.3）。
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const result = useMemo(
    () => (fromId && toId ? findRoutes(fromId, toId, { now }) : null),
    [fromId, toId, now],
  );

  const pick = (id: StopId) => {
    if (picker === "from") {
      setFromId(id);
      setUsingNearest(nearest.length > 0 && id === nearest[0].stop.id);
    } else {
      setToId(id);
    }
    setLimit(4);
    setOpenRoutes({});
    setPicker(null);
  };
  const swap = () => {
    setFromId(toId);
    setToId(fromId);
    setUsingNearest(false);
    setLimit(4);
    setOpenRoutes({});
  };

  // ── 出発/到着 選択フィールド ──
  const Field = ({
    label,
    stopId,
    kind,
  }: {
    label: string;
    stopId: StopId | null;
    kind: "from" | "to";
  }) => {
    const filled = !!stopId;
    return (
      <button
        onClick={() => setPicker(kind)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 13,
          width: "100%",
          textAlign: "left",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "14px 16px",
          fontFamily: T.sans,
        }}
      >
        <div style={{ width: 16, display: "flex", justifyContent: "center", flexShrink: 0 }}>
          {kind === "from" ? (
            <div
              style={{ width: 11, height: 11, borderRadius: 999, border: `3px solid ${T.accent}` }}
            />
          ) : (
            <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
              <path
                d="M7 0C3.1 0 0 3 0 6.8 0 11.8 7 16 7 16s7-4.2 7-9.2C14 3 10.9 0 7 0z"
                fill={T.accent}
              />
              <circle cx="7" cy="6.6" r="2.5" fill={T.surface} />
            </svg>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: T.textMuted,
              letterSpacing: 0.6,
              textTransform: "uppercase",
            }}
          >
            {label}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
            <span
              style={{
                fontSize: 19,
                fontWeight: 600,
                color: filled ? T.text : T.textFaint,
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {filled ? stopName(stopId, lang) : kind === "from" ? t.pickFrom : t.pickTo}
            </span>
            {kind === "from" && usingNearest && filled && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 11,
                  fontWeight: 600,
                  color: T.accent,
                  flexShrink: 0,
                }}
              >
                <svg width="9" height="9" viewBox="0 0 9 9">
                  <circle cx="4.5" cy="4.5" r="2" fill={T.accent} />
                  <circle
                    cx="4.5"
                    cy="4.5"
                    r="4"
                    stroke={T.accent}
                    strokeOpacity="0.4"
                    strokeWidth="1"
                    fill="none"
                  />
                </svg>
                {t.near}
              </span>
            )}
          </div>
        </div>
        <svg width="7" height="12" viewBox="0 0 7 12" style={{ flexShrink: 0 }}>
          <path
            d="M1 1l5 5-5 5"
            stroke={T.textFaint}
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    );
  };

  // ── 時刻行（発→着・所要） ──
  const timesLine = (r: RouteResult, big: boolean) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        fontFamily: T.mono,
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: big ? 15 : 13, fontWeight: 600, color: big ? HV.text : T.text }}>
        {r.departureTime}
      </span>
      <span style={{ fontSize: big ? 11 : 10, color: big ? HV.muted : T.textMuted, fontFamily: T.sans }}>
        {t.depart}
      </span>
      <span style={{ fontSize: big ? 12 : 11, color: big ? HV.muted : T.textFaint }}>→</span>
      <span style={{ fontSize: big ? 14 : 12.5, fontWeight: 500, color: big ? HV.muted : T.textMuted }}>
        {r.isEstimated ? "≈" : ""}
        {r.arrivalTime}
      </span>
      <span style={{ fontSize: big ? 11 : 10, color: big ? HV.muted : T.textFaint, fontFamily: T.sans }}>
        {t.arrive}
      </span>
      <span
        style={{
          width: 1,
          height: 11,
          background: big ? HV.muted : T.hairline,
          opacity: 0.5,
          margin: "0 1px",
        }}
      />
      <span style={{ fontSize: big ? 13 : 12, fontWeight: 600, color: big ? HV.muted : T.textMuted }}>
        {r.durationMin}
        {lang === "en" ? " min" : "分"}
      </span>
    </div>
  );

  const isLoop = (routeId: RouteId) => routeId === "1" || routeId === "2";

  // ── 次発（主役）カード ──
  const Hero = ({ r }: { r: RouteResult }) => {
    const soonNow = r.waitMin <= 0;
    const heroBorder = `3px solid ${lineColor(r.routeId)}`;
    const pathNames = viaPath(r.routeId, r.boardStop, r.alightStop, lang).join(" → ");
    return (
      <div
        style={{
          borderRadius: T.radius,
          padding: "17px 19px 16px",
          position: "relative",
          overflow: "hidden",
          background: HV.bg,
          boxShadow: HV.shadow,
          border: heroBorder,
        }}
      >
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
            <LineBadge routeId={r.routeId} size={26} />
            <span
              style={{
                flex: "1 1 auto",
                fontSize: 16,
                fontWeight: 700,
                color: HV.text,
                fontFamily: T.sans,
                whiteSpace: "nowrap",
              }}
            >
              {rollSign(r.routeId, r.boardStop, r.alightStop, lang)}
            </span>
            {!isLoop(r.routeId) && lang === "ja" && (
              <span style={{ fontSize: 11, color: HV.muted, fontFamily: T.sans, flexShrink: 0 }}>
                {lineLabel(r.routeName)}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 12 }}>
            {soonNow ? (
              <span
                style={{
                  fontSize: 40,
                  fontWeight: 700,
                  color: HV.num,
                  fontFamily: T.sans,
                  lineHeight: 1,
                  letterSpacing: -0.5,
                }}
              >
                {t.now}
              </span>
            ) : (
              <>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: HV.muted,
                    fontFamily: T.sans,
                    marginBottom: 9,
                  }}
                >
                  {t.soon}
                </span>
                <span
                  style={{
                    fontSize: HV.numSize,
                    fontWeight: 700,
                    color: HV.num,
                    fontFamily: T.mono,
                    lineHeight: 0.78,
                    letterSpacing: -1.5,
                  }}
                >
                  {r.waitMin}
                </span>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: HV.muted,
                    fontFamily: T.sans,
                    marginBottom: 9,
                  }}
                >
                  {t.min}
                </span>
              </>
            )}
          </div>
          {timesLine(r, true)}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button
              onClick={() => setHeroVia((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: HV.muted,
                fontFamily: T.sans,
                fontSize: 11.5,
                fontWeight: 600,
              }}
            >
              {t.via}
              <svg
                width="9"
                height="6"
                viewBox="0 0 10 6"
                style={{ transform: heroVia ? "rotate(180deg)" : "none", transition: "transform .18s" }}
              >
                <path
                  d="M1 1l4 4 4-4"
                  stroke={HV.muted}
                  strokeWidth="1.6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          {heroVia && (
            <div style={{ marginTop: 8, fontSize: 12.5, color: HV.text, lineHeight: 1.7 }}>
              {pathNames}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── 一覧の各便（待ち時間 or 発車時刻） ──
  const Row = ({ r, idx, last, showClock }: { r: RouteResult; idx: number; last: boolean; showClock: boolean }) => {
    const rid = idx + "_" + r.departureTime + "_" + r.routeId;
    const open = !!openRoutes[rid];
    return (
      <div style={{ borderBottom: last ? "none" : `1px solid ${T.hairline}` }}>
        <button
          onClick={() => setOpenRoutes((p) => ({ ...p, [rid]: !p[rid] }))}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            textAlign: "left",
            padding: "13px 16px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: T.sans,
          }}
        >
          <LineBadge routeId={r.routeId} size={26} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 14.5,
                  fontWeight: 700,
                  color: T.text,
                  lineHeight: 1.25,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {rollSign(r.routeId, r.boardStop, r.alightStop, lang)}
              </span>
              <span
                style={{
                  flexShrink: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: T.accent,
                  fontFamily: T.sans,
                }}
              >
                {showClock ? r.departureTime : fmtWait(r.waitMin, lang, t)}
              </span>
            </div>
            <div style={{ marginTop: 4 }}>{timesLine(r, false)}</div>
          </div>
          <svg
            width="6"
            height="11"
            viewBox="0 0 7 12"
            style={{ flexShrink: 0, transform: open ? "rotate(90deg)" : "none", transition: "transform .18s" }}
          >
            <path
              d="M1 1l5 5-5 5"
              stroke={T.textFaint}
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {open && (
          <div style={{ padding: "0 16px 14px 54px", fontFamily: T.sans }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.4, marginBottom: 4 }}>
              {t.via}
            </div>
            <div style={{ fontSize: 12.5, color: T.text, lineHeight: 1.7 }}>
              {viaPath(r.routeId, r.boardStop, r.alightStop, lang).join(" → ")}
            </div>
          </div>
        )}
      </div>
    );
  };

  const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div
      style={{
        background: T.surface,
        borderRadius: T.radius,
        boxShadow: T.shadowSm,
        border: `1px solid ${T.border}`,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );

  const Notice = ({ title, body, tone }: { title: string; body: string; tone?: "warn" }) => (
    <Card style={{ padding: "18px 18px" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 999,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: tone === "warn" ? hexA(T.accent, 0.14) : T.surfaceAlt,
            color: T.accent,
            fontSize: 16,
            fontWeight: 700,
            fontFamily: T.mono,
          }}
        >
          i
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: T.sans }}>{title}</div>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4, lineHeight: 1.5, fontFamily: T.sans }}>
            {body}
          </div>
        </div>
      </div>
    </Card>
  );

  const MoreLess = ({ shown, total }: { shown: number; total: number }) =>
    total > shown || limit > 4 ? (
      <div style={{ display: "flex", gap: 8 }}>
        {total > shown && (
          <button
            onClick={() => setLimit(limit + 4)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              padding: "13px",
              background: "transparent",
              border: `1px solid ${T.border}`,
              borderRadius: T.radiusSm,
              cursor: "pointer",
              fontSize: 13.5,
              fontWeight: 600,
              color: T.textMuted,
              fontFamily: T.sans,
            }}
          >
            {t.more}
            <svg width="11" height="11" viewBox="0 0 12 12">
              <path d="M6 1v10M1 6l5 5 5-5" stroke={T.textMuted} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        {limit > 4 && (
          <button
            onClick={() => setLimit(4)}
            style={{
              flex: total > shown ? "none" : 1,
              padding: "13px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              background: "transparent",
              border: `1px solid ${T.border}`,
              borderRadius: T.radiusSm,
              cursor: "pointer",
              fontSize: 13.5,
              fontWeight: 600,
              color: T.textMuted,
              fontFamily: T.sans,
            }}
          >
            {t.less}
            <svg width="11" height="11" viewBox="0 0 12 12">
              <path d="M6 11V1M1 6l5-5 5 5" stroke={T.textMuted} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    ) : null;

  // ── 結果本体 ──
  let body: React.ReactNode;
  if (!result) {
    body = <Notice title={t.appName} body={t.selectBoth} />;
  } else if (result.status === "same_stop") {
    body = <Notice title={t.sameTitle} body={t.sameBody} tone="warn" />;
  } else if (result.status === "no_route") {
    body = <Notice title={t.noneTitle} body={t.noneBody} tone="warn" />;
  } else if (result.status === "after_last") {
    const shown = result.routes.slice(0, limit);
    body = (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Notice title={t.endedTitle} body={t.endedBody} tone="warn" />
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: T.textMuted,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              padding: "0 4px 8px",
              fontFamily: T.sans,
            }}
          >
            {t.tomorrow} · {t.firstTrain}
          </div>
          <Card>
            {shown.map((r, i) => (
              <Row key={i} r={r} idx={i} last={i === shown.length - 1} showClock />
            ))}
          </Card>
        </div>
        <MoreLess shown={shown.length} total={result.routes.length} />
      </div>
    );
  } else {
    // results / before_first: 次発(主役) + 以降の便（待ち時間表示）。
    const shown = result.routes.slice(0, limit);
    const [first, ...rest] = shown;
    body = (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {result.status === "before_first" && (
          <Notice title={t.beforeFirstTitle} body={t.beforeFirstBody} />
        )}
        {first && <Hero r={first} />}
        {rest.length > 0 && (
          <Card>
            {rest.map((r, i) => (
              <Row key={i} r={r} idx={i + 1} last={i === rest.length - 1} showClock={false} />
            ))}
          </Card>
        )}
        <MoreLess shown={shown.length} total={result.routes.length} />
      </div>
    );
  }

  // ── 運賃カード（大人/小児 × 現金/IC、均一運賃 spec 3.7） ──
  const fare = getFare();
  const fareCells: [string, number][] = [
    [`${t.adult} · ${t.cash}`, fare.adultCash],
    [`${t.adult} · ${t.ic}`, fare.adultIc],
    [`${t.child} · ${t.cash}`, fare.childCash],
    [`${t.child} · ${t.ic}`, fare.childIc],
  ];
  const FareCard = () => (
    <Card style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: T.sans }}>{t.fare}</span>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: T.accent,
            padding: "2px 8px",
            borderRadius: 999,
            background: hexA(T.accent, 0.1),
            fontFamily: T.sans,
          }}
        >
          {t.flat}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {fareCells.map(([lab, val], i) => (
          <div key={i} style={{ flex: 1, background: T.surfaceAlt, borderRadius: T.radiusSm, padding: "9px 8px" }}>
            <div style={{ fontSize: 10, color: T.textMuted, fontFamily: T.sans, marginBottom: 3, whiteSpace: "nowrap" }}>
              {lab}
            </div>
            <div style={{ fontFamily: T.mono, fontWeight: 600, color: T.text }}>
              <span style={{ fontSize: 11 }}>¥</span>
              <span style={{ fontSize: 18 }}>{val}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  // ── 現在時刻（秒表示、spec 6.1.3） ──
  const pad = (n: number) => String(n).padStart(2, "0");
  const hh = now.getHours();
  const mm = now.getMinutes();
  const ss = now.getSeconds();

  return (
    <div
      style={{
        position: "relative",
        background: T.bg,
        display: "flex",
        flexDirection: "column",
        fontFamily: T.sans,
        maxWidth: 440,
        margin: "0 auto",
        minHeight: "100vh",
        boxShadow: "0 0 60px rgba(20,20,15,0.09)",
      }}
    >
      {/* header */}
      <div
        style={{
          padding: "20px 18px 14px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          background: T.bg,
          borderBottom: `1px solid ${T.hairline}`,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ display: "flex", gap: 3 }}>
              {(["1", "2", "3", "5", "6"] as RouteId[]).map((id) => (
                <div key={id} style={{ width: 7, height: 7, borderRadius: 2, background: lineColor(id) }} />
              ))}
            </div>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: T.text,
                letterSpacing: lang === "en" ? 0 : 0.5,
              }}
            >
              {t.appName}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.textFaint, letterSpacing: 0.3, whiteSpace: "nowrap" }}>
              {lang === "en" ? "NOW" : "現在"}
            </span>
            <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.text, letterSpacing: 0.3, whiteSpace: "nowrap" }}>
              <span style={{ fontSize: 21 }}>
                {hh}:{pad(mm)}
              </span>
              <span style={{ fontSize: 15, color: T.textMuted }}>:{pad(ss)}</span>
            </span>
          </div>
        </div>
        <div style={{ display: "flex", background: T.surfaceAlt, borderRadius: 999, padding: 2, border: `1px solid ${T.border}` }}>
          {(["ja", "en"] as Lang[]).map((L) => (
            <button
              key={L}
              onClick={() => setLang(L)}
              style={{
                padding: "4px 11px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                fontSize: 11.5,
                fontWeight: 700,
                fontFamily: T.sans,
                background: lang === L ? T.accent : "transparent",
                color: lang === L ? T.accentText : T.textMuted,
              }}
            >
              {L === "ja" ? "日本語" : "EN"}
            </button>
          ))}
        </div>
      </div>

      {/* body */}
      <div style={{ padding: "14px 16px 26px" }}>
        {/* selector */}
        <Card style={{ position: "relative", marginBottom: 16 }}>
          <Field label={t.from} stopId={fromId} kind="from" />
          <div style={{ height: 1, background: T.hairline, marginLeft: 45 }} />
          <Field label={t.to} stopId={toId} kind="to" />
          <button
            onClick={swap}
            title={t.swap}
            aria-label={t.swap}
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              width: 36,
              height: 36,
              borderRadius: 999,
              background: T.surface,
              border: `1px solid ${T.border}`,
              boxShadow: T.shadowSm,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 2v9M4 11l-2.2-2.4M4 11l2.2-2.4M12 14V5M12 5l-2.2 2.4M12 5l2.2 2.4"
                stroke={T.textMuted}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </Card>

        {body}

        <div style={{ marginTop: 16 }}>
          <FareCard />
        </div>

        {/* 運行情報リンク（spec 6.3） */}
        <a
          href={SERVICE_STATUS_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            marginTop: 12,
            padding: "13px 16px",
            textDecoration: "none",
            background: T.surface,
            borderRadius: T.radius,
            border: `1px solid ${T.border}`,
            boxShadow: T.shadowSm,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: hexA(T.accent, 0.1),
            }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.4" stroke={T.accent} strokeWidth="1.5" />
              <path d="M8 4.6v3.6l2.4 1.4" stroke={T.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{t.status}</div>
            <div style={{ fontSize: 11, color: T.textFaint, marginTop: 1 }}>{t.official}</div>
          </div>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M3 11L11 3M11 3H5M11 3v6" stroke={T.textFaint} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>

        {/* 推定値の常時フットノート（spec 6.4） */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginTop: 14,
            borderTop: `1px solid ${T.hairline}`,
            paddingTop: 14,
          }}
        >
          <span style={{ fontSize: 11.5, color: T.textMuted, lineHeight: 1.4 }}>{t.estNote}</span>
        </div>

        {/* このページについて（免責・畳み、spec 6.4） */}
        <div style={{ marginTop: 4 }}>
          <button
            onClick={() => setAboutOpen((o) => !o)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              width: "100%",
              background: "transparent",
              border: "none",
              padding: "9px 4px",
              cursor: "pointer",
              fontFamily: T.sans,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="8" cy="8" r="6.4" stroke={T.textMuted} strokeWidth="1.3" />
              <path d="M8 7v4M8 4.7v.1" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: T.textMuted }}>{t.about}</span>
            <svg
              width="10"
              height="6"
              viewBox="0 0 10 6"
              style={{ marginLeft: "auto", transform: aboutOpen ? "rotate(180deg)" : "none", transition: "transform .18s" }}
            >
              <path d="M1 1l4 4 4-4" stroke={T.textFaint} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {aboutOpen && (
            <div style={{ padding: "2px 6px 6px", display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 11.5, color: T.textMuted, lineHeight: 1.65, margin: 0 }}>{t.unofficial}</p>
              <p style={{ fontSize: 11.5, color: T.textMuted, lineHeight: 1.65, margin: 0 }}>{t.estimateNote2}</p>
              <p
                style={{
                  fontSize: 11,
                  color: T.textFaint,
                  lineHeight: 1.6,
                  margin: 0,
                  fontFamily: T.mono,
                  letterSpacing: 0.2,
                }}
              >
                {t.dataBasis}
              </p>
            </div>
          )}
        </div>
      </div>

      {picker && (
        <StopPicker
          mode={picker}
          lang={lang}
          t={t}
          locationAllowed={locationAllowed}
          nearest={nearest}
          onPick={pick}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
