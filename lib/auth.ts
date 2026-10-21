import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { query } from "./db";
import { SessionUser, UserRole } from "./types";

const COOKIE = "class_members_session";

function getSecret() {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  }
  return new TextEncoder().encode(process.env.SESSION_SECRET);
}

export async function createSession(user: SessionUser) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  const token = await new SignJWT(safeUser)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/"
  });
}

export function clearSession() {
  cookies().set(COOKIE, "", { httpOnly: true, maxAge: 0, path: "/" });
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.userId || !payload.role || !payload.memberId) return null;
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Response("Authentication required", { status: 401 });
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (!["CP", "CEPINE"].includes(session.role)) {
    throw new Response("Administrator permission required", { status: 403 });
  }
  return session;
}

export function isRole(value: unknown): value is UserRole {
  return value === "CP" || value === "CEPINE" || value === "MEMBER";
}

export async function loadUserByRegNumber(regNumber: string) {
  const result = await query<SessionUser>(
    `SELECT u.id AS "userId", u.member_id AS "memberId", m."RegNumber" AS "regNumber",
            u.phone_number AS "phoneNumber",
            u.email,
            u.role, u.password_hash AS "passwordHash",
            m.firstname, m."LastName" AS lastname, m.image
       FROM public.member_users u
       JOIN public.members m ON m.id = u.member_id
      WHERE lower(m."RegNumber") = lower($1)`,
    [regNumber.trim()]
  );
  return result.rows[0] ?? null;
}

export async function loadUserByPhone(phoneNumber: string) {
  const normalized = phoneNumber.replace(/\D/g, "");
  const result = await query<SessionUser>(
    `SELECT u.id AS "userId", u.member_id AS "memberId", m."RegNumber" AS "regNumber",
            u.phone_number AS "phoneNumber", u.email,
            u.role, u.password_hash AS "passwordHash",
            m.firstname, m."LastName" AS lastname, m.image
       FROM public.member_users u
       JOIN public.members m ON m.id = u.member_id
      WHERE u.phone_number = $1 AND u.role IN ('CP', 'CEPINE')`,
    [normalized]
  );
  return result.rows[0] ?? null;
}
