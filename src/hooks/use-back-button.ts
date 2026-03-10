import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { App as CapApp } from "@capacitor/app";
import { toast } from "sonner";

export function useBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const lastBackPress = useRef<number>(0);

  useEffect(() => {
    const handler = CapApp.addListener("backButton", ({ canGoBack }) => {
      const isHome = location.pathname === "/";
      
      if (!isHome && canGoBack) {
        navigate(-1);
        return;
      }

      if (!isHome) {
        navigate("/");
        return;
      }

      // On home screen — double-back-to-exit
      const now = Date.now();
      if (now - lastBackPress.current < 2000) {
        CapApp.exitApp();
      } else {
        lastBackPress.current = now;
        toast("Press back again to exit", { duration: 2000 });
      }
    });

    return () => {
      handler.then((h) => h.remove());
    };
  }, [navigate, location.pathname]);
}
