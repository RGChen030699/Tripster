import { getPrisma } from "@/lib/db";

export async function seedUser(id: string, email = `${id}@example.com`): Promise<void> {
  await getPrisma().user.create({
    data: { id, email, passwordHash: "hashed-secret" },
  });
}

export async function seedTrip(id = "trip-1"): Promise<void> {
  await getPrisma().trip.create({
    data: {
      id,
      name: "Lisbon week",
      destination: "Lisbon",
      startDate: "2026-11-01",
      endDate: "2026-11-05",
    },
  });
}

export async function seedSuggestion(id = "suggestion-1", tripId = "trip-1", authorId = "user-1"): Promise<void> {
  await getPrisma().suggestion.create({
    data: {
      id,
      tripId,
      authorId,
      category: "restaurant",
      name: "Pastel de nata",
    },
  });
}
