import bcrypt from "bcryptjs";
import { createSession, loadUserByPhone, loadUserByRegNumber } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { jsonError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "Enter a valid registration number and password." }, { status: 400 });
    const user = parsed.data.loginType === "representative"
      ? await loadUserByPhone(parsed.data.identifier)
      : await loadUserByRegNumber(parsed.data.identifier);
    if (!user || !user.passwordHash || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return Response.json({ error: "Invalid login details." }, { status: 401 });
    }
    await createSession(user);
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return Response.json({ user: publicUser });
  } catch (error) {
    return jsonError(error);
  }
}
