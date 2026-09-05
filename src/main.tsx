import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installAmbientSoundFallback } from "./lib/ambient-sounds";
import { installNativeFocusBridge } from "./lib/native-focus-bridge";

installAmbientSoundFallback();
installNativeFocusBridge();
createRoot(document.getElementById("root")!).render(<App />);
