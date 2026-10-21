import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { isRole } from "@/lib/auth";
import { jsonError } from "@/lib/http";

// This endpoint is intentionally protected by a server-only bootstrap token.
// Remove SETUP_TOKEN after the initial accounts have been created.
export async function POST(request: Request) {
  try {
    if (!process.env.SETUP_TOKEN) return Response.json({ error: "Account setup is disabled." }, { status: 404 });
    const body = await request.json();
    if (body.token !== process.env.SETUP_TOKEN || !isRole(body.role)) {
      return Response.json({ error: "Invalid setup credentials." }, { status: 403 });
    }
    const member = await query<{ id: number }>(
      `SELECT id FROM public.members WHERE "RegNumber" = $1`,
      [body.regNumber]
    );
    if (!member.rows[0]) return Response.json({ error: "That registration number does not exist." }, { status: 404 });
    if (typeof body.password !== "string" || body.password.length < 8) {
      return Response.json({ error: "A valid password is required." }, { status: 400 });
    }
    const hash = await bcrypt.hash(body.password, 12);
    await query(
      `INSERT INTO public.member_users (member_id, email, password_hash, role)
       VALUES ($1, NULL, $2, $3)
       ON CONFLICT (member_id) DO UPDATE SET email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`,
      [member.rows[0].id, hash, body.role]
    );
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
