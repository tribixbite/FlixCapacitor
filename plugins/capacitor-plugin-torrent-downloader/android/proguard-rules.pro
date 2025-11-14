# Capacitor Plugin Torrent Downloader ProGuard Rules

# Keep all plugin classes
-keep class com.flixcapacitor.downloader.** { *; }

# Keep jlibtorrent classes
-keep class com.frostwire.jlibtorrent.** { *; }
-keep class com.frostwire.jlibtorrent.swig.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep Capacitor plugin annotations
-keep @com.getcapacitor.annotation.CapacitorPlugin class * {
    @com.getcapacitor.PluginMethod <methods>;
}

# Keep coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepclassmembernames class kotlinx.** {
    volatile <fields>;
}
