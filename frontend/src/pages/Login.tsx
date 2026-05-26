import { useState } from "react";
import { api } from "../api/client";
import type { User } from "../types";

/**
 * ログイン/登録画面。
 * UIは薄く保ち、認証処理は api client に委譲する。
 */
export function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const credentials = { name: name.trim(), password };
      const user = mode === "login"
        ? await api.login(credentials)
        : await api.signup(credentials);
      onLogin(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`${mode === "login" ? "ログイン" : "登録"}に失敗しました: ${message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card" style={{ maxWidth: 360, margin: "40px auto" }}>
      <h2 style={{ marginTop: 0 }}>ログイン</h2>
      <div className="auth-tabs" aria-label="認証モード">
        <button
          type="button"
          className={mode === "login" ? "active" : ""}
          onClick={() => setMode("login")}
        >
          ログイン
        </button>
        <button
          type="button"
          className={mode === "signup" ? "active" : ""}
          onClick={() => setMode("signup")}
        >
          新規登録
        </button>
      </div>
      <form onSubmit={submit} className="auth-form">
        <label className="field">
          <span>ユーザー名</span>
          <input
            type="text"
            placeholder="naganawa"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="username"
            autoFocus
          />
        </label>
        <label className="field">
          <span>パスワード</span>
          <input
            type="password"
            placeholder="8文字以上"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>
        <button className="primary" disabled={busy || !name.trim() || !password}>
          {busy ? "送信中..." : mode === "login" ? "ログイン" : "登録して始める"}
        </button>
      </form>
      {mode === "login" && (
        <p className="auth-hint">
          初期メンバーは <code>password123</code> で入れます。
        </p>
      )}
      {error && (
        <p style={{ color: "crimson", marginBottom: 0 }}>{error}</p>
      )}
    </section>
  );
}
