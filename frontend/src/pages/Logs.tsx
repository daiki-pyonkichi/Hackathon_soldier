import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api/client";
import type { PresenceLogEntry, StatsBucket, StatsPoint, User } from "../types";

const FACE: Record<string, string> = {
  "soldier-blue": "🪖",
  "soldier-red": "👮",
  "soldier-green": "🧑‍🚀",
  "soldier-yellow": "🧙",
};

const LINE_COLORS = ["#c2cf3a", "#f0883e", "#58a6ff", "#f85149"];

const BUCKET_LABELS: { value: StatsBucket; label: string; daysBack: number }[] = [
  { value: "day",   label: "1週間 / 日別",   daysBack: 7   },
  { value: "week",  label: "1ヶ月 / 週別",   daysBack: 30  },
  { value: "month", label: "1年 / 月別",     daysBack: 365 },
];

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const M = d.getMonth() + 1;
  const D = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${M}/${D} ${hh}:${mm}`;
}

function toJstYmd(d: Date): string {
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

// 期間内に存在する全 bucket key を順序付きで返す
function generateBucketKeys(fromYmd: string, toYmd: string, bucket: StatsBucket): string[] {
  const fromParts = fromYmd.split("-").map(Number);
  const toParts = toYmd.split("-").map(Number);
  const from = new Date(fromParts[0], fromParts[1] - 1, fromParts[2]);
  const to = new Date(toParts[0], toParts[1] - 1, toParts[2]);
  const keys: string[] = [];

  if (bucket === "day") {
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      keys.push(toYmdLocal(d));
    }
    return keys;
  }
  if (bucket === "month") {
    let d = new Date(from.getFullYear(), from.getMonth(), 1);
    while (d <= to) {
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
    return keys;
  }
  // week: 各週の月曜日
  let d = new Date(from);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1)); // 月曜にスナップ
  while (d <= to) {
    keys.push(toYmdLocal(d));
    d.setDate(d.getDate() + 7);
  }
  return keys;
}

function toYmdLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function Logs({ users }: { users: User[] }) {
  // ===== ログ一覧 =====
  const [allLogs, setAllLogs] = useState<PresenceLogEntry[]>([]);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    api
      .listLogs()
      .then(setAllLogs)
      .catch((e) => setLogsError(String(e)));
  }, []);

  const visibleLogs = useMemo(() => {
    if (showAll) return allLogs;
    // 直近1週間（左末端=今から7日前）でフィルタ
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const cutoff = weekAgo.toISOString();
    return allLogs.filter((l) => l.leftAt >= cutoff);
  }, [allLogs, showAll]);

  // ===== 折れ線グラフ用 =====
  const [bucket, setBucket] = useState<StatsBucket>("day");
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    users.slice(0, 1).map((u) => u.id)
  );
  const [statsByUser, setStatsByUser] = useState<Record<string, StatsPoint[]>>({});
  const [statsLoading, setStatsLoading] = useState(false);

  const { fromYmd, toYmd } = useMemo(() => {
    const conf = BUCKET_LABELS.find((b) => b.value === bucket)!;
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - conf.daysBack);
    return { fromYmd: toJstYmd(from), toYmd: toJstYmd(to) };
  }, [bucket]);

  useEffect(() => {
    if (selectedIds.length === 0) {
      setStatsByUser({});
      return;
    }
    setStatsLoading(true);
    Promise.all(
      selectedIds.map((uid) =>
        api.getStats({ userId: uid, from: fromYmd, to: toYmd, bucket }).then((stats) => [uid, stats] as const)
      )
    )
      .then((entries) => {
        const next: Record<string, StatsPoint[]> = {};
        for (const [uid, stats] of entries) next[uid] = stats;
        setStatsByUser(next);
      })
      .finally(() => setStatsLoading(false));
  }, [selectedIds, fromYmd, toYmd, bucket]);

  const chartData = useMemo(() => {
    // 期間内の全 key を生成（データがない区間も 0 で埋めて線を綺麗に繋ぐ）
    const allKeys = generateBucketKeys(fromYmd, toYmd, bucket);
    return allKeys.map((key) => {
      const row: Record<string, string | number> = { key };
      for (const uid of selectedIds) {
        const point = (statsByUser[uid] ?? []).find((p) => p.key === key);
        row[uid] = point ? +(point.totalSec / 3600).toFixed(2) : 0;
      }
      return row;
    });
  }, [statsByUser, selectedIds, fromYmd, toYmd, bucket]);

  const toggleUser = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev; // 最大4人
      return [...prev, id];
    });
  };

  return (
    <>
      {/* ============== グラフセクション ============== */}
      <section className="card">
        <div className="card__head">
          <h2>Chart · 在室時間グラフ</h2>
          <span className="spacer" />
          <div className="ranking-tabs">
            {BUCKET_LABELS.map((b) => (
              <button
                key={b.value}
                className={bucket === b.value ? "active" : ""}
                onClick={() => setBucket(b.value)}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div className="user-picker">
          <span className="user-picker__label">比較対象（最大4人）:</span>
          {users.map((u) => {
            const active = selectedIds.includes(u.id);
            const disabled = !active && selectedIds.length >= 4;
            return (
              <button
                key={u.id}
                className={`user-chip ${active ? "active" : ""}`}
                onClick={() => toggleUser(u.id)}
                disabled={disabled}
              >
                {FACE[u.avatarId] ?? "🙂"} {u.name}
              </button>
            );
          })}
        </div>

        <div className="chart-wrap">
          {statsLoading ? (
            <p className="muted" style={{ textAlign: "center", padding: 32 }}>LOADING…</p>
          ) : chartData.length === 0 ? (
            <p className="muted" style={{ textAlign: "center", padding: 32 }}>データがありません</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="#2a3340" strokeDasharray="3 3" strokeOpacity={0.4} />
                <XAxis dataKey="key" stroke="#7d8a9c" tick={{ fontSize: 11 }} />
                <YAxis stroke="#7d8a9c" tick={{ fontSize: 11 }} unit="h" />
                <Tooltip
                  contentStyle={{ background: "#161c25", border: "1px solid #2a3340" }}
                  labelStyle={{ color: "#e6edf3" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {selectedIds.map((uid, i) => {
                  const u = users.find((x) => x.id === uid);
                  const color = LINE_COLORS[i % LINE_COLORS.length];
                  return (
                    <Line
                      key={uid}
                      type="monotone"
                      dataKey={uid}
                      name={u?.name ?? uid}
                      stroke={color}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: color, stroke: color }}
                      activeDot={{ r: 6 }}
                      isAnimationActive={false}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* ============== ログ一覧 ============== */}
      <section className="card">
        <div className="card__head">
          <h2>Activity Log · 在室履歴</h2>
          <span className="spacer" />
          <span className="count">
            <strong>{visibleLogs.length}</strong> entries
          </span>
        </div>

        {logsError && <p className="auth-error">取得失敗: {logsError}</p>}

        <div className="log-list">
          {visibleLogs.map((log) => (
            <div key={log.id} className="log-row">
              <span className="log-row__avatar">{FACE[log.avatarId] ?? "🙂"}</span>
              <span className="log-row__name">{log.name}</span>
              <span className="log-row__time">
                {formatDateTime(log.enteredAt)} → {formatDateTime(log.leftAt)}
              </span>
              <span className="log-row__duration">{formatTime(log.durationSec)}</span>
            </div>
          ))}
          {visibleLogs.length === 0 && (
            <p className="muted" style={{ textAlign: "center", padding: 32 }}>
              該当する履歴がありません
            </p>
          )}
        </div>

        {!showAll && allLogs.length > visibleLogs.length && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button onClick={() => setShowAll(true)}>
              ▸ もっと表示（残り {allLogs.length - visibleLogs.length} 件）
            </button>
          </div>
        )}
      </section>
    </>
  );
}
