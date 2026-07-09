import { NextResponse } from "next/server";
import { fetchWalkingRoute, routingConfigured } from "@/lib/routing/openrouteservice";

export async function GET(request: Request) {
  if (!routingConfigured()) {
    return NextResponse.json({ route: null });
  }

  const { searchParams } = new URL(request.url);
  const fromLat = Number(searchParams.get("fromLat"));
  const fromLng = Number(searchParams.get("fromLng"));
  const toLat = Number(searchParams.get("toLat"));
  const toLng = Number(searchParams.get("toLng"));

  if ([fromLat, fromLng, toLat, toLng].some((n) => Number.isNaN(n))) {
    return NextResponse.json({ error: "Ungültige Koordinaten." }, { status: 400 });
  }

  try {
    const route = await fetchWalkingRoute(
      { latitude: fromLat, longitude: fromLng },
      { latitude: toLat, longitude: toLng },
    );
    return NextResponse.json({ route });
  } catch {
    return NextResponse.json({ route: null });
  }
}
