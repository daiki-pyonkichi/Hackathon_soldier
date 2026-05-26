export type PresenceSource = "wifi" | "manual";
export type PresenceStatus = "present" | "unknown" | "absent";

export interface User {
  id: string;
  name: string;
  avatarId: string;
}

export interface Presence {
  userId: string;
  isPresent: boolean;
  source: PresenceSource;
  enteredAt: string | null; // ISO8601
  lastSeenAt: string | null;
}

export interface PresenceView {
  userId: string;
  name: string;
  avatarId: string;
  status: PresenceStatus;
  lastSeenAt: string | null;
  elapsedMin: number | null;
  enteredAt: string | null;
}//フロントへ送るやつ

export interface PresenceLog {
  id: string;
  userId: string;
  enteredAt: string;
  leftAt: string;
  durationSec: number;
}
