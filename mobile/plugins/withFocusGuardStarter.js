const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const STARTER_JAVA = `package app.lovable.ignitehabitspro;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import org.json.JSONArray;

public class FocusGuardStarterActivity extends Activity {
  @Override protected void onCreate(Bundle state) {
    super.onCreate(state);
    Intent i = new Intent(this, FocusGuardService.class);
    String action = getIntent().getAction();
    if ("app.lovable.ignitehabitspro.STOP_FOCUS_GUARD".equals(action)) {
      i.setAction("stop");
    } else {
      String raw = getIntent().getStringExtra("app.lovable.ignitehabitspro.blockedPackages");
      String[] packages = new String[0];
      try {
        JSONArray a = new JSONArray(raw == null ? "[]" : raw);
        packages = new String[a.length()];
        for (int n=0;n<a.length();n++) packages[n]=a.getString(n);
      } catch(Exception ignored) {}
      i.putExtra("blockedPackages", packages);
      i.putExtra("endTime", getIntent().getLongExtra("app.lovable.ignitehabitspro.endTime", System.currentTimeMillis()+1000));
    }
    if (android.os.Build.VERSION.SDK_INT >= 26 && !"stop".equals(i.getAction())) startForegroundService(i); else startService(i);
    finish();
  }
}
`;

module.exports = function withFocusGuardStarter(config) {
  config = withAndroidManifest(config, config => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    app.activity = app.activity || [];
    if (!app.activity.some(a => a.$ && a.$['android:name'] === '.FocusGuardStarterActivity')) {
      app.activity.push({$: {'android:name': '.FocusGuardStarterActivity','android:exported':'false','android:theme':'@android:style/Theme.Translucent.NoTitleBar'}});
    }
    return config;
  });
  return withDangerousMod(config,['android',async config=>{const dir=path.join(config.modRequest.platformProjectRoot,'app/src/main/java/app/lovable/ignitehabitspro');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'FocusGuardStarterActivity.java'),STARTER_JAVA);return config;}]);
};
