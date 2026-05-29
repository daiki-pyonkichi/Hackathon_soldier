import { useEffect, useState } from "react";
import type { PresenceView } from "../types";

const FACE: Record<string, string> = {
  "soldier-blue": "🪖",
  "soldier-red": "👮",
  "soldier-green": "🧑‍🚀",
  "soldier-yellow": "🧙",
};

// HP 減少: 12時間 = 720分で 100% → 0%
const DRAIN_PER_MIN = 100 / (12 * 60);
// HP 回復: 6時間 = 360分で 0% → 100%
const HEAL_PER_MIN = 100 / (6 * 60);

// サーバー算出の HP を起点に、取得時刻からの経過分でローカル補正する
function computeHp(p: PresenceView, now: Date): number {
  const base = p.hp ?? 100;
  const since = p.hpAt ? (now.getTime() - new Date(p.hpAt).getTime()) / 60000 : 0;
  if (p.status === "present") {
    return Math.max(0, base - since * DRAIN_PER_MIN);
  }
  return Math.min(100, base + since * HEAL_PER_MIN);
}

function stageEmoji(hp: number, baseFace: string): string {
  if (hp > 75) return baseFace;
  if (hp > 50) return `${baseFace}💪`;
  if (hp > 25) return `${baseFace}😅`;
  return `${baseFace}💀`;
}

export function Character({ p }: { p: PresenceView }) {
  const base = FACE[p.avatarId] ?? "🙂";
  const isPresent = p.status === "present";
  const minutes = p.elapsedMin ?? 0;
  const stateClass = isPresent ? "present" : "absent";

  // 1分ごとに HP を再計算
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const hp = computeHp(p, now);
  const hpPct = Math.round(hp);
  const face = stageEmoji(hp, base);

  // HP に応じてバーの色を変える
  const hpColor =
    hp > 60 ? "var(--olive)" : hp > 30 ? "var(--amber)" : "var(--crimson)";

  return (
    <div className={`character ${stateClass}`}>
      <div className="avatar" aria-label={p.name}>
        {face}
      </div>
      <div className="name">{p.name}</div>
      <div className="status">
        {isPresent ? (
          <>
            ON DUTY · <strong>{minutes}m</strong>
          </>
        ) : p.status === "unknown" ? (
          <>UNKNOWN</>
        ) : (
          <>OFFLINE</>
        )}
      </div>
      <div className="hp">
        <div className="hp__label">
          <span>HP</span>
          <span className="hp__pct">{hpPct}%</span>
        </div>
        <div className="hp__bar-wrap">
          <div
            className="hp__bar"
            style={{ width: `${hpPct}%`, background: hpColor }}
          />
        </div>
      </div>
    </div>
  );
}
