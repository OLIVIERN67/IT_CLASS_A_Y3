import bcrypt from "bcryptjs";
import { createSession, loadUserByPhone, loadUserByRegNumber } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { jsonError } from "@/lib/http";

function isRepresentativeSchemaError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? error.code : undefined;
  return code === "42P01" || code === "42703";
}

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
    if (isRepresentativeSchemaError(error)) {
      console.error("Representative login requires the auth database migration.", error);
      return Response.json(
        { error: "Representative sign-in is not configured. Apply the database migration and try again." },
        { status: 503 }
      );
    }
    return jsonError(error);
  }
}
