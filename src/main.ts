import { mount } from "svelte";
import "./app.css";
import Loader from "./lib/components/Loader.svelte";

const app = mount(Loader, {
  target: document.getElementById("app")!,
});

export default app;
