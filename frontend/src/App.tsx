import { useCallback, useEffect, useState } from "react";
import { api } from "./api/client";
import { usePresencePing } from "./hooks/usePresencePing";
import { PresenceList } from "./components/PresenceList";
import { ManualCheckin } from "./components/ManualCheckin";
import { AvatarModal } from "./components/AvatarModal";
import { Login } from "./pages/Login";
import { Ranking } from "./pages/Ranking";
import { Logs } from "./pages/Logs";
import type { PresenceView, User } from "./types";

type Tab = "home" | "ranking" | "logs";

function App() {
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [presences, setPresences] = useState<PresenceView[]>([]);
  const [presenceError, setPresenceError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  useEffect(() => {
    const storedUser = api.getStoredUser();
    if (storedUser) setMe(storedUser);

    api
      .me()
      .then((u) => setMe(u))
      .finally(() => setLoading(false));
  }, []);

  const fetchPresences = useCallback(async () => {
    try {
      const data = await api.listPresences();
      setPresences(data);
      setPresenceError(null);
    } catch (e) {
      setPresenceError(String(e));
    }
  }, []);

  useEffect(() => {
    if (!me) return;
    fetchPresences();
    const id = setInterval(fetchPresences, 15_000);
    return () => clearInterval(id);
  }, [me, fetchPresences]);

  const myPresence = me ? presences.find((p) => p.userId === me.id) : null;
  const manualOff = myPresence?.manualOff ?? false;

  // ログイン中かつ退室中でない時のみ ping を発信
  usePresencePing(me !== null && !manualOff);

  const logout = () => {
    api.clearToken();
    setMe(null);
    setPresences([]);
  };

  if (loading) {
    return (
      <p className="muted" style={{ textAlign: "center", marginTop: 80 }}>
        ▸ BOOTING…
      </p>
    );
  }
  if (!me) return <Login onLogin={setMe} />;

  return (
    <>
      <header className="ops-bar">
        <div>
          <span className="tag">Lab Presence HUD</span>
          <h1 className="ops-bar__title">
            Lab<em>Soldier</em>
          </h1>
          <p className="ops-bar__sub">研究室の戦況を可視化する</p>
        </div>
        <div className="ops-bar__user">
          <span className="who">{me.name}</span>
          <button className="ghost" onClick={() => setAvatarModalOpen(true)}>
            キャラ変更
          </button>
          <button className="ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {avatarModalOpen && (
        <AvatarModal
          current={me.avatarId}
          onClose={() => setAvatarModalOpen(false)}
          onSaved={(u) => setMe(u)}
        />
      )}
      <div className="nav-tabs">
        <button
          className={activeTab === "home" ? "active" : ""}
          onClick={() => setActiveTab("home")}
        >
          Home
        </button>
        <button
          className={activeTab === "ranking" ? "active" : ""}
          onClick={() => setActiveTab("ranking")}
        >
          Ranking
        </button>
        <button
          className={activeTab === "logs" ? "active" : ""}
          onClick={() => setActiveTab("logs")}
        >
          Logs
        </button>
      </div>

      {activeTab === "home" && (
        <>
          <PresenceList presences={presences} error={presenceError} />
          <ManualCheckin manualOff={manualOff} onChanged={fetchPresences} />
        </>
      )}
      {activeTab === "ranking" && <Ranking meId={me.id} />}
      {activeTab === "logs" && (
        <Logs
          meId={me.id}
          users={presences.map((p) => ({
            id: p.userId,
            name: p.name,
            avatarId: p.avatarId,
            createdAt: "",
          }))}
        />
      )}
    </>
  );
}

export default App;
