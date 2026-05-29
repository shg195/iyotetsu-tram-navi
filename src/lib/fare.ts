// モジュール7: 運賃（spec 3.7、2026-04-01 改定）
// 市内電車は全線均一運賃（系統・距離によらず一律）。固定値として保持する。

import type { Fare } from "@/types";

// 大人: 現金 250 / IC・みきゃんアプリ 230（キャッシュレス一律20円引き）。
// 小児: 大人の半額・10円未満切り上げ → 現金 130（=⌈125⌉）・IC 120（=⌈115⌉）。
export const UNIFORM_FARE: Fare = {
  adultCash: 250,
  adultIc: 230,
  childCash: 130,
  childIc: 120,
};

/** 市内電車の運賃を返す（全系統・全区間で均一、spec 3.7）。 */
export function getFare(): Fare {
  return UNIFORM_FARE;
}
