const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const SERVICE_JAVA = `package app.lovable.ignitehabitspro;

import android.app.*;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.*;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.os.*;
import android.provider.Settings;
import android.view.*;
import android.widget.*;
import java.util.*;

public class FocusGuardService extends Service {
  private static final String CHANNEL = "focus_guard";
  private static final String PREFS = "ignite_focus_guard";
  private static final String ENDED = "focus_guard_ended";
  private final Handler handler = new Handler(Looper.getMainLooper());
  private UsageStatsManager usage;
  private final Set<String> blocked = new HashSet<>();
  private long endTime;
  private View overlay;
  private TextView countdown;
  private boolean showing = false;
  private long overlayDeadline = 0;

  @Override public void onCreate() { super.onCreate(); usage = (UsageStatsManager)getSystemService(USAGE_STATS_SERVICE); createChannel(); }

  @Override public int onStartCommand(Intent intent, int flags, int startId) {
    if (intent != null && "stop".equals(intent.getAction())) { stopGuard(false); return START_NOT_STICKY; }
    if (intent != null) {
      String[] pkgs = intent.getStringArrayExtra("blockedPackages");
      blocked.clear(); if (pkgs != null) Collections.addAll(blocked, pkgs);
      endTime = intent.getLongExtra("endTime", System.currentTimeMillis());
      getSharedPreferences(PREFS, MODE_PRIVATE).edit().putBoolean(ENDED, false).apply();
    }
    startForeground(77, buildNotification());
    handler.removeCallbacksAndMessages(null); handler.post(checkRunnable);
    return START_STICKY;
  }

  private final Runnable checkRunnable = new Runnable() { @Override public void run() {
    if (endTime <= System.currentTimeMillis()) { stopGuard(false); return; }
    if (!blocked.isEmpty()) {
      String current = getForegroundPackage();
      if (getPackageName().equals(current)) hideOverlay();
      else if (current != null && blocked.contains(current)) showOverlay(current);
    }
    handler.postDelayed(this, 600);
  }};

  private String getForegroundPackage() {
    try {
      long now = System.currentTimeMillis(); UsageEvents events = usage.queryEvents(now - 2000, now);
      UsageEvents.Event e = new UsageEvents.Event(); String latest = null; long latestTime = 0;
      while (events != null && events.hasNextEvent()) { events.getNextEvent(e); int type=e.getEventType();
        if (type == UsageEvents.Event.MOVE_TO_FOREGROUND || type == 1 || type == 23) if (e.getTimeStamp() >= latestTime) { latestTime=e.getTimeStamp(); latest=e.getPackageName(); }
      }
      return latest;
    } catch(Exception e) { return null; }
  }

  private void showOverlay(String pkg) {
    if (showing || !Settings.canDrawOverlays(this)) return;
    showing=true; overlayDeadline=System.currentTimeMillis()+15000;
    WindowManager wm=(WindowManager)getSystemService(WINDOW_SERVICE);
    LinearLayout root=new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setGravity(Gravity.CENTER); root.setPadding(42,42,42,42); root.setBackgroundColor(Color.rgb(18,18,28));
    TextView shield=text("🛡️",48,Color.WHITE,true); root.addView(shield,new LinearLayout.LayoutParams(-1,-2));
    root.addView(text("Stay in Focus",30,Color.WHITE,true));
    TextView msg=text("You opened a blocked app during your focus session.",16,Color.LTGRAY,false); msg.setGravity(Gravity.CENTER); root.addView(msg,margin(-1,-2,0,14));
    TextView app=text(getAppLabel(pkg),18,Color.rgb(255,120,60),true); root.addView(app,margin(-1,-2,0,22));
    countdown=text("15",56,Color.WHITE,true); root.addView(countdown,margin(-1,80,0,10));
    TextView hint=text("Return to Focus within 15 seconds",13,Color.GRAY,false); root.addView(hint,margin(-1,-2,0,24));
    Button back=new Button(this); back.setText("Back to Focus"); back.setOnClickListener(v->{launchApp();hideOverlay();}); root.addView(back,margin(-1,56,0,10));
    Button end=new Button(this); end.setText("End Session"); end.setOnClickListener(v->{markEnded();stopGuard(true);}); root.addView(end,margin(-1,52,0,0));
    overlay=root;
    WindowManager.LayoutParams lp=new WindowManager.LayoutParams(-1,-1,WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,PixelFormat.TRANSLUCENT);
    try { wm.addView(root,lp); handler.post(countdownRunnable); } catch(Exception e) { showing=false; overlay=null; }
  }

  private final Runnable countdownRunnable=new Runnable(){@Override public void run(){ if(!showing)return; int left=(int)Math.max(0,Math.ceil((overlayDeadline-System.currentTimeMillis())/1000.0)); if(countdown!=null)countdown.setText(String.valueOf(left)); if(left<=0){markEnded();stopGuard(true);return;} handler.postDelayed(this,250); }};
  private void hideOverlay(){if(!showing)return;try{((WindowManager)getSystemService(WINDOW_SERVICE)).removeView(overlay);}catch(Exception ignored){} overlay=null;countdown=null;showing=false;overlayDeadline=0;}
  private void launchApp(){Intent i=getPackageManager().getLaunchIntentForPackage(getPackageName());if(i!=null){i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);startActivity(i);}}
  private void markEnded(){getSharedPreferences(PREFS,MODE_PRIVATE).edit().putBoolean(ENDED,true).apply();}
  private void stopGuard(boolean ended){if(ended)markEnded();hideOverlay();handler.removeCallbacksAndMessages(null);try{stopForeground(true);}catch(Exception ignored){}stopSelf();}
  private String getAppLabel(String pkg){try{return getPackageManager().getApplicationLabel(getPackageManager().getApplicationInfo(pkg,0)).toString();}catch(Exception e){return pkg;}}
  private TextView text(String s,float size,int color,boolean bold){TextView t=new TextView(this);t.setText(s);t.setTextSize(size);t.setTextColor(color);t.setTypeface(null,bold?Typeface.BOLD:Typeface.NORMAL);t.setPadding(8,8,8,8);t.setGravity(Gravity.CENTER);return t;}
  private LinearLayout.LayoutParams margin(int w,int h,int l,int b){LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(w,h);p.setMargins(l,0,0,b);return p;}
  private Notification buildNotification(){Intent i=getPackageManager().getLaunchIntentForPackage(getPackageName());PendingIntent pi=PendingIntent.getActivity(this,0,i,PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);return new Notification.Builder(this,CHANNEL).setSmallIcon(getApplicationInfo().icon).setContentTitle("Focus session active").setContentText("Distraction blocking is running").setContentIntent(pi).setOngoing(true).build();}
  private void createChannel(){if(Build.VERSION.SDK_INT>=26){NotificationManager nm=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);nm.createNotificationChannel(new NotificationChannel(CHANNEL,"Focus Guard",NotificationManager.IMPORTANCE_LOW));}}
  @Override public void onDestroy(){hideOverlay();handler.removeCallbacksAndMessages(null);super.onDestroy();}
  @Override public IBinder onBind(Intent intent){return null;}
}
`;

module.exports = function withFocusGuard(config) {
  config = withAndroidManifest(config, config => {
    const manifest = config.modResults.manifest;
    manifest['uses-permission'] = manifest['uses-permission'] || [];
    const perms = manifest['uses-permission'].map(x => x.$ && x.$['android:name']);
    for (const p of ['android.permission.SYSTEM_ALERT_WINDOW','android.permission.FOREGROUND_SERVICE','android.permission.FOREGROUND_SERVICE_SPECIAL_USE']) if (!perms.includes(p)) manifest['uses-permission'].push({$: {'android:name': p}});
    manifest.queries = manifest.queries || [];
    if (!manifest.queries.some(q => q.intent && q.intent.some(i => i.$ && i.$['android:action']==='android.intent.action.MAIN'))) manifest.queries.push({intent:[{$:{'android:action':'android.intent.action.MAIN','android:category':'android.intent.category.LAUNCHER'}}]});
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults); app.service=app.service||[];
    if (!app.service.some(s=>s.$&&s.$['android:name']==='.FocusGuardService')) app.service.push({$: {'android:name':'.FocusGuardService','android:exported':'false','android:foregroundServiceType':'specialUse'}, property:[{$:{'android:name':'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE','android:value':'User-started focus session distraction blocking'}}]});
    return config;
  });
  return withDangerousMod(config,['android',async config=>{const dir=path.join(config.modRequest.platformProjectRoot,'app/src/main/java/app/lovable/ignitehabitspro');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'FocusGuardService.java'),SERVICE_JAVA);return config;}]);
};
