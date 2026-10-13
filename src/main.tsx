import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { AppProvider } from "./context/AppContext.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { registerServiceWorker } from "./lib/pushNotifications.ts";

// Register Service Worker for Web Push and background notifications
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  registerServiceWorker();
}

createRoot(document.getElementById("root")!).render(
  <AppWrapper>
    <AuthProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AuthProvider>
  </AppWrapper>
);
