// モジュール2: 時刻解決ロジック（spec 3.4 / 3.5 / 5.2）
// - 日中便(daytime_pattern)を個別便に展開する
// - segments で中間電停を補間する
// - 便ごとの全電停時刻を、記載済み(公式)と中間(計算値)を区別して順序付きで解決する

import type {
  DaytimePattern,
  NormalizedSection,
  ResolvedStopTime,
  StopId,
  TimeStr,
  Trip,
} from "@/types";
import { segmentsByRoute } from "@/lib/data";
import { formatMinutes, parseTimeStr } from "@/lib/time";

/**
 * daytime_pattern を個別便に展開する（spec 3.4）。
 * origin の first_departure〜last_departure を interval_min 毎に刻み、
 * 各便の停車時刻を origin発時刻 + segment_offsets_from_origin で生成する。
 * 生成される stops は記載済み電停のみ（中間電停は resolveStopTimes で補間）。
 */
export function expandDaytime(pattern: DaytimePattern): Trip[] {
  const start = parseTimeStr(pattern.first_departure);
  const end = parseTimeStr(pattern.last_departure);
  const offsets = pattern.segment_offsets_from_origin;

  const trips: Trip[] = [];
  for (let t0 = start; t0 <= end; t0 += pattern.interval_min) {
    const stops: Record<StopId, TimeStr> = {};
    for (const [stopId, offset] of Object.entries(offsets)) {
      stops[stopId] = formatMinutes(t0 + offset);
    }
    trips.push({
      trip: `D${formatMinutes(t0)}`,
      origin: pattern.origin,
      saturday_holiday_suspended: pattern.saturday_holiday_suspended,
      stops,
    });
  }
  return trips;
}

/**
 * セクションの全具体便を返す（早朝 + 日中展開 + 夜間 + 明示便）。
 * 各便の stops は記載済み電停のみ。中間電停の補間は resolveStopTimes で行う。
 */
export function concreteTrips(section: NormalizedSection): Trip[] {
  return [
    ...section.earlyMorningTrips,
    ...(section.daytimePattern ? expandDaytime(section.daytimePattern) : []),
    ...section.nightTrips,
    ...(section.explicitTrips ?? []),
  ];
}

/**
 * 便の全電停時刻を解決する（spec 5.2）。
 * - 記載済み電停: trip.stops の時刻（isEstimated=false）。
 * - 中間電停: segments の「区間始点の記載済み電停時刻 + offset」（isEstimated=true）。
 *   区間の前後電停(between[a,b])が両方この便に存在するときのみ補間する（区間便で通らない区間は補間しない）。
 * 返り値は section.stopsInOrder の順序に整列する。
 */
export function resolveStopTimes(
  section: NormalizedSection,
  trip: Trip,
): ResolvedStopTime[] {
  const resolved = new Map<StopId, ResolvedStopTime>();

  // 記載済み電停（公式時刻）
  for (const [stopId, t] of Object.entries(trip.stops)) {
    const minutes = parseTimeStr(t);
    resolved.set(stopId, { stopId, minutes, time: t, isEstimated: false });
  }

  // 中間電停の補間（spec 3.5）
  // segments は route 単位で方向を区別しない。双方向系統(③⑤⑥)は同一区間が往復で
  // 逆順に現れるため、この便の進行方向(section.stopsInOrder)で a→b が順方向の区間だけ
  // を適用する。逆方向便に逆順区間が誤適用され Map.set で上書きされるのを防ぐ
  // （ループ系統①②は全区間が順方向のため影響なし）。
  for (const seg of segmentsByRoute(section.routeId)) {
    const [a, b] = seg.between;
    const startTime = trip.stops[a];
    if (startTime === undefined || trip.stops[b] === undefined) continue;
    const ai = section.stopsInOrder.indexOf(a);
    const bi = section.stopsInOrder.indexOf(b);
    if (ai < 0 || bi < 0 || ai >= bi) continue;
    const startMin = parseTimeStr(startTime);
    for (const mid of seg.intermediate) {
      const minutes = startMin + mid.offset_from_start_min;
      resolved.set(mid.stop, {
        stopId: mid.stop,
        minutes,
        time: formatMinutes(minutes),
        isEstimated: true,
      });
    }
  }

  // section.stopsInOrder の順序で整列（この便に存在する電停のみ）
  return section.stopsInOrder
    .filter((id) => resolved.has(id))
    .map((id) => resolved.get(id)!);
}
