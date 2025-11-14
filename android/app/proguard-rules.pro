# FlixCapacitor ProGuard Rules
# Version: 1.0.0
# Date: 2025-11-14
#
# These rules prevent ProGuard from obfuscating classes that need to be
# accessible at runtime, particularly for reflection, JavaScript interfaces,
# and third-party libraries.

# ===== Preserve Line Numbers for Crash Reporting =====
# This is critical for debugging production crashes in Sentry
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ===== Capacitor Core =====
# Capacitor uses reflection extensively, so we need to keep all plugin classes
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep @com.getcapacitor.annotation.PermissionCallback class * { *; }
-dontwarn com.getcapacitor.**

# ===== Capacitor Community Plugins =====
-keep class com.getcapacitor.community.** { *; }
-keepclassmembers class com.getcapacitor.community.** { *; }
-dontwarn com.getcapacitor.community.**

# ===== SQLite Plugin =====
-keep class org.sqlite.** { *; }
-keep class org.sqlite.database.** { *; }
-keep class android.database.sqlite.** { *; }
-keepclassmembers class * extends android.database.sqlite.SQLiteOpenHelper { *; }
-dontwarn org.sqlite.**

# ===== Custom Capacitor Plugins =====
# Our custom plugins: directory-picker, media-permissions, torrent-streamer
-keep class com.tribixbite.flixcapacitor.plugins.** { *; }
-keepclassmembers class com.tribixbite.flixcapacitor.plugins.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class com.tribixbite.flixcapacitor.plugins.** { *; }

# ===== jlibtorrent - Torrent Streaming =====
# Keep JNI native methods for torrent functionality
# Required for FrostWire jlibtorrent to work correctly with ProGuard/R8
-keep class com.frostwire.jlibtorrent.swig.libtorrent_jni { *; }
-keep class com.frostwire.jlibtorrent.** { *; }
-keepclassmembers class com.frostwire.jlibtorrent.** { *; }
-dontwarn com.frostwire.jlibtorrent.**

# ===== JavaScript Interface (WebView Bridge) =====
# Critical: These methods are called from JavaScript
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class * extends android.webkit.WebViewClient { *; }
-keep class * extends android.webkit.WebChromeClient { *; }
-keepclassmembers class * extends android.webkit.WebView { *; }

# ===== Supabase SDK =====
# Supabase uses reflection and JSON serialization
-keep class io.supabase.** { *; }
-keep class com.supabase.** { *; }
-keepclassmembers class io.supabase.** { *; }
-keepclassmembers class com.supabase.** { *; }
-dontwarn io.supabase.**
-dontwarn com.supabase.**

# ===== JSON/Gson (used by Supabase and APIs) =====
-keepattributes Signature
-keepattributes *Annotation*
-keep class sun.misc.Unsafe { *; }
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapter { *; }
-keep class * implements com.google.gson.TypeAdapterFactory { *; }
-keep class * implements com.google.gson.JsonSerializer { *; }
-keep class * implements com.google.gson.JsonDeserializer { *; }

# ===== Model Classes =====
# Keep model classes that are serialized/deserialized
-keep class com.tribixbite.flixcapacitor.models.** { *; }
-keepclassmembers class com.tribixbite.flixcapacitor.models.** { *; }

# ===== Android Media APIs =====
# Used for video playback
-keep class android.media.** { *; }
-keep class android.media.session.** { *; }
-keepclassmembers class android.media.** { *; }
-dontwarn android.media.**

# ===== Android MediaStore =====
# Used for file access
-keep class android.provider.MediaStore** { *; }
-keepclassmembers class android.provider.MediaStore** { *; }

# ===== Android Content Providers =====
# Used for file sharing and access
-keep class * extends android.content.ContentProvider { *; }
-keepclassmembers class * extends android.content.ContentProvider { *; }

# ===== Android Intents and Activities =====
# Deep linking and intent handling
-keep class * extends android.app.Activity { *; }
-keep class * extends android.app.Service { *; }
-keep class * extends android.content.BroadcastReceiver { *; }

# ===== Kotlin =====
# Preserve Kotlin metadata for reflection
-keep class kotlin.** { *; }
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
-keepclassmembers class **$WhenMappings { *; }
-keepclassmembers class kotlin.Metadata { *; }
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.coroutines.**

# ===== OkHttp (used by Supabase) =====
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okio.** { *; }

# ===== Retrofit (if used) =====
-keep class retrofit2.** { *; }
-keepattributes Exceptions
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}

# ===== AndroidX =====
-keep class androidx.** { *; }
-keep interface androidx.** { *; }
-dontwarn androidx.**

# ===== Google Play Services =====
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# ===== File Access and Storage =====
-keep class java.io.** { *; }
-keep class java.nio.** { *; }
-dontwarn java.nio.file.**

# ===== Networking =====
-keep class java.net.** { *; }
-keepclassmembers class java.net.** { *; }

# ===== Sentry Crash Reporting =====
# Phase 12E Day 6: Production Monitoring
-keep class io.sentry.** { *; }
-keep interface io.sentry.** { *; }
-keepclassmembers class io.sentry.** { *; }
-dontwarn io.sentry.**

# Sentry uses reflection for auto-instrumentation
-keepattributes LineNumberTable,SourceFile
-keepattributes *Annotation*

# Keep Sentry integrations
-keep class io.sentry.android.** { *; }
-keep class io.sentry.android.core.** { *; }

# Keep exception classes for proper stack traces
-keep class * extends java.lang.Exception
-keep class * extends java.lang.Throwable

# ===== R8 Optimizations =====
# Allow aggressive optimization while keeping necessary classes
-optimizationpasses 5
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-dontskipnonpubliclibraryclassmembers
-verbose

# ===== Remove Logging in Release =====
# Remove Log.v, Log.d, Log.i calls (keep Log.w and Log.e)
-assumenosideeffects class android.util.Log {
    public static *** v(...);
    public static *** d(...);
    public static *** i(...);
}

# ===== Preserve Enums =====
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# ===== Preserve Parcelables =====
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# ===== Preserve Serializable =====
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# ===== Preserve Native Methods =====
-keepclasseswithmembernames class * {
    native <methods>;
}

# ===== Preserve Constructors =====
-keepclasseswithmembers class * {
    public <init>(android.content.Context, android.util.AttributeSet);
}
-keepclasseswithmembers class * {
    public <init>(android.content.Context, android.util.AttributeSet, int);
}

# ===== Preserve View Getters and Setters =====
-keep public class * extends android.view.View {
    public <init>(android.content.Context);
    public <init>(android.content.Context, android.util.AttributeSet);
    public <init>(android.content.Context, android.util.AttributeSet, int);
    public void set*(...);
    *** get*();
}

# ===== Application Class =====
-keep public class * extends android.app.Application { *; }

# ===== Prevent Warnings =====
# These are safe warnings that we can suppress
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
-dontwarn javax.annotation.**
-dontwarn javax.inject.**
-dontwarn sun.misc.Unsafe
-dontwarn java.lang.invoke.StringConcatFactory

# ===== Custom Rules for FlixCapacitor =====
# Add any app-specific rules below

# Keep MainActivity (entry point)
-keep public class com.tribixbite.flixcapacitor.MainActivity { *; }

# Keep TestActivity (for testing)
-keep public class com.tribixbite.flixcapacitor.TestActivity { *; }

# ===== End of ProGuard Rules =====
