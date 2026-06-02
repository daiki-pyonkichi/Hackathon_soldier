import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api/client";
import type { PresenceLogEntry, StatsBucket, StatsPoint, User } from "../types";

const FACE: Record<string, string> = {
  "soldier-armor": "🛡️",
  "soldier-spear": "🔱",
  "soldier-naginata2": "⚔️",
  "soldier-blue": "🪖",
  "soldier-red": "👮",
  "soldier-green": "🧑‍🚀",
  "soldier-yellow": "🧙",
};

// 4色を超えても循環するように
const LINE_COLORS = [
  "#c2cf3a", "#f0883e", "#58a6ff", "#f85149",
  "#bc8cff", "#39c5cf", "#ffb347", "#a3e635",
];

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
  let d = new Date(from);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  while (d <= to) {
    keys.push(toYmdLocal(d));
    d.setDate(d.getDate() + 7);
  }
  return keys;
}

function toYmdLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const PAGE_DAYS = 5; // 1ページぶんの日数

// ===== DFT（離散フーリエ変換）設定 =====
// 案A: 日次サンプリング(Δt=1日) × 窓幅56日(=8週間)。週周期(7日)を k=8 のピークとして検出する。
const DFT_WINDOW_DAYS = 56;

// 実数信号の振幅スペクトルを返す。直流成分(平均)は除去。
// 返り値: { period(周期=日), amp(振幅) } の配列（k=1..N/2）
function dftAmplitude(signal: number[]): { k: number; period: number; amp: number }[] {
  const N = signal.length;
  if (N < 2) return [];
  const mean = signal.reduce((a, b) => a + b, 0) / N;
  const x = signal.map((v) => v - mean); // DC除去
  const half = Math.floor(N / 2);
  const out: { k: number; period: number; amp: number }[] = [];
  for (let k = 1; k <= half; k++) {
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      const ang = (-2 * Math.PI * k * n) / N;
      re += x[n] * Math.cos(ang);
      im += x[n] * Math.sin(ang);
    }
    out.push({ k, period: N / k, amp: (2 * Math.sqrt(re * re + im * im)) / N });
  }
  return out;
}

export function Logs({ users, meId }: { users: User[]; meId: string }) {
  // ===== ログ一覧 =====
  const [logs, setLogs] = useState<PresenceLogEntry[]>([]);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [filterUserId, setFilterUserId] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");
  const [rangeMode, setRangeMode] = useState(false);
  const [pages, setPages] = useState(1); // フィルタ無しの時に効く: 1ページ=5日
  const [hasMore, setHasMore] = useState(true);

  // 「もっと表示」 OR フィルタ変更で再フェッチ
  useEffect(() => {
    const usingDateFilter = !!filterDate;
    let from: string | undefined;
    let to: string | undefined;

    if (usingDateFilter) {
      from = filterDate;
      to = rangeMode && filterTo ? filterTo : filterDate;
    } else {
      // デフォルト: 今日から (pages * 5日) 前まで
      const today = new Date();
      const fromD = new Date();
      fromD.setDate(fromD.getDate() - (pages * PAGE_DAYS - 1));
      from = toYmdLocal(fromD);
      to = toYmdLocal(today);
    }

    api
      .listLogs({ userId: filterUserId || undefined, from, to })
      .then((data) => {
        setLogs(data);
        setLogsError(null);
        // フィルタ無し時のみ「もっと表示」を出す（フィルタ中はユーザー指定範囲だけ）
        if (usingDateFilter) {
          setHasMore(false);
        } else {
          // さらに過去にログが残っているか判定（取得時の最古日 < ページ起点なら次あり）
          setHasMore(true);
        }
      })
      .catch((e) => setLogsError(String(e)));
  }, [filterUserId, filterDate, filterTo, rangeMode, pages]);

  // フィルタが変わったら pages をリセット
  useEffect(() => {
    setPages(1);
  }, [filterUserId, filterDate, filterTo, rangeMode]);

  const clearFilters = () => {
    setFilterUserId("");
    setFilterDate("");
    setFilterTo("");
    setRangeMode(false);
  };

  const loadMore = () => setPages((p) => p + 1);

  // ===== 折れ線グラフ用 =====
  const [bucket, setBucket] = useState<StatsBucket>("day");
  const [dftMode, setDftMode] = useState(false); // true: 周期解析(DFT)表示
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statsByUser, setStatsByUser] = useState<Record<string, StatsPoint[]>>({});
  const [statsLoading, setStatsLoading] = useState(false);

  // DFTモードでは日次サンプリング固定（週周期検出のため）
  const effectiveBucket: StatsBucket = dftMode ? "day" : bucket;

  // スマホ判定（凡例を縦並びにするため）
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // 初回 users が来たタイミングで「自分」を初期選択
  const initRef = useRef(false);
  useEffect(() => {
    if (!initRef.current && users.length > 0) {
      const me = users.find((u) => u.id === meId);
      setSelectedIds([me?.id ?? users[0].id]);
      initRef.current = true;
    }
  }, [users, meId]);

  const { fromYmd, toYmd } = useMemo(() => {
    const daysBack = dftMode
      ? DFT_WINDOW_DAYS
      : BUCKET_LABELS.find((b) => b.value === bucket)!.daysBack;
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - daysBack);
    return { fromYmd: toJstYmd(from), toYmd: toJstYmd(to) };
  }, [bucket, dftMode]);

  useEffect(() => {
    if (selectedIds.length === 0) {
      setStatsByUser({});
      return;
    }
    setStatsLoading(true);
    Promise.all(
      selectedIds.map((uid) =>
        api
          .getStats({ userId: uid, from: fromYmd, to: toYmd, bucket: effectiveBucket })
          .then((stats) => [uid, stats] as const)
      )
    )
      .then((entries) => {
        const next: Record<string, StatsPoint[]> = {};
        for (const [uid, stats] of entries) next[uid] = stats;
        setStatsByUser(next);
      })
      .finally(() => setStatsLoading(false));
  }, [selectedIds, fromYmd, toYmd, effectiveBucket]);

  const chartData = useMemo(() => {
    const allKeys = generateBucketKeys(fromYmd, toYmd, effectiveBucket);
    return allKeys.map((key) => {
      const row: Record<string, string | number> = { key };
      for (const uid of selectedIds) {
        const point = (statsByUser[uid] ?? []).find((p) => p.key === key);
        row[uid] = point ? +(point.totalSec / 3600).toFixed(2) : 0;
      }
      return row;
    });
  }, [statsByUser, selectedIds, fromYmd, toYmd, effectiveBucket]);

  // DFTスペクトル: 日次系列(0埋め)を各ユーザーぶんDFT → 周期(日)ごとの振幅
  const spectrumData = useMemo(() => {
    if (!dftMode) return [] as Record<string, number>[];
    const dayKeys = generateBucketKeys(fromYmd, toYmd, "day");
    const N = dayKeys.length;
    const perUser: Record<string, { k: number; period: number; amp: number }[]> = {};
    for (const uid of selectedIds) {
      const byKey = new Map(
        (statsByUser[uid] ?? []).map((p) => [p.key, p.totalSec / 3600])
      );
      const signal = dayKeys.map((key) => byKey.get(key) ?? 0); // 欠損日は0埋め
      perUser[uid] = dftAmplitude(signal);
    }
    const half = Math.floor(N / 2);
    const rows: Record<string, number>[] = [];
    for (let k = 1; k <= half; k++) {
      const row: Record<string, number> = { period: +(N / k).toFixed(2) };
      for (const uid of selectedIds) {
        const e = perUser[uid].find((a) => a.k === k);
        row[uid] = e ? +e.amp.toFixed(3) : 0;
      }
      rows.push(row);
    }
    // 周期の短い順（左）→長い順（右）で並べる
    return rows.sort((a, b) => a.period - b.period);
  }, [dftMode, statsByUser, selectedIds, fromYmd, toYmd]);

  const toggleUser = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ===== ドロップダウン制御 =====
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setPickerOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [pickerOpen]);

  const filteredPickerUsers = useMemo(
    () =>
      users.filter((u) =>
        u.name.toLowerCase().includes(pickerQuery.toLowerCase())
      ),
    [users, pickerQuery]
  );

  return (
    <>
      {/* ============== グラフセクション ============== */}
      <section className="card">
        <div className="card__head">
          <h2>Chart · 在室時間グラフ</h2>
          <span className="spacer" />
          <button
            className={`dft-toggle ${dftMode ? "active" : ""}`}
            onClick={() => setDftMode((v) => !v)}
            title="直近56日の日次在室時間を離散フーリエ変換し、周期性を可視化"
          >
            {dftMode ? "📈 時系列に戻す" : "🌊 周期解析 (DFT)"}
          </button>
          {dftMode ? (
            <span className="dft-note">直近56日・日次サンプリング</span>
          ) : (
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
          )}
        </div>

        <div className="user-picker" ref={pickerRef}>
          <span className="user-picker__label">
            比較対象（{selectedIds.length}人選択中）:
          </span>
          <div className="user-picker__selected">
            {selectedIds.length === 0 && (
              <span className="muted" style={{ fontSize: 12 }}>未選択</span>
            )}
            {selectedIds.map((uid, i) => {
              const u = users.find((x) => x.id === uid);
              if (!u) return null;
              const color = LINE_COLORS[i % LINE_COLORS.length];
              return (
                <span
                  key={uid}
                  className="user-picker__pill"
                  style={{ borderLeft: `3px solid ${color}` }}
                >
                  {FACE[u.avatarId] ?? "🙂"} {u.name}
                  <button
                    className="user-picker__remove"
                    onClick={() => toggleUser(uid)}
                    aria-label="解除"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
          <button
            className="user-picker__toggle"
            onClick={() => setPickerOpen((v) => !v)}
          >
            選択 ▾
          </button>
          {pickerOpen && (
            <div className="user-picker__dropdown">
              <input
                type="text"
                placeholder="🔎 検索…"
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
                className="user-picker__search"
              />
              <ul className="user-picker__list">
                {filteredPickerUsers.length === 0 && (
                  <li className="muted" style={{ padding: 12, textAlign: "center" }}>
                    一致するユーザーなし
                  </li>
                )}
                {filteredPickerUsers.map((u) => {
                  const active = selectedIds.includes(u.id);
                  return (
                    <li key={u.id}>
                      <label className="user-picker__row">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleUser(u.id)}
                        />
                        <span>{FACE[u.avatarId] ?? "🙂"} {u.name}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="chart-wrap">
          {/* スマホ: 凡例（ユーザー名）をグラフの上に縦並びで表示 */}
          {isMobile && !statsLoading && selectedIds.length > 0 && (
            <div className="chart-legend">
              {selectedIds.map((uid, i) => {
                const u = users.find((x) => x.id === uid);
                const color = LINE_COLORS[i % LINE_COLORS.length];
                return (
                  <span key={uid} className="chart-legend__item">
                    <span className="chart-legend__dot" style={{ background: color }} />
                    {u?.name ?? uid}
                  </span>
                );
              })}
            </div>
          )}
          {statsLoading ? (
            <p className="muted" style={{ textAlign: "center", padding: 32 }}>LOADING…</p>
          ) : selectedIds.length === 0 ||
            (dftMode ? spectrumData.length === 0 : chartData.length === 0) ? (
            <p className="muted" style={{ textAlign: "center", padding: 32 }}>データがありません</p>
          ) : dftMode ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={spectrumData} margin={{ top: 16, right: 24, bottom: 28, left: 0 }}>
                <CartesianGrid stroke="#2a3340" strokeDasharray="3 3" strokeOpacity={0.4} />
                <XAxis
                  dataKey="period"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  stroke="#7d8a9c"
                  tick={{ fontSize: 11 }}
                  unit="d"
                  label={{ value: "周期 (日)", position: "insideBottom", offset: -16, fill: "#7d8a9c", fontSize: 11 }}
                />
                <YAxis stroke="#7d8a9c" tick={{ fontSize: 11 }} label={{ value: "振幅", angle: -90, position: "insideLeft", fill: "#7d8a9c", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#161c25", border: "1px solid #2a3340" }}
                  labelStyle={{ color: "#e6edf3" }}
                  labelFormatter={(v) => `周期 ${v} 日`}
                />
                {!isMobile && (
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} />
                )}
                {/* 7日(週)周期の目印 */}
                <ReferenceLine x={7} stroke="#f0883e" strokeDasharray="4 4" label={{ value: "7日", fill: "#f0883e", fontSize: 11, position: "top" }} />
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
                      dot={{ r: 3, fill: color, stroke: color }}
                      activeDot={{ r: 6 }}
                      isAnimationActive={false}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
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
                {!isMobile && <Legend wrapperStyle={{ fontSize: 12 }} />}
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
          {dftMode && !statsLoading && spectrumData.length > 0 && (
            <p className="dft-caption">
              直近56日の日次在室時間を離散フーリエ変換した振幅スペクトル。
              <strong>7日付近のピーク</strong>＝曜日の周期性（毎週決まった曜日に在室）を示します。
            </p>
          )}
        </div>
      </section>

      {/* ============== ログ一覧（高さ固定スクロール） ============== */}
      <section className="card">
        <div className="card__head">
          <h2>Activity Log · 在室履歴</h2>
          <span className="spacer" />
          <span className="count">
            <strong>{logs.length}</strong> entries
          </span>
        </div>

        {/* 検索フィルタ */}
        <div className="log-filters">
          <label className="log-filter">
            <span>名前</span>
            <select
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
            >
              <option value="">全員</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </label>
          <label className="log-filter">
            <span>日付</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </label>
          <label className="log-filter log-filter--toggle">
            <input
              type="checkbox"
              checked={rangeMode}
              onChange={(e) => {
                setRangeMode(e.target.checked);
                if (!e.target.checked) setFilterTo("");
              }}
              disabled={!filterDate}
            />
            <span>範囲指定</span>
          </label>
          {rangeMode && (
            <label className="log-filter">
              <span>〜まで</span>
              <input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                min={filterDate || undefined}
              />
            </label>
          )}
          {(filterUserId || filterDate || filterTo) && (
            <button className="ghost" onClick={clearFilters}>クリア</button>
          )}
        </div>

        {logsError && <p className="auth-error">取得失敗: {logsError}</p>}

        <div className="log-list log-list--scroll">
          {logs.map((log) => (
            <div key={log.id} className="log-row">
              <span className="log-row__avatar">{FACE[log.avatarId] ?? "🙂"}</span>
              <span className="log-row__name">{log.name}</span>
              <span className="log-row__time">
                {formatDateTime(log.enteredAt)} → {formatDateTime(log.leftAt)}
              </span>
              <span className="log-row__duration">{formatTime(log.durationSec)}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="muted" style={{ textAlign: "center", padding: 32 }}>
              該当する履歴がありません
            </p>
          )}

          {hasMore && !filterDate && (
            <div className="log-list__more">
              <button onClick={loadMore}>▾ もっと表示（さらに{PAGE_DAYS}日前まで）</button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
