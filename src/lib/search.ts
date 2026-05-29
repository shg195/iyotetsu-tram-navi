// モジュール4: あいまい検索（spec 2.1.1 / design 3.1）
// 電停を name / kana / romaji / aliases に対して部分一致で検索する。
// 一致種別（完全 > 前方一致 > 部分一致）でランク付けして返す。

import type { Stop } from "@/types";
import { allStops } from "@/lib/data";

// カタカナをひらがなに寄せ、かな入力の表記ゆれを吸収する。
function katakanaToHiragana(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  );
}

// 比較用にクエリ・対象を正規化する（小文字化・かな統一・区切り文字除去）。
function normalize(s: string): string {
  return katakanaToHiragana(s.trim().toLowerCase()).replace(/[\s\-・]/g, "");
}

function searchableFields(stop: Stop): string[] {
  return [stop.name, stop.kana, stop.romaji, ...stop.aliases];
}

// 0=完全一致, 1=前方一致, 2=部分一致, null=不一致。
function matchRank(query: string, fields: string[]): number | null {
  let best: number | null = null;
  for (const f of fields) {
    let rank: number | null = null;
    if (f === query) rank = 0;
    else if (f.startsWith(query)) rank = 1;
    else if (f.includes(query)) rank = 2;
    if (rank !== null && (best === null || rank < best)) best = rank;
  }
  return best;
}

/**
 * 電停を検索する。一致種別→電停番号(no) の順に整列して返す。
 * 同名電停（本町六丁目 09/29 等）は両方返す（spec 5.6、選択はUI/利用者）。
 * クエリが空なら空配列を返す。
 */
export function searchStops(query: string): Stop[] {
  const q = normalize(query);
  if (q === "") return [];

  const matched: { stop: Stop; rank: number }[] = [];
  for (const stop of allStops()) {
    const fields = searchableFields(stop).map(normalize);
    const rank = matchRank(q, fields);
    if (rank !== null) matched.push({ stop, rank });
  }

  matched.sort((a, b) => a.rank - b.rank || Number(a.stop.no) - Number(b.stop.no));
  return matched.map((m) => m.stop);
}
