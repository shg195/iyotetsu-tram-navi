// モジュール2: 時刻ユーティリティ
// TimeStr("H:MM" 24時間表記・先頭ゼロなし) と「0時からの分」の相互変換。

import type { TimeStr } from "@/types";

/** "H:MM" を 0時からの分に変換する。 */
export function parseTimeStr(t: TimeStr): number {
  const [h, m] = t.split(":");
  return Number(h) * 60 + Number(m);
}

/** 0時からの分を "H:MM"（時は先頭ゼロなし・分は2桁）に変換する。 */
export function formatMinutes(min: number): TimeStr {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}
