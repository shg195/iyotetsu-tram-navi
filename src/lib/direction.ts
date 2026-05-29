// モジュール8 補助: 方向幕（行先表示）・経由駅の算出（spec 6.1.1 / 6.1.2）
// RouteResult は行先情報を持たないため、routeId + 乗車/降車電停から
// 実際の車両の行先表示（方向幕）と通過電停を導出する。一次データ(routes.json)のみ参照。

import type { RouteId, StopId } from "@/types";
import { routeById, stopById } from "@/lib/data";

type Lang = "ja" | "en";

// 環状線(①②)のまわり方の経由地（spec 6.1.1: ①=JR松山駅前まわり / ②=大街道まわり）。
const LOOP_VIA: Record<string, StopId> = {
  "1": "jr-matsuyama-ekimae",
  "2": "okaido",
};

function stopName(id: StopId, lang: Lang): string {
  const s = stopById(id);
  if (!s) return id;
  return lang === "en" ? s.romaji : s.name;
}

// 線形系統(③⑤⑥)で board→alight が成立する進行方向の電停列を返す。
// outbound / inbound のうち board が alight より先に現れる方が進行方向。
function linearDirectionOrder(
  routeId: RouteId,
  board: StopId,
  alight: StopId,
): StopId[] | null {
  const route = routeById(routeId);
  if (!route) return null;
  for (const order of [route.stops_order_outbound, route.stops_order_inbound]) {
    if (!order) continue;
    const bi = order.indexOf(board);
    const ai = order.indexOf(alight);
    if (bi >= 0 && ai > bi) return order;
  }
  return null;
}

// 環状線で board から alight までの電停列（起点/終点含む、1周内）を返す。
function loopOrderSlice(
  routeId: RouteId,
  board: StopId,
  alight: StopId,
): StopId[] | null {
  const route = routeById(routeId);
  if (!route?.stops_order) return null;
  const order = route.stops_order;
  const bi = order.indexOf(board);
  if (bi < 0) return null;
  // 松山市駅は始点(0)と終点(末尾)に重複するため board の次から alight を探す。
  for (let i = bi + 1; i < order.length; i++) {
    if (order[i] === alight) return order.slice(bi, i + 1);
  }
  return null;
}

/**
 * 方向幕（行先表示）の文言を返す（spec 6.1.1）。
 * - ③⑤⑥番: 「{終点}行」/ "Bound for {terminus}"
 * - ①②番: 「環状線 {経由地}まわり」/ "Loop · via {via}"
 * 系統番号・系統色はバッジ側で表示するため、ここでは行先文言のみを返す。
 */
export function rollSign(
  routeId: RouteId,
  board: StopId,
  alight: StopId,
  lang: Lang,
): string {
  const route = routeById(routeId);
  if (!route) return "";
  if (route.loop) {
    const via = stopName(LOOP_VIA[routeId] ?? board, lang);
    return lang === "en" ? `Loop · via ${via}` : `環状線 ${via}まわり`;
  }
  const order = linearDirectionOrder(routeId, board, alight);
  if (!order) return lang === "en" ? "" : "";
  const term = stopName(order[order.length - 1], lang);
  return lang === "en" ? `Bound for ${term}` : `${term}行`;
}

/**
 * 乗車から降車までの経由電停名（起点・終点を含む）を順に返す（spec 6.1.2）。
 * 中間電停も含む。表示用の名称配列。
 */
export function viaPath(
  routeId: RouteId,
  board: StopId,
  alight: StopId,
  lang: Lang,
): string[] {
  const route = routeById(routeId);
  if (!route) return [];
  if (route.loop) {
    const slice = loopOrderSlice(routeId, board, alight);
    if (!slice) return [stopName(board, lang), stopName(alight, lang)];
    return slice.map((id) => stopName(id, lang));
  }
  const order = linearDirectionOrder(routeId, board, alight);
  if (!order) return [stopName(board, lang), stopName(alight, lang)];
  const bi = order.indexOf(board);
  const ai = order.indexOf(alight);
  return order.slice(bi, ai + 1).map((id) => stopName(id, lang));
}
