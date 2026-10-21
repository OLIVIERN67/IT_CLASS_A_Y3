import { query } from "@/lib/db";
import { requireAdmin, requireSession } from "@/lib/auth";
import { memberSchema } from "@/lib/validation";
import { jsonError } from "@/lib/http";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const result = await query(
      `SELECT id, "RegNumber" AS "regNumber", firstname, "LastName" AS lastname,
              "Role" AS role, image, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM public.members WHERE id = $1`,
      [params.id]
    );
    if (!result.rows[0]) return Response.json({ error: "Member not found." }, { status: 404 });
    return Response.json({ member: result.rows[0] });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const parsed = memberSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "Invalid member details." }, { status: 400 });
    const member = parsed.data;
    const result = await query(
      `UPDATE public.members SET "RegNumber"=$1, firstname=$2, "LastName"=$3,
       "Role"=$4, image=$5 WHERE id=$6
       RETURNING id, "RegNumber" AS "regNumber", firstname, "LastName" AS lastname, "Role" AS role, image`,
      [member.regNumber, member.firstname, member.lastname, member.role, member.image ?? null, params.id]
    );
    if (!result.rows[0]) return Response.json({ error: "Member not found." }, { status: 404 });
    return Response.json({ member: result.rows[0] });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const result = await query(`DELETE FROM public.members WHERE id=$1 RETURNING id`, [params.id]);
    if (!result.rows[0]) return Response.json({ error: "Member not found." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
