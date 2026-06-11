# Native Android: Blocked-App Detection + Background Reliability

Web preview keeps working without any of this. The code below only matters
once you've run `npx cap add android`. iOS does not allow foreground-app
inspection — these features are Android-only.

## 1. Generate the Android project

```bash
npm install
npx cap add android
npx cap sync
```

## 2. Add the BlockedAppMonitor Capacitor plugin

Inside the generated `android/app/src/main/java/app/lovable/ignitehabitspro/`
folder, create two files:

### `BlockedAppMonitorPlugin.kt`

```kotlin
package app.lovable.ignitehabitspro

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.util.Timer
import java.util.TimerTask

@CapacitorPlugin(name = "BlockedAppMonitor")
class BlockedAppMonitorPlugin : Plugin() {

    private var timer: Timer? = null
    private var lastEventTs: Long = 0
    private var blockedPackages: Set<String> = emptySet()
    private var lastNotifiedPackage: String? = null
    private var lastNotifiedAt: Long = 0

    @PluginMethod
    fun hasUsageAccess(call: PluginCall) {
        val ctx = context
        val appOps = ctx.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            android.os.Process.myUid(),
            ctx.packageName
        )
        val ret = JSObject()
        ret.put("granted", mode == AppOpsManager.MODE_ALLOWED)
        call.resolve(ret)
    }

    @PluginMethod
    fun openUsageAccessSettings(call: PluginCall) {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
        call.resolve()
    }

    @PluginMethod
    fun requestIgnoreBatteryOptimizations(call: PluginCall) {
        val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        val pkg = context.packageName
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
            !pm.isIgnoringBatteryOptimizations(pkg)) {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
            intent.data = Uri.parse("package:$pkg")
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        }
        call.resolve()
    }

    @PluginMethod
    fun openAppSettings(call: PluginCall) {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
        intent.data = Uri.parse("package:${context.packageName}")
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
        call.resolve()
    }

    @PluginMethod
    fun startMonitoring(call: PluginCall) {
        val arr = call.getArray("packages") ?: return call.reject("packages required")
        val pollMs = call.getInt("pollMs") ?: 1500
        blockedPackages = (0 until arr.length()).map { arr.getString(it) }.toSet()
        lastEventTs = System.currentTimeMillis() - 60_000

        timer?.cancel()
        timer = Timer()
        timer?.scheduleAtFixedRate(object : TimerTask() {
            override fun run() { pollUsage() }
        }, 0, pollMs.toLong())

        call.resolve()
    }

    @PluginMethod
    fun stopMonitoring(call: PluginCall) {
        timer?.cancel(); timer = null
        call.resolve()
    }

    private fun pollUsage() {
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val now = System.currentTimeMillis()
        val events = usm.queryEvents(lastEventTs, now)
        val ev = UsageEvents.Event()
        var latestPkg: String? = null
        while (events.hasNext()) {
            events.getNextEvent(ev)
            if (ev.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                latestPkg = ev.packageName
            }
        }
        lastEventTs = now
        if (latestPkg != null && blockedPackages.contains(latestPkg)) {
            // Debounce: don't spam the same package within 10s.
            if (latestPkg == lastNotifiedPackage && now - lastNotifiedAt < 10_000) return
            lastNotifiedPackage = latestPkg
            lastNotifiedAt = now
            val data = JSObject()
            data.put("package", latestPkg)
            notifyListeners("blockedAppOpened", data)

            // Bring our app to the front so the overlay is visible immediately.
            val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
            launch?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
            if (launch != null) context.startActivity(launch)
        }
    }
}
```

### Register the plugin

Edit `android/app/src/main/java/app/lovable/ignitehabitspro/MainActivity.java`
(or the Kotlin equivalent generated by Capacitor):

```java
public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(BlockedAppMonitorPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
```

### AndroidManifest.xml permissions

Add inside `<manifest>` in `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" tools:ignore="ProtectedPermissions" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

…and add `xmlns:tools="http://schemas.android.com/tools"` to the `<manifest>` element.

## 3. Local notifications (already wired)

`@capacitor/local-notifications` is installed. Use it from any TS file:

```ts
import { LocalNotifications } from "@capacitor/local-notifications";
await LocalNotifications.schedule({
  notifications: [{
    id: 1,
    title: "Time for your habit",
    body: "Tap to log it in 10 seconds.",
    schedule: { at: new Date(Date.now() + 60_000) },
  }]
});
```

The OS fires these even when the JS bridge is suspended — use them for
habit reminders, streak alerts, and focus completion pings.

## 4. Manual APK test checklist

After `npx cap sync && npx cap run android`:

- [ ] First launch: onboarding → permission primers appear in order, each opens the right system page.
- [ ] Habits: swipe right completes with haptic; swipe left removes a todo with haptic.
- [ ] Focus: start a 1-min focus session, lock the phone for 90s, unlock → timer is still counting accurately, notification fires on completion.
- [ ] Focus + blocked-app: start a focus session, open Instagram → app is brought back to front and Focus Protection overlay shows within ~2 seconds.
- [ ] "End Session" on the overlay clears the timer; "Return to Focus" dismisses cleanly.
