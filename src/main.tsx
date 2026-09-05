import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installAmbientSoundFallback } from "./lib/ambient-sounds";

installAmbientSoundFallback();
createRoot(document.getElementById("root")!).render(<App />);
