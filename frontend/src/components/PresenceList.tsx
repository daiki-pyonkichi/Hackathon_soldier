import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { PresenceView } from "../types";
import { Character } from "./Character";

/**
 * 在室一覧の取得＆表示。
 * 担当: フロントロジック係 (takebayashi)
 *   - WebSocket / SSE 化（pollingやめる）の余地あり
 */
export function PresenceList({ refreshMs = 15_000 }: { refreshMs?: number }) {
  const [list, setList] = useState<PresenceView[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchOnce = async () => {
      try {
        const data = await api.listPresences();
        if (!cancelled) {
          setList(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    };
    fetchOnce();
    const id = setInterval(fetchOnce, refreshMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [refreshMs]);

  const presentCount = list.filter((p) => p.isPresent).length;

  return (
    <section className="card">
      <div className="row">
        <h2 style={{ margin: 0 }}>在室メンバー</h2>
        <span className="spacer" />
        <small>現在 {presentCount} 人在室中</small>
      </div>
      {error && <p style={{ color: "crimson" }}>取得失敗: {error}</p>}
      <div className="character-grid" style={{ marginTop: 12 }}>
        {list.map((p) => (
          <Character key={p.userId} p={p} />
        ))}
      </div>
    </section>
  );
}
