import type { Memory, MemoryTag } from "@/lib/types";

export interface SearchFilters {
  query: string;
  tag: MemoryTag | "All";
}

export function filterMemories(memories: Memory[], filters: SearchFilters): Memory[] {
  const query = filters.query.trim().toLowerCase();

  return memories.filter((memory) => {
    const matchesTag = filters.tag === "All" || memory.tag === filters.tag;
    const matchesQuery =
      query.length === 0 ||
      memory.title.toLowerCase().includes(query) ||
      memory.description.toLowerCase().includes(query) ||
      (memory.tag?.toLowerCase().includes(query) ?? false);

    return matchesTag && matchesQuery;
  });
}

export function getTagCounts(memories: Memory[], query: string): Record<MemoryTag | "All", number> {
  const base = filterMemories(memories, { query, tag: "All" });
  const counts = {
    All: base.length,
    Travel: 0,
    Family: 0,
    Work: 0,
    Love: 0,
    Achievement: 0,
    Loss: 0,
    Friendship: 0,
    Everyday: 0,
  };

  for (const memory of base) {
    if (memory.tag) {
      counts[memory.tag] += 1;
    }
  }

  return counts;
}

export function splitHighlight(text: string, query: string): Array<{ text: string; match: boolean }> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [{ text, match: false }];
  }

  const index = text.toLowerCase().indexOf(trimmed.toLowerCase());
  if (index === -1) {
    return [{ text, match: false }];
  }

  return [
    { text: text.slice(0, index), match: false },
    { text: text.slice(index, index + trimmed.length), match: true },
    { text: text.slice(index + trimmed.length), match: false },
  ].filter((part) => part.text.length > 0);
}
