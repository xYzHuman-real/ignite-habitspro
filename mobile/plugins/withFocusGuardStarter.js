const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const STARTER_JAVA = `package app.lovable.ignitehabitspro;

import android.app.Activity;
import android.app.AppOpsManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.os.Bundle;
import android.provider.Settings;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class FocusGuardStarterActivity extends Activity {
  private static final String LIST_ACTION = "app.lovable.ignitehabitspro.GET_INSTALLED_APPS";
  private static final String STOP_ACTION = "app.lovable.ignitehabitspro.STOP_FOCUS_GUARD";
  private static final String APPS_EXTRA = "app.lovable.ignitehabitspro.installedApps";

  private boolean usageAccessGranted() {
    try {
      AppOpsManager ops = (AppOpsManager)getSystemService(APP_OPS_SERVICE);
      int mode = ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), getPackageName());
      return mode == AppOpsManager.MODE_ALLOWED;
    } catch (Exception e) { return false; }
  }

  private void returnInstalledApps() {
    JSONArray result = new JSONArray();
    try {
      Intent launcherIntent = new Intent(Intent.ACTION_MAIN);
      launcherIntent.addCategory(Intent.CATEGORY_LAUNCHER);
      PackageManager pm = getPackageManager();
      List<ResolveInfo> activities = pm.queryIntentActivities(launcherIntent, PackageManager.MATCH_ALL);
      Set<String> seen = new HashSet<>();
      List<JSONObject> apps = new ArrayList<>();

      for (ResolveInfo info : activities) {
        if (info == null || info.activityInfo == null || info.activityInfo.applicationInfo == null) continue;
        String pkg = info.activityInfo.packageName;
        if (pkg == null || pkg.equals(getPackageName()) || seen.contains(pkg)) continue;
        seen.add(pkg);
        String label;
        try {
          CharSequence cs = info.loadLabel(pm);
          label = cs == null ? pkg : cs.toString();
        } catch (Exception e) { label = pkg; }
        JSONObject app = new JSONObject();
        app.put("name", label);
        app.put("packageName", pkg);
        apps.add(app);
      }

      Collections.sort(apps, new Comparator<JSONObject>() {
        @Override public int compare(JSONObject a, JSONObject b) {
          return a.optString("name", "").compareToIgnoreCase(b.optString("name", ""));
        }
      });
      for (JSONObject app : apps) result.put(app);
    } catch (Exception ignored) {}

    Intent out = new Intent();
    out.putExtra(APPS_EXTRA, result.toString());
    setResult(Activity.RESULT_OK, out);
    finish();
  }

  @Override protected void onCreate(Bundle state) {
    super.onCreate(state);
    Intent source = getIntent();
    String action = source.getAction();

    if (LIST_ACTION.equals(action)) { returnInstalledApps(); return; }

    if (STOP_ACTION.equals(action)) {
      Intent stop = new Intent(this, FocusGuardService.class); stop.setAction("stop"); startService(stop); finish(); return;
    }

    if (!usageAccessGranted()) { startActivity(new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)); finish(); return; }
    if (!Settings.canDrawOverlays(this)) { startActivity(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION)); finish(); return; }

    Intent i = new Intent(this, FocusGuardService.class);
    String raw = source.getStringExtra("app.lovable.ignitehabitspro.blockedPackages");
    String[] packages = new String[0];
    try { JSONArray a = new JSONArray(raw == null ? "[]" : raw); packages = new String[a.length()]; for (int n=0;n<a.length();n++) packages[n]=a.getString(n); } catch(Exception ignored) {}
    i.putExtra("blockedPackages", packages);
    i.putExtra("endTime", source.getLongExtra("app.lovable.ignitehabitspro.endTime", System.currentTimeMillis()+1000));
    if (android.os.Build.VERSION.SDK_INT >= 26) startForegroundService(i); else startService(i);
    finish();
  }
}
`;

module.exports = function withFocusGuardStarter(config) {
  config = withAndroidManifest(config, config => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults); app.activity = app.activity || [];
    if (!app.activity.some(a => a.$ && a.$['android:name'] === '.FocusGuardStarterActivity')) app.activity.push({$: {'android:name':'.FocusGuardStarterActivity','android:exported':'false','android:theme':'@android:style/Theme.Translucent.NoTitleBar'}});
    return config;
  });
  return withDangerousMod(config,['android',async config=>{const dir=path.join(config.modRequest.platformProjectRoot,'app/src/main/java/app/lovable/ignitehabitspro');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'FocusGuardStarterActivity.java'),STARTER_JAVA);return config;}]);
};
