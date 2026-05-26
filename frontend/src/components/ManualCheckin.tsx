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
      <div className="card__head">
        <h2>手動設定</h2>
      </div>
      <p className="muted" style={{ margin: "0 0 16px" }}>
        在室／不在を自分で切り替えます。
      </p>
      <div className="manual-row">
        <button
          className="primary"
          disabled={busy !== null}
          onClick={() => handle("checkin")}
        >
          {busy === "checkin" ? "…" : "在室にする"}
        </button>
        <button
          disabled={busy !== null}
          onClick={() => handle("checkout")}
        >
          {busy === "checkout" ? "…" : "不在にする"}
        </button>
        <span className="spacer" />
        {msg && <small>{msg}</small>}
      </div>
    </section>
  );
}
