import { getPrisma } from "@/lib/db";
import type { ItineraryStore, StoredItineraryItem } from "@/lib/itinerary/types";

export class InMemoryItineraryStore implements ItineraryStore {
  private readonly items = new Map<string, StoredItineraryItem>();

  async add(item: StoredItineraryItem): Promise<void> {
    this.items.set(item.id, cloneItem(item));
  }

  async update(item: StoredItineraryItem): Promise<void> {
    if (!this.items.has(item.id)) {
      return;
    }
    this.items.set(item.id, cloneItem(item));
  }

  async remove(id: string): Promise<void> {
    this.items.delete(id);
  }

  async findById(id: string): Promise<StoredItineraryItem | null> {
    const item = this.items.get(id);
    return item ? cloneItem(item) : null;
  }

  async listByTrip(tripId: string): Promise<StoredItineraryItem[]> {
    const listed: StoredItineraryItem[] = [];
    for (const item of this.items.values()) {
      if (item.tripId === tripId) {
        listed.push(cloneItem(item));
      }
    }
    return listed;
  }

  async findBySuggestion(tripId: string, suggestionId: string): Promise<StoredItineraryItem | null> {
    for (const item of this.items.values()) {
      if (item.tripId === tripId && item.suggestionId === suggestionId) {
        return cloneItem(item);
      }
    }
    return null;
  }
}

function cloneItem(item: StoredItineraryItem): StoredItineraryItem {
  const stored: StoredItineraryItem = {
    id: item.id,
    tripId: item.tripId,
    suggestionId: item.suggestionId,
  };
  if (item.date) {
    stored.date = item.date;
    stored.startTime = item.startTime ?? null;
  }
  return stored;
}

export class PrismaItineraryStore implements ItineraryStore {
  async add(item: StoredItineraryItem): Promise<void> {
    await getPrisma().itineraryItem.create({ data: itemData(item) });
  }

  async update(item: StoredItineraryItem): Promise<void> {
    const existing = await getPrisma().itineraryItem.findUnique({ where: { id: item.id } });
    if (!existing) {
      return;
    }
    const { id, ...data } = itemData(item);
    await getPrisma().itineraryItem.update({ where: { id }, data });
  }

  async remove(id: string): Promise<void> {
    await getPrisma().itineraryItem.deleteMany({ where: { id } });
  }

  async findById(id: string): Promise<StoredItineraryItem | null> {
    const item = await getPrisma().itineraryItem.findUnique({ where: { id } });
    return item ? toItem(item) : null;
  }

  async listByTrip(tripId: string): Promise<StoredItineraryItem[]> {
    const items = await getPrisma().itineraryItem.findMany({
      where: { tripId },
      orderBy: { createdAt: "asc" },
    });
    return items.map(toItem);
  }

  async findBySuggestion(tripId: string, suggestionId: string): Promise<StoredItineraryItem | null> {
    const item = await getPrisma().itineraryItem.findFirst({
      where: { tripId, suggestionId },
      orderBy: { createdAt: "asc" },
    });
    return item ? toItem(item) : null;
  }
}

function itemData(item: StoredItineraryItem) {
  return {
    id: item.id,
    tripId: item.tripId,
    suggestionId: item.suggestionId,
    date: item.date ?? null,
    startTime: item.date ? (item.startTime ?? null) : null,
  };
}

function toItem(item: {
  id: string;
  tripId: string;
  suggestionId: string;
  date: string | null;
  startTime: string | null;
}): StoredItineraryItem {
  const stored: StoredItineraryItem = {
    id: item.id,
    tripId: item.tripId,
    suggestionId: item.suggestionId,
  };
  if (item.date) {
    stored.date = item.date;
    stored.startTime = item.startTime;
  }
  return stored;
}
