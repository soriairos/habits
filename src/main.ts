import "./style.css";
import { load, save } from "./store";
import { mount } from "./view";

const root = document.getElementById("app");
if (root !== null) {
  mount(root, load(), () => new Date(), save, () => crypto.randomUUID());
}

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
}
