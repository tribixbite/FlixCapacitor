package app.flixcapacitor.mobile

import android.content.Context
import android.util.Log
import com.bumptech.glide.GlideBuilder
import com.bumptech.glide.annotation.GlideModule
import com.bumptech.glide.load.DecodeFormat
import com.bumptech.glide.load.engine.cache.InternalCacheDiskCacheFactory
import com.bumptech.glide.load.engine.cache.LruResourceCache
import com.bumptech.glide.module.AppGlideModule
import com.bumptech.glide.request.RequestOptions

/**
 * Custom Glide configuration for FlixCapacitor (Phase 10D.1: Memory Optimization)
 *
 * Configures memory-efficient image loading with:
 * - Optimized memory cache (10% of available memory, max 50MB)
 * - Disk cache for offline access (250MB)
 * - RGB_565 decode format for memory efficiency
 * - LRU eviction for both memory and disk caches
 *
 * LeakCanary will automatically detect any memory leaks from Glide usage.
 */
@GlideModule
class FlixGlideModule : AppGlideModule() {

    companion object {
        private const val TAG = "FlixGlideModule"

        // Memory cache: 10% of available memory, capped at 50MB
        private const val MEMORY_CACHE_PERCENT = 0.10
        private const val MAX_MEMORY_CACHE_SIZE = 50 * 1024 * 1024 // 50MB

        // Disk cache: 250MB for poster/backdrop images
        private const val DISK_CACHE_SIZE = 250 * 1024 * 1024L // 250MB
        private const val DISK_CACHE_DIR = "image_cache"
    }

    override fun applyOptions(context: Context, builder: GlideBuilder) {
        // Calculate optimal memory cache size
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
        val memoryClass = activityManager.memoryClass
        val availableMemoryBytes = memoryClass * 1024 * 1024

        val memoryCacheSize = (availableMemoryBytes * MEMORY_CACHE_PERCENT).toInt()
            .coerceAtMost(MAX_MEMORY_CACHE_SIZE)

        Log.d(TAG, "Configuring Glide with memory cache: ${memoryCacheSize / (1024 * 1024)}MB")

        // Set memory cache with LRU eviction
        builder.setMemoryCache(LruResourceCache(memoryCacheSize.toLong()))

        // Set disk cache for offline poster/backdrop access
        builder.setDiskCache(
            InternalCacheDiskCacheFactory(context, DISK_CACHE_DIR, DISK_CACHE_SIZE)
        )

        // Use RGB_565 for better memory efficiency (4 bytes -> 2 bytes per pixel)
        // This reduces memory usage by 50% for most images
        // High-quality images (posters) can override this per-request
        builder.setDefaultRequestOptions(
            RequestOptions()
                .format(DecodeFormat.PREFER_RGB_565)
                .disallowHardwareConfig() // Safer for older devices
        )

        // Set log level based on build type
        if (BuildConfig.DEBUG) {
            builder.setLogLevel(Log.DEBUG)
        } else {
            builder.setLogLevel(Log.ERROR)
        }

        Log.i(TAG, "Glide configured - Memory: ${memoryCacheSize / (1024 * 1024)}MB, " +
                "Disk: ${DISK_CACHE_SIZE / (1024 * 1024)}MB")
    }

    override fun isManifestParsingEnabled(): Boolean {
        // Disable manifest parsing for faster startup
        return false
    }
}
