export interface AuthUser {
  id: string;
  username: string;
  nickname: string;
  role: 'admin' | 'user';
}

export interface LoginFormData {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
