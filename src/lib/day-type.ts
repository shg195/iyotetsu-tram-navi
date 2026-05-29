// モジュール3: 曜日判定（spec 5.1 / 3.6）
// 日付から DayType を求め、便が当該 DayType に運行するかを判定する。

import type { DayType, Route, Trip } from "@/types";
import holiday_jp from "@holiday-jp/holiday_jp";

// 年末年始(12/30〜1/3)は祝日扱いに上書きする（spec 3.6 / 5.1）。
// holiday_jp は 1/2・1/3・12/31 を祝日として持たないため、ここで明示的に補う。
function isYearEndNewYear(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return (month === 12 && day >= 30) || (month === 1 && day <= 3);
}

/** 日付から曜日区分を判定する。既定は現在日時。 */
export function getDayType(date: Date = new Date()): DayType {
  const weekday = date.getDay(); // 0=日曜, 6=土曜
  if (weekday === 0 || weekday === 6) return "saturday_holiday";
  if (holiday_jp.isHoliday(date)) return "saturday_holiday"; // 祝日・振替休日
  if (isYearEndNewYear(date)) return "saturday_holiday";
  return "weekday";
}

/**
 * 便が当該 DayType に運行するか（spec 3.6 / 5.6）。
 * - 平日: 全便運行。
 * - 土日祝: ⑥番(weekday_only)は全便運休。それ以外は saturday_holiday_suspended の便のみ運休。
 */
export function tripRunsOn(route: Route, trip: Trip, dayType: DayType): boolean {
  if (dayType === "weekday") return true;
  if (route.weekday_only) return false;
  return trip.saturday_holiday_suspended !== true;
}
