export interface User {
  id: string;
  name: string;
  avatarId: string;
  createdAt: string;
}

export interface LoginCredentials {
  name: string;
  password: string;
}

export type SignupInput = LoginCredentials;

export interface AuthResponse {
  user: User;
  token: string;
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
