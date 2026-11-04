interface auth {
  userName: string;
  userEmail: string;
  password: string;
  confirmPassword?: string;
  isAdmin?: boolean;
}

export type { auth }; 