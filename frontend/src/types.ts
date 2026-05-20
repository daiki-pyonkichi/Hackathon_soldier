export interface User {
  id: string;
  name: string;
  avatarId: string;
}

export type PresenceSource = "wifi" | "manual";

export interface PresenceView {
  userId: string;
  isPresent: boolean;
  source: PresenceSource;
  enteredAt: string | null;
  lastSeenAt: string | null;
  durationSec: number;
  user: User;
}
