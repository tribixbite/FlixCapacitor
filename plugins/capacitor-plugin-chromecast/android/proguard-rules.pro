# Capacitor Plugin Chromecast ProGuard Rules

# Keep all plugin classes
-keep class com.flixcapacitor.chromecast.** { *; }

# Keep Google Cast SDK classes
-keep class com.google.android.gms.cast.** { *; }
-keep class com.google.android.gms.common.** { *; }

# Keep Capacitor plugin annotations
-keep @com.getcapacitor.annotation.CapacitorPlugin class * {
    @com.getcapacitor.PluginMethod <methods>;
}

# Keep Cast SDK callback methods
-keepclassmembers class * implements com.google.android.gms.cast.framework.SessionManagerListener {
    *;
}

-keepclassmembers class * implements com.google.android.gms.cast.framework.media.RemoteMediaClient$Listener {
    *;
}

# Keep Cast Options Provider
-keep class * implements com.google.android.gms.cast.framework.OptionsProvider {
    public *;
}
