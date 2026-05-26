import type { PresenceView } from "../types";
import { Character } from "./Character";

/**
 * 在室一覧の表示。
 * データ取得は親 (App.tsx) が担当し、props で受け取る。
 */
export function PresenceList({
  presences,
  error,
}: {
  presences: PresenceView[];
  error: string | null;
}) {
  const presentCount = presences.filter((p) => p.status === "present").length;

  return (
    <section className="card">
      <div className="card__head">
        <h2>Roster · 在室メンバー</h2>
        <span className="spacer" />
        <span className="count">
          <strong>{presentCount}</strong> active / {presences.length}
        </span>
      </div>
      {error && <p className="auth-error">取得失敗: {error}</p>}
      <div className="character-grid">
        {presences.map((p) => (
          <Character key={p.userId} p={p} />
        ))}
      </div>
    </section>
  );
}
