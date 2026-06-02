// キャラクター（アバター）の共通定義。
// GIF 素材は public/avatars/{id}/{id}_{stage}.gif に置く（例: soldier-armor/soldier-armor_1.gif 〜 _6.gif）。
// 素材が揃ったら AVATAR_GIFS_READY を true にすると、絵文字から GIF 表示に切り替わる。

export interface AvatarMeta {
  id: string;
  label: string;
  emoji: string; // GIF が無いときのフォールバック表示
  gifId?: string; // GIF 素材のフォルダ/ファイル名。未指定なら id を使う
}

export const AVATARS: AvatarMeta[] = [
  // すべて実GIF素材あり（red は soldier-heitai を使用）。
  { id: "soldier-armor", label: "アーマー", emoji: "🛡️" },
  { id: "soldier-spear", label: "スピア", emoji: "🔱" },
  { id: "soldier-naginata2", label: "ナギナタ", emoji: "⚔️" },
  { id: "soldier-red", label: "歩兵", emoji: "👮", gifId: "soldier-heitai" },
];

export const AVATAR_IDS = AVATARS.map((a) => a.id);

const EMOJI_BY_ID: Record<string, string> = Object.fromEntries(
  AVATARS.map((a) => [a.id, a.emoji]),
);

const GIF_ID_BY_ID: Record<string, string> = Object.fromEntries(
  AVATARS.map((a) => [a.id, a.gifId ?? a.id]),
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
  const gifId = GIF_ID_BY_ID[id] ?? id;
  return `/avatars/${gifId}/${gifId}_${stage}.gif`;
}

// GIF 素材を public/avatars/ に置き終えたら true にする。
// true でも、GIF が無いキャラは onError で自動的に絵文字へフォールバックする。
export const AVATAR_GIFS_READY = true;
