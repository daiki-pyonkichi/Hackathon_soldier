export type PresenceSource = "wifi" | "manual";
export type PresenceStatus = "present" | "unknown" | "absent";

export interface User {
  id: string;
  name: string;
  avatarId: string;
  createdAt: string;
}

export interface AuthUserRecord extends User {
  passwordHash: string;
}

export interface Presence {
  userId: string;
  isPresent: boolean;
  source: PresenceSource;
  enteredAt: string | null; // ISO8601
  lastSeenAt: string | null;
  manualOff: boolean; // 明示的「退室中」フラグ。true の間は ping を無視する
}

export interface PresenceView {
  userId: string;
  name: string;
  avatarId: string;
  status: PresenceStatus;
  lastSeenAt: string | null;
  elapsedMin: number | null;
  enteredAt: string | null;
  manualOff: boolean;
}//フロントへ送るやつ

export interface PresenceLog {
  id: string;
  userId: string;
  enteredAt: string;
  leftAt: string;
  durationSec: number;
}
