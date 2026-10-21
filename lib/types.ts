export type UserRole = "CP" | "CEPINE" | "MEMBER";

export type SessionUser = {
  userId: number;
  memberId: number;
  regNumber: string;
  email: string;
  role: UserRole;
  firstname: string;
  lastname: string;
  image: string | null;
  passwordHash?: string;
};

export type Member = {
  id: number;
  regNumber: string;
  firstname: string;
  lastname: string;
  role: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
};
