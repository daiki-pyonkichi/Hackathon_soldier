import { useEffect, useState } from "react";
import type { PresenceView } from "../types";
import {
  AVATAR_GIFS_READY,
  avatarEmoji,
  avatarGifSrc,
  avatarStage,
} from "../avatars";

/**
 * キャラクター描画コンポーネント。
 * 在室経過時間に応じて段階(1..6)が変化する。
 * GIF 素材が揃うまでは絵文字でフォールバック表示する。
 */

// 段階に応じた絵文字サフィックス（GIF が無いときの簡易表現）
function stageSuffix(stage: number): string {
  if (stage <= 2) return "";
  if (stage === 3) return "💪";
  if (stage === 4) return "😅";
  if (stage === 5) return "😩";
  return "💀";
}

export function Character({ p }: { p: PresenceView }) {
  const minutes = p.elapsedMin ?? 0;
  const isPresent = p.status === "present";
  const stage = isPresent ? avatarStage(minutes) : 1;
  const stateClass = isPresent ? "present" : "absent";

  const emoji = avatarEmoji(p.avatarId);
  const gifSrc = avatarGifSrc(p.avatarId, stage);

  // GIF 読み込み失敗時は絵文字にフォールバック。stage/avatar が変わるたびに再試行。
  const [gifFailed, setGifFailed] = useState(false);
  useEffect(() => setGifFailed(false), [gifSrc]);
  const showGif = AVATAR_GIFS_READY && !gifFailed;

  return (
    <div className={`character ${stateClass}`}>
      <div className="avatar" aria-label={p.name}>
        {showGif ? (
          <img
            className="avatar-img"
            src={gifSrc}
            alt={p.name}
            onError={() => setGifFailed(true)}
          />
        ) : (
          `${emoji}${isPresent ? stageSuffix(stage) : ""}`
        )}
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
    </div>
  );
}
