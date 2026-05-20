import type { PresenceView } from "../types";

/**
 * キャラクター描画コンポーネント（叩き台）。
 * 担当: kuremoto (デザイン) + フロントUI担当（実装）
 *   - 在室時間に応じた状態変化（成長 or 虐待）
 *   - Canva / Lottie で作った素材に差し替え
 */

// 簡易: avatarId に紐づく絵文字。後でちゃんとした素材に置き換える
const FACE: Record<string, string> = {
  "soldier-blue": "🪖",
  "soldier-red": "👮",
  "soldier-green": "🧑‍🚀",
  "soldier-yellow": "🧙",
};

// 在室時間で見た目が変わる仮ロジック（成長案 vs 虐待案 はチームで決める）
function stageEmoji(durationSec: number, baseFace: string): string {
  const hours = durationSec / 3600;
  if (hours < 1) return baseFace;
  if (hours < 3) return `${baseFace}💪`; // 元気
  if (hours < 6) return `${baseFace}😅`; // 疲れ気味
  return `${baseFace}💀`; // やつれ
}

export function Character({ p }: { p: PresenceView }) {
  const base = FACE[p.user.avatarId] ?? "🙂";
  const face = p.isPresent ? stageEmoji(p.durationSec, base) : base;
  const minutes = Math.floor(p.durationSec / 60);

  return (
    <div className={`character ${p.isPresent ? "present" : "absent"}`}>
      <div className="avatar" aria-label={p.user.name}>
        {face}
      </div>
      <div className="name">{p.user.name}</div>
      <div className="status">
        {p.isPresent ? `在室 ${minutes}分` : "不在"}
        {p.source === "manual" && p.isPresent ? "（手動）" : ""}
      </div>
    </div>
  );
}
