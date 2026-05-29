// モジュール5: 経路探索・次発算出（spec 5.3 / 5.4 / 5.6）
// 乗換なし経路を全系統・全便（日中展開後・運休便除外後）から抽出し、
// to 到着時刻が早い順に並べて返す。終電後・始発前・同一電停などの状態を区別する。

import type {
  DayType,
  ResolvedStopTime,
  Route,
  RouteQueryResult,
  RouteResult,
  StopId,
} from "@/types";
import { allRoutes, normalizedSections } from "@/lib/data";
import { concreteTrips, resolveStopTimes } from "@/lib/time-resolver";
import { getDayType, tripRunsOn } from "@/lib/day-type";

// ループ系統(①②)の末尾は1周して松山市駅に戻る合成電停 matsuyamashi-eki-arr
// （stops.json 非掲載）。OD照合・表示では起点電停 matsuyamashi-eki に寄せる。
const LOOP_ARRIVAL_ID: StopId = "matsuyamashi-eki-arr";
const LOOP_ARRIVAL_CANONICAL: StopId = "matsuyamashi-eki";

function canonicalStopId(id: StopId): StopId {
  return id === LOOP_ARRIVAL_ID ? LOOP_ARRIVAL_CANONICAL : id;
}

const MINUTES_PER_DAY = 24 * 60;

export interface FindRoutesOptions {
  now?: Date; // 基準日時。既定は現在。曜日判定と基準時刻の両方に用いる。
  dayType?: DayType; // 明示時は now の曜日判定を上書きする（主にテスト用）。
}

function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

// from→to を乗換なしで満たす便を1件分に切り出す（時刻フィルタ前）。
interface Candidate {
  route: Route;
  board: ResolvedStopTime;
  alight: ResolvedStopTime;
}

/**
 * 指定 DayType に運行する全便から、from→to（from が to より先）の候補を抽出する。
 * - 区間便で to を通らない便、from を通らない便は自然に除外される（spec 5.6 区間便）。
 * - 中間電停発着も resolveStopTimes が補間するため候補になる（spec 5.6 中間電停発）。
 * - ⑥番(weekday_only)は土日祝に tripRunsOn が false を返すため除外される（spec 5.6）。
 */
function extractCandidates(
  from: StopId,
  to: StopId,
  dayType: DayType,
): Candidate[] {
  const out: Candidate[] = [];
  for (const route of allRoutes()) {
    for (const section of normalizedSections(route.id)) {
      for (const trip of concreteTrips(section)) {
        if (!tripRunsOn(route, trip, dayType)) continue;
        const resolved = resolveStopTimes(section, trip);
        const i = resolved.findIndex((r) => canonicalStopId(r.stopId) === from);
        if (i < 0) continue;
        const jRel = resolved
          .slice(i + 1)
          .findIndex((r) => canonicalStopId(r.stopId) === to);
        if (jRel < 0) continue;
        out.push({ route, board: resolved[i], alight: resolved[i + 1 + jRel] });
      }
    }
  }
  return out;
}

// 候補を RouteResult に変換する。dayOffsetMin は翌日案内（終電後）で待ち時間を跨日加算する。
function toRouteResult(
  c: Candidate,
  nowMin: number,
  dayOffsetMin = 0,
): RouteResult {
  return {
    routeId: c.route.id,
    routeName: c.route.name,
    color: c.route.color,
    boardStop: canonicalStopId(c.board.stopId),
    alightStop: canonicalStopId(c.alight.stopId),
    departureTime: c.board.time,
    arrivalTime: c.alight.time,
    durationMin: c.alight.minutes - c.board.minutes,
    isEstimated: c.board.isEstimated || c.alight.isEstimated,
    waitMin: c.board.minutes + dayOffsetMin - nowMin,
  };
}

// spec 5.3 step2: to 到着時刻が早い順（同着は発車順→系統番号順で安定化）。
function byArrival(a: Candidate, b: Candidate): number {
  return (
    a.alight.minutes - b.alight.minutes ||
    a.board.minutes - b.board.minutes ||
    Number(a.route.id) - Number(b.route.id)
  );
}

// 翌日始発案内用: 発車が早い順（同発は到着順→系統番号順）。
function byDeparture(a: Candidate, b: Candidate): number {
  return (
    a.board.minutes - b.board.minutes ||
    a.alight.minutes - b.alight.minutes ||
    Number(a.route.id) - Number(b.route.id)
  );
}

/**
 * 乗換なし経路を探索する（spec 5.3 / 5.4 / 5.6）。
 * 返り値の status で結果状態を区別する（RouteQueryResult を参照）。
 * routes は results/before_first では到着が早い順、after_last では発車が早い順。
 */
export function findRoutes(
  from: StopId,
  to: StopId,
  options: FindRoutesOptions = {},
): RouteQueryResult {
  const now = options.now ?? new Date();
  const nowMin = minutesOfDay(now);
  const dayType = options.dayType ?? getDayType(now);

  if (from === to) return { status: "same_stop", routes: [] };

  const candidates = extractCandidates(from, to, dayType);
  if (candidates.length === 0) {
    // ⑥番(本町線=weekday_only)のみが結ぶODを土日祝に検索した場合は no_route ではなく
    // 運休である旨を返す（spec 5.6）。当該ODは乗換でも到達できないため「乗換が必要」は誤案内になる。
    if (dayType === "saturday_holiday") {
      const weekdayCandidates = extractCandidates(from, to, "weekday");
      if (
        weekdayCandidates.length > 0 &&
        weekdayCandidates.every((c) => c.route.weekday_only === true)
      ) {
        return { status: "suspended_today", routes: [] };
      }
    }
    return { status: "no_route", routes: [] };
  }

  const upcoming = candidates.filter((c) => c.board.minutes >= nowMin);
  if (upcoming.length > 0) {
    const routes = [...upcoming]
      .sort(byArrival)
      .map((c) => toRouteResult(c, nowMin));
    const earliest = Math.min(...candidates.map((c) => c.board.minutes));
    const status = nowMin < earliest ? "before_first" : "results";
    return { status, routes };
  }

  // 終電後（当日の残便なし）: 翌日の始発便を案内する（spec 5.6）。
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextDayType = getDayType(tomorrow);
  const nextCandidates = extractCandidates(from, to, nextDayType);
  const routes = [...nextCandidates]
    .sort(byDeparture)
    .map((c) => toRouteResult(c, nowMin, MINUTES_PER_DAY));
  return { status: "after_last", routes, nextDayType };
}
