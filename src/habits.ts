export type Day = string;

export interface Habit {
  id: string;
  name: string;
  done: Day[];
}

export interface State {
  habits: Habit[];
}

export function emptyState(): State {
  return { habits: [] };
}

const pad = (n: number): string => String(n).padStart(2, "0");

export function dayKey(date: Date): Day {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDay(day: Day): Date {
  const [y = 0, m = 1, d = 1] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(day: Day, n: number): Day {
  const date = parseDay(day);
  date.setDate(date.getDate() + n);
  return dayKey(date);
}

export function lastDays(today: Day, n: number): Day[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
}

export function daysBetween(from: Day, to: Day): number {
  return Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / 86_400_000);
}

export function historyDays(state: State, today: Day, minimum: number): Day[] {
  const oldest = state.habits.flatMap((h) => h.done).reduce((a, b) => (b < a ? b : a), today);
  return lastDays(today, Math.max(minimum, daysBetween(oldest, today) + 1));
}

export function streak(habit: Habit, today: Day): number {
  const done = new Set(habit.done);
  let day = done.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (done.has(day)) {
    count += 1;
    day = addDays(day, -1);
  }
  return count;
}

function updateHabit(state: State, id: string, change: (habit: Habit) => Habit): State {
  return { habits: state.habits.map((h) => (h.id === id ? change(h) : h)) };
}

export function toggleDay(state: State, id: string, day: Day): State {
  return updateHabit(state, id, (h) => ({
    ...h,
    done: h.done.includes(day) ? h.done.filter((d) => d !== day) : [...h.done, day],
  }));
}

export function addHabit(state: State, id: string, name: string): State {
  const trimmed = name.trim();
  if (trimmed === "") return state;
  return { habits: [...state.habits, { id, name: trimmed, done: [] }] };
}

export function removeHabit(state: State, id: string): State {
  return { habits: state.habits.filter((h) => h.id !== id) };
}

export function renameHabit(state: State, id: string, name: string): State {
  const trimmed = name.trim();
  if (trimmed === "") return removeHabit(state, id);
  return updateHabit(state, id, (h) => ({ ...h, name: trimmed }));
}

export function msUntilNextDay(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}
