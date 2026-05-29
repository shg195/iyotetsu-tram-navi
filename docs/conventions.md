# 共通規約（モジュール0で確定）

本書は spec.md（唯一の正）に従う実装の共通規約。全モジュールがこれを参照する。

## 1. 命名規約

- **TS識別子（変数・関数）**: camelCase。
- **型・interface・enum**: PascalCase。
- **定数**: 値が固定の定数は UPPER_SNAKE_CASE 可（例 `FARE_ADULT_CASH`）。
- **React コンポーネント**: PascalCase。
- **JSON由来の「生データ型」のフィールド名**: `data/*.json` の実フィールド名に一致させる（snake_case を許容）。
  - 理由: 一次データ（timetable_route*.json 等）は書き換え禁止（spec 7.3）。生JSONをそのまま型付けして読むため、フィールド名はJSONに合わせる。
  - spec 第4章の型素案は camelCase だが、同章「フィールド名はデータJSONに準拠する」「モジュール0で正式に確定」に従い、生データ型は snake_case で確定する（spec変更ではなく素案の確定）。
- **計算・ドメイン型**（探索結果など、JSONに無い派生概念）: フィールドは camelCase（例 `RouteResult.departureTime`）。

## 2. ファイル名・ディレクトリ規則

- **ディレクトリ構成**:
  - `src/app/` — Next.js App Router（画面・ルート）。
  - `src/lib/` — ロジック層（データ読込・時刻解決・曜日判定・検索・運賃・現在地）。
  - `src/types.ts` — 全モジュール共有の型定義。
  - `data/` — 確定済みJSON（リポジトリルート、既存。書き換え禁止）。
- **ファイル名**:
  - ロジック・ユーティリティ: kebab-case（例 `data-loader.ts`, `time-resolver.ts`, `route-search.ts`）。
  - React コンポーネント: PascalCase（例 `RouteCard.tsx`）。
  - Next.js 規約ファイル（`page.tsx`/`layout.tsx` 等）は小文字固定。

## 3. import / export

- **named export を基本**とする。default export は Next.js が要求する箇所（page/layout 等）のみ。
- import は `@/*` エイリアス（tsconfig 設定済み、`@` = `src`）を使用する。

## 4. エラーハンドリング方針

- **内部ロジック**は型保証を信頼し、起こり得ない分岐への防御は書かない（spec 5.6 のエッジケースは別扱い）。
- **境界**（Geolocation API・JSONの想定外形状など外部入力）でのみ検証する。
- **データ不整合**（id重複・時刻非単調など）は開発時に早期検知できるよう明示的に throw してよい（`data/validate.py` と役割分担）。
- **ユーザー向けエッジケース**（位置情報拒否・終電後・出発=到着 等、spec 5.6）は例外ではなく**結果の状態として返し**、UIでフォールバックする。

## 5. コメント・ドキュメンテーション

- コメントは「なぜ（WHY）」を書く。「何をしているか（WHAT）」は識別子で表す。日本語可。
- spec の条項番号を必要に応じて参照（例 `// spec 5.2 中間電停の解決`）。

## 6. 一次データ／派生データの不変条件

- 一次データ（`timetable_route*.json`・`stops.json`・`routes.json`）の値は書き換えない（spec 3.2 / 7.3）。
- 中間電停の時刻は実行時計算（静的焼き込み禁止、spec 3.5 / 7.3）。
- 派生データの修正は `segments.json` だけで完結させる。

記録日: 2026-05-29
