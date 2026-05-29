# START HERE — 伊予鉄道 市内電車 案内アプリ

このフォルダは、Claude Code で実装を始めるための初期パッケージです。
時刻データ（原本照合済み）と仕様書・デザイン依頼書が入っています。

## 中身

```
iyotetsu-tram/
├── data/        確定済みデータ（原本照合済み）＋ validate.py ＋ data/README.md
└── docs/
    ├── spec.md      実装の唯一の正（dev-guide が起動時に読む）
    └── design.md    Claude Design への依頼書
```

※ Claude Design のハンドオフバンドル（UIの正）は、Claude Design 側から書き出して、このフォルダに一緒に置いてください。

## 始め方

1. このフォルダで git を初期化（未初期化の場合）:
   ```bash
   git init
   ```
2. Claude Code を起動し、dev-guide skill を呼ぶ。
3. dev-guide に spec.md を渡す（「docs/spec.md が仕様書」と伝える）。
4. UI資料を聞かれたら、docs/design.md と Claude Design のハンドオフバンドルを渡す。
5. dev-guide がモジュール一覧（spec.md 第8章）に沿って、モジュール0から一手ずつ実装。

## 実装前の注意（spec.md にも記載）

- `data/timetable_route*.json` は原本照合済みの確定データ。時刻値は書き換えない。
- 中間電停の時刻は実行時計算（静的に焼き込まない）。
- 電停の緯度経度は概算値（`requires_coord_verification: true`）。現在地→最寄り機能の精度のため、実装時に実測へ差し替え推奨。
- データ検証は `python3 data/validate.py` で実行できる。

## この先の流れ（spec.md 第8章）

実装 → 全体監査（/dev-audit-2-full、デプロイ前）→ デプロイ準備（README に出典・免責）→ Vercel デプロイ。
