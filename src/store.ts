import { emptyState, type Habit, type State } from "./habits";

const KEY = "habits.v1";
const DAY = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toHabit(value: unknown): Habit | null {
  if (!isRecord(value)) return null;
  const { id, name, done } = value;
  if (typeof id !== "string" || typeof name !== "string" || !Array.isArray(done)) return null;
  const days = done as unknown[];
  if (!days.every((d) => typeof d === "string" && DAY.test(d))) return null;
  return { id, name, done: days as string[] };
}

function toState(value: unknown): State | null {
  if (!isRecord(value) || !Array.isArray(value.habits)) return null;
  const habits = (value.habits as unknown[]).map(toHabit);
  if (habits.some((h) => h === null)) return null;
  return { habits: habits as Habit[] };
}

export function parseBackup(text: string): State | null {
  try {
    return toState(JSON.parse(text));
  } catch {
    return null;
  }
}

export function serializeBackup(state: State): string {
  return JSON.stringify(state, null, 2);
}

export function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    return raw === null ? emptyState() : (parseBackup(raw) ?? emptyState());
  } catch {
    return emptyState();
  }
}

export function save(state: State): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    return;
  }
}
