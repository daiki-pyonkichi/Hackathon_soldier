import { useState } from "react";
import { api } from "../api/client";

/**
 * 手動チェックイン／チェックアウトのボタン。
 * 担当: フロントUI担当
 *   - 状態に応じた表示の切り替え、トースト通知など
 */
export function ManualCheckin() {
  const [busy, setBusy] = useState<"checkin" | "checkout" | null>(null);
  const [msg, setMsg] = useState<string>("");

  const handle = async (action: "checkin" | "checkout") => {
    setBusy(action);
    setMsg("");
    try {
      await api.manual(action);
      setMsg(action === "checkin" ? "在室にしました" : "退室にしました");
    } catch (e) {
      setMsg(`失敗: ${e}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>手動切替</h2>
      <p style={{ marginTop: 0, color: "var(--muted)" }}>
        Wi-Fi 判定が効かないとき（出張先、4G接続時など）の補助。
      </p>
      <div className="row">
        <button
          className="primary"
          disabled={busy !== null}
          onClick={() => handle("checkin")}
        >
          {busy === "checkin" ? "..." : "チェックイン"}
        </button>
        <button disabled={busy !== null} onClick={() => handle("checkout")}>
          {busy === "checkout" ? "..." : "チェックアウト"}
        </button>
        <span className="spacer" />
        {msg && <small>{msg}</small>}
      </div>
    </section>
  );
}
