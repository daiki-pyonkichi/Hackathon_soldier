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

export type PresenceStatus = "present" | "absent" | "unknown";

export interface PresenceView {
  userId: string;
  name: string;
  avatarId: string;
  status: PresenceStatus;
  enteredAt: string | null;
  lastSeenAt: string | null;
  elapsedMin: number | null;
  manualOff: boolean;
}
