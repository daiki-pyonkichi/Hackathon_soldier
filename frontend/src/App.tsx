import { useEffect, useState } from "react";
import { api } from "./api/client";
import { usePresencePing } from "./hooks/usePresencePing";
import { PresenceList } from "./components/PresenceList";
import { ManualCheckin } from "./components/ManualCheckin";
import { Login } from "./pages/Login";
import type { User } from "./types";

function App() {
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = api.getStoredUser();
    if (storedUser) setMe(storedUser);

    api
      .me()
      .then((u) => setMe(u))
      .finally(() => setLoading(false));
  }, []);

  usePresencePing(me !== null);

  const logout = () => {
    api.clearToken();
    setMe(null);
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
      <PresenceList />
      <ManualCheckin />
    </>
  );
}

export default App;
