import { useCallback, useEffect, useState } from "react";
import { api } from "./api/client";
import { usePresencePing } from "./hooks/usePresencePing";
import { PresenceList } from "./components/PresenceList";
import { ManualCheckin } from "./components/ManualCheckin";
import { Login } from "./pages/Login";
import type { PresenceView, User } from "./types";

function App() {
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [presences, setPresences] = useState<PresenceView[]>([]);
  const [presenceError, setPresenceError] = useState<string | null>(null);

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
          <button className="ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </header>
      <PresenceList presences={presences} error={presenceError} />
      <ManualCheckin manualOff={manualOff} onChanged={fetchPresences} />
    </>
  );
}

export default App;
