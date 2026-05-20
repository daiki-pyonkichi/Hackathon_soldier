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
    api
      .me()
      .then((u) => setMe(u))
      .finally(() => setLoading(false));
  }, []);

  // ログイン中は1分間隔でping
  usePresencePing(me !== null);

  const logout = () => {
    api.clearToken();
    setMe(null);
  };

  if (loading) return <p>読み込み中...</p>;
  if (!me) return <Login onLogin={setMe} />;

  return (
    <>
      <header>
        <div>
          <h1>🪖 LabSoldier</h1>
          <small>研究室にいる仲間が見える化</small>
        </div>
        <div className="row">
          <small>{me.name}</small>
          <button onClick={logout}>ログアウト</button>
        </div>
      </header>
      <PresenceList />
      <ManualCheckin />
    </>
  );
}

export default App;
