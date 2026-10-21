import { query } from "@/lib/db";
import { requireAdmin, requireSession } from "@/lib/auth";
import { memberSchema } from "@/lib/validation";
import { jsonError } from "@/lib/http";

const selectMembers = `SELECT id, "RegNumber" AS "regNumber", firstname,
  "LastName" AS lastname, "Role" AS role, image, created_at AS "createdAt",
  updated_at AS "updatedAt" FROM public.members`;

export async function GET(request: Request) {
  try {
    await requireSession();
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim() ?? "";
    const role = url.searchParams.get("role")?.trim() ?? "";
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 100), 1), 200);
    const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);
    const result = await query(
      `${selectMembers} WHERE ($1 = '' OR firstname ILIKE '%' || $1 || '%' OR "LastName" ILIKE '%' || $1 || '%' OR "RegNumber" ILIKE '%' || $1 || '%')
       AND ($2 = '' OR "Role" = $2) ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [search, role, limit, offset]
    );
    const stats = await query(
      `SELECT count(*)::int AS total,
        count(*) FILTER (WHERE image IS NOT NULL AND image <> '')::int AS "withPhotos",
        count(*) FILTER (WHERE image IS NULL OR image = '')::int AS "withoutPhotos",
        count(*) FILTER (WHERE upper("Role") IN ('CP','CEPINE'))::int AS representatives
       FROM public.members`
    );
    return Response.json({ members: result.rows, stats: stats.rows[0] });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const parsed = memberSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "Invalid member details." }, { status: 400 });
    const member = parsed.data;
    const result = await query(
      `INSERT INTO public.members ("RegNumber", firstname, "LastName", "Role", image)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, "RegNumber" AS "regNumber", firstname, "LastName" AS lastname, "Role" AS role, image`,
      [member.regNumber, member.firstname, member.lastname, member.role, member.image ?? null]
    );
    return Response.json({ member: result.rows[0] }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
