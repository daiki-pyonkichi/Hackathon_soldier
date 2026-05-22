import type { PresenceView, User } from "../types";

/**
 * API クライアント。
 * 担当: フロントロジック係 (takebayashi)
 *   - 認証トークンの保存/失効処理、エラーハンドリングの強化
 */

const TOKEN_KEY = "labsoldier.token";

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export const api = {
  saveToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },
  isLoggedIn(): boolean {
    return !!getToken();
  },

  async login(name: string): Promise<User> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(`login failed: ${res.status}`);
    const data = (await res.json()) as { user: User; token: string };
    this.saveToken(data.token);
    return data.user;
  },

  async me(): Promise<User | null> {
    const res = await fetch("/api/me", { headers: authHeaders() });
    if (res.status === 401) return null;
    if (!res.ok) throw new Error(`me failed: ${res.status}`);
    const data = (await res.json()) as { user: User };
    return data.user;
  },

  async ping(): Promise<void> {
    const res = await fetch("/api/presence/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: "{}",
    });
    if (!res.ok) throw new Error(`ping failed: ${res.status}`);
  },

  async manual(action: "checkin" | "checkout"): Promise<void> {
    const res = await fetch("/api/presence/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) throw new Error(`manual failed: ${res.status}`);
  },

  async listPresences(): Promise<PresenceView[]> {
    const res = await fetch("/api/presence");
    if (!res.ok) throw new Error(`list failed: ${res.status}`);
    const data = (await res.json()) as { presences: PresenceView[] };
    return data.presences;
  },
};
