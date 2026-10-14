import {
  addHabit,
  dayKey,
  lastDays,
  msUntilNextDay,
  parseDay,
  renameHabit,
  streak,
  toggleDay,
  type Day,
  type State,
} from "./habits";

type Editing = { kind: "rename"; id: string } | { kind: "new" } | null;

const INITIALS = "SMTWTFS";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text = "",
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

export function mount(
  root: HTMLElement,
  initial: State,
  now: () => Date,
  persist: (state: State) => void,
  newId: () => string,
): void {
  let state = initial;
  let editing: Editing = null;
  let today: Day = dayKey(now());
  let rendering = false;

  const refresh = (): void => {
    const current = dayKey(now());
    if (current === today) return;
    today = current;
    if (editing === null) render();
  };

  const scheduleMidnight = (): void => {
    setTimeout(() => {
      refresh();
      scheduleMidnight();
    }, msUntilNextDay(now()) + 1000);
  };

  const update = (next: State): void => {
    state = next;
    persist(state);
    render();
  };

  const finishEdit = (
    commit: (value: string) => State,
    value: string | null,
    keepOpen: boolean,
  ): void => {
    if (editing === null) return;
    if (!keepOpen) editing = null;
    if (value === null) render();
    else update(commit(value));
  };

  const editor = (
    initialValue: string,
    commit: (value: string) => State,
    repeat: boolean,
  ): HTMLInputElement => {
    const input = el("input", "name-input");
    input.value = initialValue;
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") finishEdit(commit, input.value, repeat && input.value.trim() !== "");
      if (e.key === "Escape") finishEdit(commit, null, false);
    });
    input.addEventListener("blur", () => {
      if (!rendering) finishEdit(commit, input.value, false);
    });
    return input;
  };

  function render(): void {
    const days = lastDays(today, 7);
    const month = parseDay(today).toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const header = el("header", "header");
    header.append(el("p", "date", month), el("h1", "title", "Habits"));

    const grid = el("div", "grid");
    const head = el("div", "row head");
    head.append(el("span", "name"));
    for (const day of days) {
      const initial = INITIALS[parseDay(day).getDay()] ?? "";
      head.append(el("span", day === today ? "initial is-today" : "initial", initial));
    }
    head.append(el("span", "streak"));
    grid.append(head);

    let focus: HTMLInputElement | null = null;

    for (const habit of state.habits) {
      const row = el("div", "row");
      if (editing?.kind === "rename" && editing.id === habit.id) {
        focus = editor(habit.name, (v) => renameHabit(state, habit.id, v), false);
        row.append(focus);
      } else {
        const name = el("button", "name", habit.name);
        name.addEventListener("click", () => {
          editing = { kind: "rename", id: habit.id };
          render();
        });
        row.append(name);
      }
      for (const day of days) {
        const done = habit.done.includes(day);
        const cell = el("button", done ? "cell is-done" : "cell");
        cell.setAttribute("aria-label", `${habit.name} ${day}`);
        cell.setAttribute("aria-pressed", String(done));
        cell.addEventListener("click", () => update(toggleDay(state, habit.id, day)));
        row.append(cell);
      }
      row.append(el("span", "streak", `${streak(habit, today)}d`));
      grid.append(row);
    }

    const last = el("div", "new");
    if (editing?.kind === "new") {
      focus = editor("", (v) => addHabit(state, newId(), v), true);
      focus.placeholder = "New habit";
      last.append(focus);
    } else {
      const add = el("button", "add", "+ New habit");
      add.addEventListener("click", () => {
        editing = { kind: "new" };
        render();
      });
      last.append(add);
    }
    grid.append(last);

    rendering = true;
    root.replaceChildren(header, grid);
    rendering = false;
    if (focus !== null) {
      focus.focus();
      focus.select();
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refresh();
  });
  scheduleMidnight();
  render();
}
