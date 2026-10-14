import "./style.css";
import { load, save } from "./store";
import { mount } from "./view";

const root = document.getElementById("app");
if (root !== null) {
  mount(root, load(), () => new Date(), save, () => crypto.randomUUID());
}
