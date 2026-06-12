import { NextRequest } from "next/server";
import { searchVisiblePeople } from "@/features/search/search-people";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiJson } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const people = await searchVisiblePeople(user, q);

  return apiJson({ people });
}
