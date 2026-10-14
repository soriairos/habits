import {
  addHabit,
  dayKey,
  emptyState,
  historyDays,
  msUntilNextDay,
  parseDay,
  renameHabit,
  streak,
  toggleDay,
  type Day,
  type State,
} from "./habits";
import { parseBackup, serializeBackup } from "./store";

type Editing = { kind: "rename"; id: string } | { kind: "new" } | null;
type Footer = "idle" | "import-failed" | "confirm-reset";
type Flash = { kind: "cell"; id: string; day: Day } | { kind: "row"; id: string } | null;

const MIN_DAYS = 28;
const RESET_WINDOW_MS = 4000;

const INITIALS = "SMTWTFS";

async function saveFile(file: File): Promise<void> {
  if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] }).catch(() => undefined);
    return;
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

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
  let footer: Footer = "idle";
  let flash: Flash = null;

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
    footer = "idle";
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
    const days = historyDays(state, today, MIN_DAYS);
    const month = parseDay(today).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const flashed = flash;
    flash = null;

    const header = el("header", "header");
    header.append(el("p", "date", month), el("h1", "title", "Habits"));

    const scroller = el("div", "scroller");
    const head = el("div", "row head");
    head.append(el("span", "name"));
    for (const day of days) {
      const date = parseDay(day);
      const label = el("span", day === today ? "initial is-today" : "initial");
      label.append(
        el("span", "letter", INITIALS[date.getDay()] ?? ""),
        el("span", "number", String(date.getDate())),
      );
      head.append(label);
    }
    head.append(el("span", "streak"));
    scroller.append(head);

    let focus: HTMLInputElement | null = null;

    for (const habit of state.habits) {
      const isNew = flashed?.kind === "row" && flashed.id === habit.id;
      const row = el("div", isNew ? "row is-flash" : "row");
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
        const popped = flashed?.kind === "cell" && flashed.id === habit.id && flashed.day === day;
        const cell = el("button", `cell${done ? " is-done" : ""}${popped ? " is-flash" : ""}`);
        cell.setAttribute("aria-label", `${habit.name} ${day}`);
        cell.setAttribute("aria-pressed", String(done));
        cell.addEventListener("click", () => {
          flash = { kind: "cell", id: habit.id, day };
          update(toggleDay(state, habit.id, day));
        });
        row.append(cell);
      }
      row.append(el("span", "streak", `${streak(habit, today)}d`));
      scroller.append(row);
    }

    const last = el("div", "new");
    if (editing?.kind === "new") {
      focus = editor(
        "",
        (v) => {
          const id = newId();
          flash = { kind: "row", id };
          return addHabit(state, id, v);
        },
        true,
      );
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

    const foot = el("footer", "footer");
    const exportLink = el("button", "link", "Export");
    exportLink.addEventListener("click", () => {
      const file = new File([serializeBackup(state)], `habits-${today}.json`, {
        type: "application/json",
      });
      void saveFile(file);
    });
    const picker = el("input", "picker");
    picker.type = "file";
    picker.accept = "application/json,.json";
    picker.addEventListener("change", () => {
      const file = picker.files?.[0];
      if (file === undefined) return;
      void file.text().then((text) => {
        const next = parseBackup(text);
        if (next === null) {
          footer = "import-failed";
          render();
        } else {
          editing = null;
          update(next);
        }
      });
    });
    const importLink = el("button", "link", "Import");
    importLink.addEventListener("click", () => picker.click());
    const confirming = footer === "confirm-reset";
    const resetLink = confirming
      ? el("button", "link is-armed", "Reset everything?")
      : el("button", "link", "Reset");
    resetLink.addEventListener("click", () => {
      if (footer === "confirm-reset") {
        editing = null;
        update(emptyState());
        return;
      }
      footer = "confirm-reset";
      render();
      setTimeout(() => {
        if (footer !== "confirm-reset") return;
        footer = "idle";
        if (editing === null) render();
      }, RESET_WINDOW_MS);
    });
    foot.append(exportLink, importLink, resetLink, picker);
    if (footer === "import-failed") foot.append(el("span", "notice", "Not a habits backup"));

    const previous = root.querySelector(".scroller");
    const fromEnd =
      previous === null ? 0 : previous.scrollWidth - previous.clientWidth - previous.scrollLeft;

    rendering = true;
    root.replaceChildren(header, scroller, last, foot);
    rendering = false;
    scroller.scrollLeft = scroller.scrollWidth - scroller.clientWidth - fromEnd;
    if (focus !== null) {
      focus.focus({ preventScroll: true });
      focus.select();
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refresh();
  });
  scheduleMidnight();
  render();
}
