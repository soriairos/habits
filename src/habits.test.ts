import { describe, expect, it } from "vitest";
import {
  addHabit,
  dayKey,
  emptyState,
  lastDays,
  removeHabit,
  renameHabit,
  streak,
  toggleDay,
  type Habit,
  type State,
} from "./habits";

const habit = (done: string[]): Habit => ({ id: "h", name: "Read", done });

describe("dayKey", () => {
  it("formats a local date as YYYY-MM-DD", () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("lastDays", () => {
  it("returns n days ending today, oldest first, across month boundaries", () => {
    expect(lastDays("2026-03-02", 4)).toEqual([
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
    ]);
  });
});

describe("streak", () => {
  it("is zero with no checks", () => {
    expect(streak(habit([]), "2026-10-14")).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    expect(streak(habit(["2026-10-12", "2026-10-13", "2026-10-14"]), "2026-10-14")).toBe(3);
  });

  it("keeps yesterday's streak alive when today is unchecked", () => {
    expect(streak(habit(["2026-10-12", "2026-10-13"]), "2026-10-14")).toBe(2);
  });

  it("stops at a gap", () => {
    expect(streak(habit(["2026-10-10", "2026-10-12", "2026-10-13", "2026-10-14"]), "2026-10-14")).toBe(3);
  });

  it("is zero when neither today nor yesterday is checked", () => {
    expect(streak(habit(["2026-10-11", "2026-10-12"]), "2026-10-14")).toBe(0);
  });

  it("crosses month boundaries", () => {
    expect(streak(habit(["2026-09-30", "2026-10-01"]), "2026-10-01")).toBe(2);
  });
});

describe("toggleDay", () => {
  const state: State = { habits: [habit([])] };

  it("checks an unchecked day", () => {
    const next = toggleDay(state, "h", "2026-10-14");
    expect(next.habits[0]?.done).toEqual(["2026-10-14"]);
  });

  it("unchecks a checked day", () => {
    const next = toggleDay(toggleDay(state, "h", "2026-10-14"), "h", "2026-10-14");
    expect(next.habits[0]?.done).toEqual([]);
  });

  it("does not mutate the input", () => {
    toggleDay(state, "h", "2026-10-14");
    expect(state.habits[0]?.done).toEqual([]);
  });
});

describe("addHabit", () => {
  it("appends a habit with a trimmed name", () => {
    const next = addHabit(emptyState(), "a", "  Run  ");
    expect(next.habits).toEqual([{ id: "a", name: "Run", done: [] }]);
  });

  it("ignores blank names", () => {
    expect(addHabit(emptyState(), "a", "   ").habits).toEqual([]);
  });
});

describe("renameHabit", () => {
  const state: State = { habits: [habit(["2026-10-14"])] };

  it("renames with a trimmed name and keeps history", () => {
    expect(renameHabit(state, "h", " Write ").habits).toEqual([
      { id: "h", name: "Write", done: ["2026-10-14"] },
    ]);
  });

  it("removes the habit when the name is cleared", () => {
    expect(renameHabit(state, "h", "  ").habits).toEqual([]);
  });
});

describe("removeHabit", () => {
  it("removes only the matching habit", () => {
    const state = addHabit(addHabit(emptyState(), "a", "A"), "b", "B");
    expect(removeHabit(state, "a").habits.map((h) => h.id)).toEqual(["b"]);
  });
});
