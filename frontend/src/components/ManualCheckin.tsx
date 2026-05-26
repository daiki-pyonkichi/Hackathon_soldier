import { useState } from "react";
import { api } from "../api/client";

/**
 * 退室トグル。
 * - 通常時: 「退室する」ボタン。押下で manualOff=true、以降の ping は無視される
 * - 退室中: 「在室を再開する」ボタン。押下で manualOff=false、次の ping から自動判定に戻る
 *
 * 状態 (manualOff) は親 (App.tsx) から渡される。
 */
export function ManualCheckin({
  manualOff,
  onChanged,
}: {
  manualOff: boolean;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const handle = async () => {
    setBusy(true);
    setMsg("");
    try {
      if (manualOff) {
        await api.resume();
        setMsg("在室判定を再開しました");
      } else {
        await api.leave();
        setMsg("退室にしました");
      }
      onChanged();
    } catch (e) {
      setMsg(`失敗: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card">
      <div className="card__head">
        <h2>手動設定</h2>
      </div>
      <p className="muted" style={{ margin: "0 0 16px" }}>
        {manualOff
          ? "現在「退室中」です。再開するまで Wi-Fi 自動判定はオフ。"
          : "明示的に退室する場合のみ押してください。"}
      </p>
      <div className="manual-row">
        <button
          className="primary"
          disabled={busy}
          onClick={handle}
        >
          {busy ? "…" : manualOff ? "在室を再開する" : "退室する"}
        </button>
        <span className="spacer" />
        {msg && <small>{msg}</small>}
      </div>
    </section>
  );
}
