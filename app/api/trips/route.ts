import { errorResponse } from "@/lib/auth/http";
import { getTripService } from "@/lib/trips/container";
import { readField, readJsonObject, requireUser } from "@/lib/trips/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const user = await requireUser(request);
  if (!user.ok) {
    return user.response;
  }
  const result = await getTripService().listTrips(user.user.id);
  return Response.json({ trips: result.trips });
}

export async function POST(request: Request): Promise<Response> {
  const user = await requireUser(request);
  if (!user.ok) {
    return user.response;
  }

  const body = await readJsonObject(request);
  const result = await getTripService().createTrip(user.user.id, {
    name: readField(body, "name"),
    destination: readField(body, "destination"),
    startDate: readField(body, "startDate"),
    endDate: readField(body, "endDate"),
  });
  if (!result.ok) {
    return errorResponse(result.error, result.status);
  }
  return Response.json({ trip: result.trip }, { status: 201 });
}
