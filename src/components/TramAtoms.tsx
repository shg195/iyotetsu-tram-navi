// モジュール8: 系統バッジ・色・待ち時間整形（バンドル tram-atoms.jsx 由来）。
// 系統色は一次データ(routes.json)を正とする。

import type { RouteId } from "@/types";
import { routeById } from "@/lib/data";
import { BOARD_THEME } from "@/components/theme";
import type { Lang, Strings } from "@/components/i18n";

/** 系統色（routes.json）。未定義系統は黒にフォールバック。 */
export function lineColor(routeId: RouteId): string {
  return routeById(routeId)?.color ?? "#1a1a17";
}

/** 系統番号バッジ（色付き角丸の中に数字）。 */
export function LineBadge({
  routeId,
  size = 28,
}: {
  routeId: RouteId;
  size?: number;
}) {
  const col = lineColor(routeId);
  const fs = Math.round(size * 0.52);
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: BOARD_THEME.mono,
        fontWeight: 600,
        fontSize: fs,
        borderRadius: BOARD_THEME.radiusChip,
        lineHeight: 1,
        boxSizing: "border-box",
        background: col,
        color: "#fff",
      }}
    >
      {routeId}
    </div>
  );
}

/** 待ち時間の整形（spec 6.2: 分単位・推定）。0以下は「まもなく」。 */
export function fmtWait(waitMin: number, lang: Lang, t: Strings): string {
  if (waitMin <= 0) return t.now;
  return lang === "en" ? `${t.soon} ${waitMin} ${t.min}` : `あと${waitMin}分`;
}
