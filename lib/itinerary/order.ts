type OrderedItem = {
  unscheduled: boolean;
  date?: string;
  startTime?: string | null;
};

export function compareItineraryItems(left: OrderedItem, right: OrderedItem): number {
  if (left.unscheduled !== right.unscheduled) {
    return left.unscheduled ? 1 : -1;
  }
  const byDate = (left.date ?? "").localeCompare(right.date ?? "");
  if (byDate !== 0) {
    return byDate;
  }
  if (left.startTime === right.startTime) {
    return 0;
  }
  if (left.startTime == null) {
    return 1;
  }
  if (right.startTime == null) {
    return -1;
  }
  return left.startTime.localeCompare(right.startTime);
}
