// 伊予鉄道 市内電車 案内アプリ 共有型定義（モジュール0で確定）
// spec.md 第4章を正式確定したもの。生データ型のフィールド名は data/*.json に一致させる。
// 詳細な規約は docs/conventions.md を参照。

// ===== 基本エイリアス =====

/** 電停ID（例 "dogo-onsen"）。stops.json の id に一致。 */
export type StopId = string;

/** 系統ID。④番は欠番（spec 1.2）。 */
export type RouteId = "1" | "2" | "3" | "5" | "6";

/** "H:MM" 24時間表記・先頭ゼロなし（例 "6:05" / "21:30"）。 */
export type TimeStr = string;

/** 曜日区分（spec 4章 / 5.1）。年末年始は saturday_holiday 側に寄せる。 */
export type DayType = "weekday" | "saturday_holiday";

// ===== 一次データ型（JSONの形状をそのまま反映。フィールド名は snake_case） =====

/** 電停マスタ 1件（stops.json）。 */
export interface Stop {
  id: StopId;
  no: string; // 路線図上の電停番号 "01".."29"
  name: string;
  kana: string;
  romaji: string;
  aliases: string[]; // あいまい検索用
  lat: number;
  lng: number;
  requires_coord_verification?: boolean; // 座標が概算値か（spec 3.8）
  note?: string;
}

export interface StopsFile {
  _meta?: Record<string, unknown>;
  stops: Stop[];
}

/**
 * 系統定義 1件（routes.json）。
 * ループ系統(①②)は stops_order を、双方向系統(③⑤⑥)は stops_order_outbound/inbound を持つ。
 */
export interface Route {
  id: RouteId;
  name: string;
  color: string; // 系統色 HEX
  color_name?: string;
  loop: boolean; // 環状線か
  weekday_only?: boolean; // ⑥番のみ true（spec 3.6）
  direction_label?: string;
  stops_order?: StopId[]; // ループ系統(①②)
  stops_order_outbound?: StopId[]; // 双方向系統(③⑤⑥)
  stops_order_inbound?: StopId[];
  note?: string;
}

export interface RoutesFile {
  _meta?: Record<string, unknown>;
  routes: Route[];
}

/**
 * 便（trip）。通過電停の発車時刻を stops に持つ。
 * 区間便（古町止め等）は通らない電停のキーを含めない（spec 3.3）。
 */
export interface Trip {
  trip: string; // 便ID "E1","N3","O8" 等
  origin?: StopId;
  terminus?: "full" | StopId; // 区間便の終点
  // ⑥番(weekday_only)の便はこのキーを持たない。系統レベルの weekday_only で運休を表す（spec 3.6）。
  saturday_holiday_suspended?: boolean;
  stops: Record<StopId, TimeStr>; // 通過電停 → 発車時刻
  note?: string;
}

/** 日中便の展開パターン（spec 3.4 / 5.2）。 */
export interface DaytimePattern {
  description?: string;
  origin: StopId;
  first_departure: TimeStr;
  last_departure: TimeStr;
  interval_min: number;
  saturday_holiday_suspended: boolean;
  segment_offsets_from_origin: Record<StopId, number>; // 起点からの所要分
  offset_note?: string;
}

/** 日中便を daytime_pattern で展開する双方向系統(③⑤)の 1方向ぶん。 */
export interface ExpandedDirectionTimetable {
  label?: string;
  stops_in_order: StopId[];
  early_morning_trips: Trip[];
  daytime_pattern: DaytimePattern;
  night_trips: Trip[];
}

/** 全便を明示で持つ双方向系統(⑥)の 1方向ぶん。daytime_pattern を持たない。 */
export interface ExplicitDirectionTimetable {
  label?: string;
  stops_in_order: StopId[];
  trips: Trip[];
}

/** 双方向系統の 1方向ぶん（③⑤=展開型／⑥=明示型）。 */
export type DirectionTimetable =
  | ExpandedDirectionTimetable
  | ExplicitDirectionTimetable;

/** ⑥番のように全便を明示で持つ direction か判定する型ガード（実装はモジュール1）。 */
export function isExplicitDirectionTimetable(
  d: DirectionTimetable,
): d is ExplicitDirectionTimetable {
  return "trips" in d;
}

/** ループ系統(①②)の timetable_route{1,2}.json。 */
export interface LoopTimetableFile {
  _meta?: Record<string, unknown>;
  stops_in_order: StopId[];
  early_morning_trips: Trip[];
  daytime_pattern: DaytimePattern;
  night_trips: Trip[];
}

/** 双方向系統(③⑤⑥)の timetable_route{3,5,6}.json。directions のキーは系統ごとに異なる。 */
export interface DirectionalTimetableFile {
  _meta?: Record<string, unknown>;
  directions: Record<string, DirectionTimetable>;
}

/** timetable_route*.json の2形態の和。 */
export type TimetableFile = LoopTimetableFile | DirectionalTimetableFile;

/** ループ系統か判定する型ガード用ヘルパ（実装はモジュール1）。 */
export function isLoopTimetableFile(t: TimetableFile): t is LoopTimetableFile {
  return "stops_in_order" in t;
}

// ===== 派生データ型（segments.json。推定値・spec 3.2/3.5） =====

export interface SegmentIntermediate {
  stop: StopId;
  offset_from_start_min: number; // 区間始点からの所要分
}

export interface Segment {
  between: [StopId, StopId]; // 記載済みの前後電停
  intermediate: SegmentIntermediate[];
  segment_total_min: number;
  note?: string;
}

export interface RouteInterpolation {
  route_id: RouteId;
  _comment?: string;
  segments: Segment[];
}

export interface SegmentsFile {
  _meta?: Record<string, unknown>;
  interpolations: RouteInterpolation[];
}

// ===== 運賃（spec 3.7。均一運賃） =====

export interface Fare {
  adultCash: number; // 大人 現金
  adultIc: number; // 大人 IC・みきゃんアプリ
  childCash: number; // 小児 現金相当
  childIc: number; // 小児 IC
}

// ===== 計算・ドメイン型（JSONに無い派生概念。camelCase） =====

/**
 * 正規化された 1方向ぶんの便群（モジュール1の出力）。
 * timetable の3形態（ループ①②／双方向展開③⑤／双方向明示⑥）を統一して扱うためのビュー。
 * 日中便の展開・中間電停の補間はここでは行わない（モジュール2）。
 */
export interface NormalizedSection {
  routeId: RouteId;
  directionKey: string; // ループ系統は "loop"、双方向系統は directions のキー
  stopsInOrder: StopId[];
  earlyMorningTrips: Trip[];
  daytimePattern?: DaytimePattern; // ⑥番（明示型）は持たない
  nightTrips: Trip[];
  explicitTrips?: Trip[]; // ⑥番のみ。全便が明示で入る
}

/** 解決済みの 1電停の時刻（モジュール2の出力、spec 5.2 / 6.2）。 */
export interface ResolvedStopTime {
  stopId: StopId;
  minutes: number; // 0時からの分。時刻計算用
  time: TimeStr; // 表示用 "H:MM"
  isEstimated: boolean; // 中間電停の補間値か（true=目安、spec 6.2）
}

/** 経路探索の結果 1件（spec 4章 / 5.3）。 */
export interface RouteResult {
  routeId: RouteId;
  routeName: string;
  color: string;
  boardStop: StopId; // 乗車電停
  alightStop: StopId; // 降車電停
  departureTime: TimeStr; // 乗車電停の発車時刻
  arrivalTime: TimeStr; // 降車電停の到着時刻
  durationMin: number; // 所要分
  isEstimated: boolean; // 中間電停の計算値を含むか（spec 6.2）
  waitMin: number; // 基準時刻からの待ち時間
}

/**
 * 経路探索の状態（spec 5.3 / 5.6）。エラーではなく結果状態として扱う（docs/conventions.md）。
 * - results: 当日乗れる便あり（routes[0]=次発, routes[1]=次々発, spec 5.4）。
 * - before_first: 始発前。routes はその日の始発以降（spec 5.6）。
 * - after_last: 終電後。routes は翌日の便、nextDayType に翌日の曜日区分（spec 5.6）。
 * - same_stop: 出発＝到着（spec 5.6、経路を出さず選び直しを促す）。
 * - no_route: 乗換なし経路が存在しない（乗換が必要・Phase 2、spec 5.3末尾）。
 * - suspended_today: ⑥番(本町線=weekday_only)のみが結ぶODを土日祝に検索した場合。本町線運休のため当日は到達不可（spec 5.6）。
 */
export type RouteQueryStatus =
  | "results"
  | "before_first"
  | "after_last"
  | "same_stop"
  | "no_route"
  | "suspended_today";

/** 経路探索の結果全体（モジュール5の出力）。 */
export interface RouteQueryResult {
  status: RouteQueryStatus;
  routes: RouteResult[]; // 早い順。same_stop / no_route のときは空。
  nextDayType?: DayType; // after_last のときの翌日の曜日区分。
}
