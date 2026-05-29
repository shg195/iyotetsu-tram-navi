// モジュール1: データ読み込み・正規化層
// data/*.json を型付きでロードし、電停・系統・便のアクセサと正規化ビューを提供する。
// 日中便の展開・中間電停の補間は行わない（モジュール2）。

import type {
  RouteId,
  Stop,
  StopId,
  StopsFile,
  Route,
  RoutesFile,
  TimetableFile,
  Segment,
  SegmentsFile,
  NormalizedSection,
} from "@/types";
import { isLoopTimetableFile, isExplicitDirectionTimetable } from "@/types";

import stopsJson from "../../data/stops.json";
import routesJson from "../../data/routes.json";
import segmentsJson from "../../data/segments.json";
import timetable1Json from "../../data/timetable_route1.json";
import timetable2Json from "../../data/timetable_route2.json";
import timetable3Json from "../../data/timetable_route3.json";
import timetable5Json from "../../data/timetable_route5.json";
import timetable6Json from "../../data/timetable_route6.json";

// JSON は data の境界。確定済み（原本照合済み）データのため、ここで自前の型へ確定する。
const stopsFile = stopsJson as unknown as StopsFile;
const routesFile = routesJson as unknown as RoutesFile;
const segmentsFile = segmentsJson as unknown as SegmentsFile;

const timetableFiles: Record<RouteId, TimetableFile> = {
  "1": timetable1Json as unknown as TimetableFile,
  "2": timetable2Json as unknown as TimetableFile,
  "3": timetable3Json as unknown as TimetableFile,
  "5": timetable5Json as unknown as TimetableFile,
  "6": timetable6Json as unknown as TimetableFile,
};

// ===== ルックアップ用マップ =====

const stopByIdMap: ReadonlyMap<StopId, Stop> = new Map(
  stopsFile.stops.map((s) => [s.id, s]),
);

const routeByIdMap: ReadonlyMap<RouteId, Route> = new Map(
  routesFile.routes.map((r) => [r.id, r]),
);

const segmentsByRouteMap: ReadonlyMap<RouteId, Segment[]> = new Map(
  segmentsFile.interpolations.map((ip) => [ip.route_id, ip.segments]),
);

// ===== 電停アクセサ =====

/** 全電停（stops.json の並び順）。 */
export function allStops(): readonly Stop[] {
  return stopsFile.stops;
}

/** id で電停を引く。存在しなければ undefined。 */
export function stopById(id: StopId): Stop | undefined {
  return stopByIdMap.get(id);
}

/** 電停idが存在するか。 */
export function stopExists(id: StopId): boolean {
  return stopByIdMap.has(id);
}

// ===== 系統アクセサ =====

/** 全系統（routes.json の並び順、①②③⑤⑥）。 */
export function allRoutes(): readonly Route[] {
  return routesFile.routes;
}

/** id で系統を引く。存在しなければ undefined。 */
export function routeById(id: RouteId): Route | undefined {
  return routeByIdMap.get(id);
}

// ===== segments（派生データ）アクセサ =====

/** 系統の補間区間定義。無ければ空配列。 */
export function segmentsByRoute(id: RouteId): readonly Segment[] {
  return segmentsByRouteMap.get(id) ?? [];
}

// ===== timetable アクセサ =====

/** 系統の timetable（生の型付きファイル、3形態のいずれか）。 */
export function timetableByRoute(id: RouteId): TimetableFile {
  return timetableFiles[id];
}

/**
 * 系統の timetable を、3形態を吸収した NormalizedSection[] に正規化する。
 * - ループ系統(①②): directionKey="loop" の1セクション。
 * - 双方向展開系統(③⑤): directions のキーごとにセクション。
 * - 双方向明示系統(⑥): directions のキーごと、explicitTrips に全便。
 */
export function normalizedSections(id: RouteId): NormalizedSection[] {
  const file = timetableFiles[id];

  if (isLoopTimetableFile(file)) {
    return [
      {
        routeId: id,
        directionKey: "loop",
        stopsInOrder: file.stops_in_order,
        earlyMorningTrips: file.early_morning_trips,
        daytimePattern: file.daytime_pattern,
        nightTrips: file.night_trips,
      },
    ];
  }

  return Object.entries(file.directions).map(([directionKey, dir]) => {
    if (isExplicitDirectionTimetable(dir)) {
      return {
        routeId: id,
        directionKey,
        stopsInOrder: dir.stops_in_order,
        earlyMorningTrips: [],
        nightTrips: [],
        explicitTrips: dir.trips,
      };
    }
    return {
      routeId: id,
      directionKey,
      stopsInOrder: dir.stops_in_order,
      earlyMorningTrips: dir.early_morning_trips,
      daytimePattern: dir.daytime_pattern,
      nightTrips: dir.night_trips,
    };
  });
}

/** 全系統の NormalizedSection をまとめて返す。 */
export function allNormalizedSections(): NormalizedSection[] {
  return allRoutes().flatMap((r) => normalizedSections(r.id));
}
