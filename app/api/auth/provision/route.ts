import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { isRole } from "@/lib/auth";
import { jsonError } from "@/lib/http";

// Bootstrap-only operation. Use it once to give every existing member a login,
// then remove SETUP_TOKEN from the deployment environment.
export async function POST(request: Request) {
  try {
    if (!process.env.SETUP_TOKEN) return Response.json({ error: "Account provisioning is disabled." }, { status: 404 });
    const body = await request.json();
    if (body.token !== process.env.SETUP_TOKEN || typeof body.password !== "string" || body.password.length < 8) {
      return Response.json({ error: "Invalid provisioning credentials." }, { status: 403 });
    }
    const hash = await bcrypt.hash(body.password, 12);
    const result = await query<{ id: number }>(
      `INSERT INTO public.member_users (member_id, password_hash, role)
       SELECT m.id, $1,
         CASE
           WHEN upper(trim(m."Role")) LIKE '%CEPINE%' THEN 'CEPINE'
           WHEN upper(trim(m."Role")) LIKE '%CP%' THEN 'CP'
           ELSE 'MEMBER'
         END
       FROM public.members m
       ON CONFLICT (member_id) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             role = EXCLUDED.role
       RETURNING id`,
      [hash]
    );
    return Response.json({ ok: true, provisioned: result.rowCount ?? 0 }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
