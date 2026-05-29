// モジュール8: 採用デザイン（方向A「時刻表ボード」＋白地ヒーロー）の視覚定数。
// ハンドオフバンドル themes.js の board テーマ・white ヒーロー variant のみ移植。
// 系統色は一次データ(routes.json)を正とするため、ここには持たない。

export const BOARD_THEME = {
  sans: "var(--font-plex-sans-jp), -apple-system, system-ui, sans-serif",
  mono: "var(--font-plex-sans-jp), system-ui, sans-serif", // 数字フォント = Plex Sans（chat 最終決定）
  bg: "#f1f0ec",
  surface: "#ffffff",
  surfaceAlt: "#f8f7f3",
  text: "#1a1a17",
  textMuted: "#6c6b62",
  textFaint: "#a3a298",
  border: "#e4e2da",
  hairline: "#edece5",
  accent: "#1a1a17",
  accentText: "#ffffff",
  radius: 16,
  radiusSm: 10,
  radiusChip: 8,
  shadow: "0 1px 2px rgba(20,20,15,0.05), 0 8px 24px rgba(20,20,15,0.06)",
  shadowSm: "0 1px 2px rgba(20,20,15,0.06)",
} as const;

// 次発（主役）カード = 白地。枠は系統色（chat 最終決定 heroBorderMode="系統色"）。
export const HERO_WHITE = {
  bg: "#ffffff",
  text: "#1a1a17",
  muted: "#6c6b62",
  num: "#1a1a17",
  shadow: "0 6px 16px rgba(20,20,15,0.10), 0 18px 44px rgba(20,20,15,0.17)",
  numSize: 64,
} as const;

export type BoardTheme = typeof BOARD_THEME;

// hex → rgba（系統色のうすい面・縁取りに使う）。
export function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const n =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
