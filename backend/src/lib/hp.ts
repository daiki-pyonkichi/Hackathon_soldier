import type { Presence, PresenceLog } from "../types.js";

const DRAIN_PER_MIN = 100 / (12 * 60); // 12時間で 100% → 0%
const HEAL_PER_MIN = 100 / (6 * 60);   // 6時間で 0% → 100%

/**
 * 過去のセッション履歴と現在の在室状態から HP を計算する。
 * - 初期値 100% から始めて、セッション(在室)を経由するたび減少
 * - セッション間の不在時間で回復
 * - 現在進行中のセッションも含めて計算
 */
export function computeHp(logs: PresenceLog[], current: Presence, now: Date): number {
  // 古い順にソート
  const sorted = [...logs].sort(
    (a, b) => new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime(),
  );

  let hp = 100;
  let prevLeftAt: Date | null = null;

  for (const s of sorted) {
    const enteredAt = new Date(s.enteredAt);
    const leftAt = new Date(s.leftAt);

    // 前回退室 → 今回入室までの不在時間で回復
    if (prevLeftAt && enteredAt > prevLeftAt) {
      const absentMin = (enteredAt.getTime() - prevLeftAt.getTime()) / 60000;
      hp = Math.min(100, hp + absentMin * HEAL_PER_MIN);
    }
    // 在室時間で減少
    const presentMin = (leftAt.getTime() - enteredAt.getTime()) / 60000;
    hp = Math.max(0, hp - presentMin * DRAIN_PER_MIN);

    prevLeftAt = leftAt;
  }

  // 最後の状態を反映
  if (current.isPresent && current.enteredAt) {
    const enteredAt = new Date(current.enteredAt);
    if (prevLeftAt && enteredAt > prevLeftAt) {
      const absentMin = (enteredAt.getTime() - prevLeftAt.getTime()) / 60000;
      hp = Math.min(100, hp + absentMin * HEAL_PER_MIN);
    }
    const presentMin = (now.getTime() - enteredAt.getTime()) / 60000;
    hp = Math.max(0, hp - presentMin * DRAIN_PER_MIN);
  } else if (prevLeftAt) {
    // 不在中: 最後の退室以降の不在時間で回復
    const absentMin = (now.getTime() - prevLeftAt.getTime()) / 60000;
    hp = Math.min(100, hp + absentMin * HEAL_PER_MIN);
  }

  return hp;
}
