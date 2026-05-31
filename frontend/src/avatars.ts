// キャラクター（アバター）の共通定義。
// GIF 素材は public/avatars/{id}_{stage}.gif に置く（例: soldier-blue_1.gif 〜 soldier-blue_6.gif）。
// 素材が揃ったら AVATAR_GIFS_READY を true にすると、絵文字から GIF 表示に切り替わる。

export interface AvatarMeta {
  id: string;
  label: string;
  emoji: string; // GIF が無いときのフォールバック表示
}

export const AVATARS: AvatarMeta[] = [
  // soldier-armor のみ実GIF素材あり。他は GIF 未配置で絵文字フォールバック（モック）。
  { id: "soldier-armor", label: "アーマー", emoji: "🛡️" },
  { id: "soldier-blue", label: "ブルー", emoji: "🪖" },
  { id: "soldier-red", label: "レッド", emoji: "👮" },
  { id: "soldier-green", label: "グリーン", emoji: "🧑‍🚀" },
  { id: "soldier-yellow", label: "イエロー", emoji: "🧙" },
];

export const AVATAR_IDS = AVATARS.map((a) => a.id);

const EMOJI_BY_ID: Record<string, string> = Object.fromEntries(
  AVATARS.map((a) => [a.id, a.emoji]),
);

export function avatarEmoji(id: string): string {
  return EMOJI_BY_ID[id] ?? "🙂";
}

// 在室経過時間(分) → 成長段階 1..6
export function avatarStage(elapsedMin: number): number {
  if (elapsedMin < 30) return 1;
  if (elapsedMin < 60) return 2;
  if (elapsedMin < 120) return 3;
  if (elapsedMin < 240) return 4;
  if (elapsedMin < 360) return 5;
  return 6;
}

export function avatarGifSrc(id: string, stage: number): string {
  return `/avatars/${id}_${stage}.gif`;
}

// GIF 素材を public/avatars/ に置き終えたら true にする。
// true でも、GIF が無いキャラは onError で自動的に絵文字へフォールバックする。
export const AVATAR_GIFS_READY = true;
