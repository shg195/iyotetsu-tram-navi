// モジュール6: 現在地→最寄り電停（spec 5.5 / 5.6）
// 現在地と各電停の距離を Haversine で求め、近い順に提示する。
// 位置情報が拒否/利用不可のときはエラーにせず status で区別してフォールバックする。

import type { Stop } from "@/types";
import { allStops } from "@/lib/data";

/** 電停と現在地からの距離（メートル）。 */
export interface StopWithDistance {
  stop: Stop;
  distanceMeters: number;
}

const EARTH_RADIUS_M = 6371000;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** 2地点間の大円距離（メートル）を Haversine 公式で求める（spec 5.5）。 */
export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * 現在地に近い順の電停を返す（spec 5.5）。
 * limit 未指定なら全電停を近い順に返す（徒歩圏判定の閾値は UI 側に委ねる）。
 */
export function nearestStops(
  lat: number,
  lng: number,
  limit?: number,
): StopWithDistance[] {
  const ranked = allStops()
    .map((stop) => ({
      stop,
      distanceMeters: haversineMeters(lat, lng, stop.lat, stop.lng),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
  return limit === undefined ? ranked : ranked.slice(0, limit);
}

/** Geolocation 取得の結果状態（spec 5.6。拒否/失敗はエラーにせず区別する）。 */
export type GeolocationOutcome = "ok" | "denied" | "unavailable" | "timeout";

/** 最寄り電停の取得結果。ok 以外は stops 空（最寄り提示のみ無効化＝手動選択へフォールバック）。 */
export interface NearestStopsResult {
  status: GeolocationOutcome;
  stops: StopWithDistance[];
}

/**
 * ブラウザ Geolocation API で現在地を取得し、最寄り電停を近い順に返す（spec 5.5 / 5.6）。
 * HTTPS 前提・要許可。拒否/利用不可/タイムアウトは reject せず status で返す。
 */
export function locateNearestStops(
  limit?: number,
  options?: PositionOptions,
): Promise<NearestStopsResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve({ status: "unavailable", stops: [] });
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          status: "ok",
          stops: nearestStops(
            pos.coords.latitude,
            pos.coords.longitude,
            limit,
          ),
        }),
      (err) => {
        const status: GeolocationOutcome =
          err.code === err.PERMISSION_DENIED
            ? "denied"
            : err.code === err.TIMEOUT
              ? "timeout"
              : "unavailable";
        resolve({ status, stops: [] });
      },
      options,
    );
  });
}
