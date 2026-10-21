export function jsonError(error: unknown) {
  if (error instanceof Response) return error;
  console.error(error);
  return Response.json({ error: "An unexpected server error occurred." }, { status: 500 });
}
