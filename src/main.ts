import "./style.css";
import { dayKey } from "./habits";
import { load, save } from "./store";
import { mount } from "./view";

const root = document.getElementById("app");
if (root !== null) {
  mount(root, load(), dayKey(new Date()), save, () => crypto.randomUUID());
}
