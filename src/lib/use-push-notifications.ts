import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function usePushNotifications() {
  const { user } = useAuth();
  const registered = useRef(false);

  useEffect(() => {
    if (!user || registered.current) return;
    if (!Capacitor.isNativePlatform()) return;

    const setup = async () => {
      try {
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === "prompt") {
          permStatus = await PushNotifications.requestPermissions();
        }
        if (permStatus.receive !== "granted") {
          console.log("Push notifications permission denied");
          return;
        }

        await PushNotifications.register();
        registered.current = true;

        PushNotifications.addListener("registration", async (token) => {
          console.log("Push token:", token.value);
          // Upsert token to database
          await supabase.from("push_tokens" as any).upsert(
            {
              user_id: user.id,
              token: token.value,
              platform: Capacitor.getPlatform(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,token" }
          );
        });

        PushNotifications.addListener("registrationError", (err) => {
          console.error("Push registration error:", err.error);
        });

        PushNotifications.addListener("pushNotificationReceived", (notification) => {
          console.log("Push received:", notification);
        });

        PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
          console.log("Push action:", notification);
          // Navigate based on data if needed
          const url = notification.notification.data?.action_url;
          if (url && typeof window !== "undefined") {
            window.location.hash = url;
          }
        });
      } catch (e) {
        console.error("Push notification setup error:", e);
      }
    };

    setup();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [user]);
}
