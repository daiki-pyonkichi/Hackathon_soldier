export type PresenceSource = "wifi" | "manual";

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
}

export interface PresenceView extends Presence {
  user: User;
  // 在室時間(秒)。キャラの状態変化計算用
  durationSec: number;
}
