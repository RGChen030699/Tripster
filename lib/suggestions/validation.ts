import type { SuggestionCategory } from "@/lib/suggestions/types";

const NAME_LIMIT = 120;
const DESCRIPTION_LIMIT = 500;
const ADDRESS_LIMIT = 200;
const LINK_LIMIT = 500;

const CATEGORY_ERROR = "Choose a category: lodging, activity, place to visit, or restaurant.";

export type ParsedSuggestion =
  | {
      ok: true;
      category: SuggestionCategory;
      name: string;
      description: string | null;
      address: string | null;
      link: string | null;
    }
  | { ok: false; status: 400; error: string };

export function parseSuggestionInput(input: {
  category: unknown;
  name: unknown;
  description: unknown;
  address: unknown;
  link: unknown;
}): ParsedSuggestion {
  if (!isCategory(input.category)) {
    return { ok: false, status: 400, error: CATEGORY_ERROR };
  }
  if (typeof input.name !== "string" || input.name.trim() === "") {
    return { ok: false, status: 400, error: "Enter a suggestion name." };
  }
  const name = input.name.trim();
  if (name.length > NAME_LIMIT) {
    return { ok: false, status: 400, error: "Use a shorter suggestion name." };
  }

  const description = optionalText(input.description, DESCRIPTION_LIMIT, "Use a shorter description.");
  if (!description.ok) {
    return description;
  }
  const address = optionalText(input.address, ADDRESS_LIMIT, "Use a shorter address.");
  if (!address.ok) {
    return address;
  }
  const link = optionalLink(input.link);
  if (!link.ok) {
    return link;
  }

  return {
    ok: true,
    category: input.category,
    name,
    description: description.value,
    address: address.value,
    link: link.value,
  };
}

function isCategory(value: unknown): value is SuggestionCategory {
  return value === "lodging" || value === "activity" || value === "place" || value === "restaurant";
}

function optionalText(
  value: unknown,
  maxLength: number,
  tooLong: string,
): { ok: true; value: string | null } | { ok: false; status: 400; error: string } {
  if (value === undefined || value === null) {
    return { ok: true, value: null };
  }
  if (typeof value !== "string") {
    return { ok: false, status: 400, error: tooLong };
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return { ok: true, value: null };
  }
  if (trimmed.length > maxLength) {
    return { ok: false, status: 400, error: tooLong };
  }
  return { ok: true, value: trimmed };
}

function optionalLink(
  value: unknown,
): { ok: true; value: string | null } | { ok: false; status: 400; error: string } {
  if (value === undefined || value === null) {
    return { ok: true, value: null };
  }
  if (typeof value !== "string") {
    return { ok: false, status: 400, error: "Enter a valid link." };
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return { ok: true, value: null };
  }
  if (trimmed.length > LINK_LIMIT) {
    return { ok: false, status: 400, error: "Use a shorter link." };
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { ok: false, status: 400, error: "Enter a valid link." };
    }
  } catch {
    return { ok: false, status: 400, error: "Enter a valid link." };
  }
  return { ok: true, value: trimmed };
}
