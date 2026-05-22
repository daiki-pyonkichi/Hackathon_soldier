import { useState } from "react";
import { api } from "../api/client";
import type { User } from "../types";

/**
 * 仮ログイン画面。名前を入力して "ログイン"。
 * 担当: フロントUI担当 / 認証担当
 *   - メールアドレス + パスワード（または Firebase Auth ）に差し替え
 */
export function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await api.login(name.trim());
      onLogin(user);
    } catch (err) {
      setError(`ログインに失敗しました: ${err}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card" style={{ maxWidth: 360, margin: "40px auto" }}>
      <h2 style={{ marginTop: 0 }}>ログイン</h2>
      <p style={{ color: "var(--muted)" }}>
        まずは仮のメンバー名（naganawa / tsutsumi / takebayashi / kuremoto）
        でログインしてください。
      </p>
      <form onSubmit={submit} className="row" style={{ gap: 8 }}>
        <input
          type="text"
          placeholder="例: naganawa"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <button className="primary" disabled={busy || !name.trim()}>
          {busy ? "..." : "ログイン"}
        </button>
      </form>
      {error && (
        <p style={{ color: "crimson", marginBottom: 0 }}>{error}</p>
      )}
    </section>
  );
}
