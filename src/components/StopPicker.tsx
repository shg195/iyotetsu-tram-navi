// モジュール8: 電停ピッカー（ボトムシート）。バンドル tram-picker.jsx 由来。
// あいまい検索(searchStops)・現在地最寄り(geo)・系統バッジを表示する。

import { useEffect, useRef, useState } from "react";
import type { RouteId, Stop, StopId } from "@/types";
import { allRoutes, allStops, stopById } from "@/lib/data";
import { searchStops } from "@/lib/search";
import type { StopWithDistance } from "@/lib/geo";
import { BOARD_THEME as T } from "@/components/theme";
import { LineBadge } from "@/components/TramAtoms";
import type { Lang, Strings } from "@/components/i18n";

// よく使う電停（バンドル FREQUENT を実データIDへ対応）。
const FREQUENT: StopId[] = [
  "dogo-onsen",
  "matsuyamashi-eki",
  "okaido",
  "jr-matsuyama-ekimae",
  "otemachi-ekimae",
  "komachi",
];

// その電停を通る系統（routes.json の電停順から判定）。
function stopLines(stopId: StopId): RouteId[] {
  const out: RouteId[] = [];
  for (const r of allRoutes()) {
    const orders = [r.stops_order, r.stops_order_outbound, r.stops_order_inbound];
    if (orders.some((o) => o?.includes(stopId))) out.push(r.id);
  }
  return out;
}

interface RowOpts {
  k?: string;
  note?: string | null;
  icon?: React.ReactNode;
}

export function StopPicker({
  mode,
  lang,
  t,
  locationAllowed,
  nearest,
  onPick,
  onClose,
}: {
  mode: "from" | "to";
  lang: Lang;
  t: Strings;
  locationAllowed: boolean;
  nearest: StopWithDistance[];
  onPick: (id: StopId) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 280);
    return () => clearTimeout(id);
  }, []);

  // ボトムシート表示中は背景（本命UI）のスクロール貫通を防ぐ。閉じたら元に戻す。
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const results: Stop[] | null = q.trim() ? searchStops(q) : null;

  const rowBtn = (stopId: StopId, opts: RowOpts = {}) => {
    const s = stopById(stopId);
    if (!s) return null;
    const serving = stopLines(stopId);
    return (
      <button
        key={stopId + (opts.k || "")}
        onClick={() => onPick(stopId)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "100%",
          padding: "13px 18px",
          background: "transparent",
          border: "none",
          borderBottom: `1px solid ${T.hairline}`,
          cursor: "pointer",
          textAlign: "left",
          fontFamily: T.sans,
        }}
      >
        {opts.icon || (
          <div
            style={{
              width: 22,
              height: 22,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: 999,
                border: `2px solid ${T.textFaint}`,
              }}
            />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, color: T.text, fontWeight: 500, lineHeight: 1.25 }}>
            {lang === "en" ? s.romaji : s.name}
            {opts.note && (
              <span style={{ fontSize: 12, color: T.accent, fontWeight: 600, marginLeft: 8 }}>
                {opts.note}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: T.textFaint, marginTop: 2, letterSpacing: 0.2 }}>
            {lang === "en" ? s.name : s.romaji}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {serving.map((id) => (
            <LineBadge key={id} routeId={id} size={18} />
          ))}
        </div>
      </button>
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(20,20,15,0.32)",
          backdropFilter: "blur(2px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          top: 70,
          maxWidth: 440,
          margin: "0 auto",
          background: T.surface,
          borderTopLeftRadius: T.radius + 6,
          borderTopRightRadius: T.radius + 6,
          boxShadow: "0 -10px 40px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "sheetUp 0.32s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* handle + header */}
        <div style={{ padding: "10px 18px 10px", flexShrink: 0 }}>
          <div
            style={{
              width: 40,
              height: 5,
              borderRadius: 999,
              background: T.border,
              margin: "0 auto 12px",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.text, fontFamily: T.sans }}>
              {mode === "from" ? t.pickFrom : t.pickTo}
            </div>
            <button
              onClick={onClose}
              aria-label={lang === "en" ? "Close" : "閉じる"}
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                background: T.surfaceAlt,
                color: T.textMuted,
                fontSize: 16,
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: T.sans,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* search */}
        <div style={{ padding: "4px 18px 12px", flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: T.surfaceAlt,
              border: `1px solid ${T.border}`,
              borderRadius: T.radiusSm,
              padding: "0 12px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="7" cy="7" r="5" stroke={T.textFaint} strokeWidth="1.6" />
              <path d="M11 11l3.5 3.5" stroke={T.textFaint} strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.searchPh}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                padding: "11px 0",
                fontSize: 16, // iOS Safari のフォーカス時自動ズーム回避（16px未満で発生）
                color: T.text,
                fontFamily: T.sans,
              }}
            />
            {q && (
              <button
                onClick={() => setQ("")}
                style={{
                  border: "none",
                  background: "transparent",
                  color: T.textFaint,
                  cursor: "pointer",
                  fontSize: 15,
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* list */}
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          {results ? (
            results.length ? (
              results.map((s) => rowBtn(s.id))
            ) : (
              <div
                style={{
                  padding: "32px 18px",
                  textAlign: "center",
                  color: T.textFaint,
                  fontSize: 14,
                  fontFamily: T.sans,
                }}
              >
                {t.noMatch}
              </div>
            )
          ) : (
            <div>
              {mode === "from" &&
                (locationAllowed && nearest.length > 0 ? (
                  <div style={{ padding: "4px 0 6px" }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: T.textMuted,
                        textTransform: "uppercase",
                        letterSpacing: 0.6,
                        padding: "6px 18px 8px",
                        fontFamily: T.sans,
                      }}
                    >
                      {t.useNearest}
                    </div>
                    {nearest.slice(0, 3).map((n, i) =>
                      rowBtn(n.stop.id, {
                        k: "near",
                        note: i === 0 ? t.near : null,
                        icon: (
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <circle cx="8" cy="8" r="3" fill={i === 0 ? T.accent : T.textFaint} />
                              <circle
                                cx="8"
                                cy="8"
                                r="6.5"
                                stroke={i === 0 ? T.accent : T.textFaint}
                                strokeOpacity="0.4"
                                strokeWidth="1.4"
                              />
                            </svg>
                          </div>
                        ),
                      }),
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      margin: "4px 18px 10px",
                      padding: "12px 14px",
                      background: T.surfaceAlt,
                      borderRadius: T.radiusSm,
                      border: `1px dashed ${T.border}`,
                    }}
                  >
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text, fontFamily: T.sans }}>
                      {t.locDenied}
                    </div>
                    <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 3, fontFamily: T.sans }}>
                      {t.locDeniedBody}
                    </div>
                  </div>
                ))}
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: T.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  padding: "10px 18px 8px",
                  fontFamily: T.sans,
                }}
              >
                {t.recent}
              </div>
              {FREQUENT.map((id) => rowBtn(id, { k: "freq" }))}
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: T.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  padding: "10px 18px 8px",
                  fontFamily: T.sans,
                }}
              >
                {t.allStops}
              </div>
              {allStops().map((s) => rowBtn(s.id, { k: "all" }))}
              <div style={{ height: 20 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
