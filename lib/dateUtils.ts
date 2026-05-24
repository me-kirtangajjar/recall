import type { Memory } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en", {
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(date: string): string {
  return dateFormatter.format(toLocalDate(date));
}

export function formatDateTime(date: string, time: string | null): string {
  if (!time) {
    return formatDate(date);
  }

  const [hours, minutes] = time.split(":").map(Number);
  const value = toLocalDate(date);
  value.setHours(hours, minutes, 0, 0);
  return `${formatDate(date)} · ${timeFormatter.format(value)}`;
}

export function toLocalDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getYear(date: string): string {
  return date.slice(0, 4);
}

export function sortMemories(memories: Memory[], order: "newest" | "oldest"): Memory[] {
  return [...memories].sort((a, b) => {
    const aValue = `${a.date}T${a.time ?? "00:00"}`;
    const bValue = `${b.date}T${b.time ?? "00:00"}`;
    return order === "newest" ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
  });
}

export function getThisDayMemory(memories: Memory[], now = new Date()): Memory | null {
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const year = now.getFullYear();

  const matches = memories
    .filter((memory) => {
      const date = toLocalDate(memory.date);
      return date.getMonth() + 1 === month && date.getDate() === day && date.getFullYear() < year;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return matches[0] ?? null;
}

export function yearsAgo(date: string, now = new Date()): number {
  return now.getFullYear() - toLocalDate(date).getFullYear();
}

export function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function dateHash(value: string): number {
  return value.split("").reduce((hash, char) => hash + char.charCodeAt(0), 0);
}

export function getMemoryOfTheDay(memories: Memory[], now = new Date()): Memory | null {
  if (memories.length === 0) {
    return null;
  }

  return memories[dateHash(todayKey(now)) % memories.length];
}
