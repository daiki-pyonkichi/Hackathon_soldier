import { useState } from "react";
import { api } from "../api/client";
import type { User } from "../types";

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
    <section className="terminal" aria-label="認証ターミナル">
      <div className="terminal__brand">
        <span className="dot" aria-hidden />
        <span>LabSoldier</span>
      </div>
      <h1 className="terminal__title">
        Lab<em>Soldier</em>
      </h1>

      <div className="auth-tabs" role="tablist" aria-label="認証モード">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          className={mode === "login" ? "active" : ""}
          onClick={() => setMode("login")}
        >
          Sign-In
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={mode === "signup" ? "active" : ""}
          onClick={() => setMode("signup")}
        >
          Enlist
        </button>
      </div>

      <form onSubmit={submit} className="auth-form">
        <label className="field">
          <span>User ID</span>
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
          <span>Passcode</span>
          <input
            type="password"
            placeholder="8文字以上"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>
        <button className="primary" disabled={busy || !name.trim() || !password}>
          {busy
            ? "認証中..."
            : mode === "login"
              ? "▸ Authenticate"
              : "▸ Deploy"}
        </button>
      </form>

      {mode === "login" && (
        <p className="auth-hint">
          初期メンバーは <code>password123</code> でアクセス可能。
        </p>
      )}
      {error && <p className="auth-error">{error}</p>}
    </section>
  );
}
