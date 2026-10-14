import {
  addHabit,
  lastDays,
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
  today: Day,
  persist: (state: State) => void,
  newId: () => string,
): void {
  let state = initial;
  let editing: Editing = null;

  const update = (next: State): void => {
    state = next;
    persist(state);
    render();
  };

  const finishEdit = (commit: (value: string) => State, value: string | null): void => {
    if (editing === null) return;
    editing = null;
    if (value === null) render();
    else update(commit(value));
  };

  const editor = (initialValue: string, commit: (value: string) => State): HTMLInputElement => {
    const input = el("input", "name-input");
    input.value = initialValue;
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") finishEdit(commit, input.value);
      if (e.key === "Escape") finishEdit(commit, null);
    });
    input.addEventListener("blur", () => finishEdit(commit, input.value));
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
        focus = editor(habit.name, (v) => renameHabit(state, habit.id, v));
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
      focus = editor("", (v) => addHabit(state, newId(), v));
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

    root.replaceChildren(header, grid);
    if (focus !== null) {
      focus.focus();
      focus.select();
    }
  }

  render();
}
