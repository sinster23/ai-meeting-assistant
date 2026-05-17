// packages/types/auth.ts

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
}

export interface AuthSession {
  user: AuthUser;
  session: {
    id: string;
    userId: string;
    expiresAt: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthError {
  message: string;
  code?: string;
}