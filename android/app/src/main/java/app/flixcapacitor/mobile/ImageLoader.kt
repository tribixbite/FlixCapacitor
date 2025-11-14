package app.flixcapacitor.mobile

import android.content.Context
import android.graphics.drawable.Drawable
import android.widget.ImageView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.DecodeFormat
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.load.resource.drawable.DrawableTransitionOptions
import com.bumptech.glide.request.RequestOptions
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.transition.Transition

/**
 * Memory-optimized image loading utility for FlixCapacitor (Phase 10D.1)
 *
 * Provides convenient methods for loading images with different quality/memory tradeoffs:
 * - Thumbnails: RGB_565, aggressive downsampling (lowest memory)
 * - Posters: ARGB_8888, moderate downsampling (balanced)
 * - Backdrops: RGB_565, full resolution (visual quality)
 *
 * All methods use:
 * - Crossfade animations for smooth UX
 * - Disk caching for offline access
 * - Error placeholders
 * - Automatic memory management via Glide
 *
 * LeakCanary will detect any memory leaks from improper usage.
 */
object ImageLoader {

    /**
     * Load a movie/show poster with balanced quality and memory usage
     *
     * @param context Android context
     * @param url Image URL (TMDB, OMDB, etc.)
     * @param imageView Target ImageView
     * @param placeholder Placeholder drawable while loading
     * @param error Error drawable if load fails
     */
    fun loadPoster(
        context: Context,
        url: String?,
        imageView: ImageView,
        placeholder: Drawable? = null,
        error: Drawable? = null
    ) {
        if (url.isNullOrBlank()) {
            imageView.setImageDrawable(error ?: placeholder)
            return
        }

        val options = RequestOptions()
            .format(DecodeFormat.PREFER_ARGB_8888) // Higher quality for posters
            .centerCrop()
            .diskCacheStrategy(DiskCacheStrategy.AUTOMATIC)
            .placeholder(placeholder)
            .error(error)
            .override(500, 750) // Typical poster size, downsample larger images

        Glide.with(context)
            .load(url)
            .apply(options)
            .transition(DrawableTransitionOptions.withCrossFade())
            .into(imageView)
    }

    /**
     * Load a backdrop/background image with full visual quality
     *
     * @param context Android context
     * @param url Image URL
     * @param imageView Target ImageView
     * @param placeholder Placeholder drawable while loading
     * @param error Error drawable if load fails
     */
    fun loadBackdrop(
        context: Context,
        url: String?,
        imageView: ImageView,
        placeholder: Drawable? = null,
        error: Drawable? = null
    ) {
        if (url.isNullOrBlank()) {
            imageView.setImageDrawable(error ?: placeholder)
            return
        }

        val options = RequestOptions()
            .format(DecodeFormat.PREFER_RGB_565) // Good quality, lower memory
            .centerCrop()
            .diskCacheStrategy(DiskCacheStrategy.AUTOMATIC)
            .placeholder(placeholder)
            .error(error)
            .override(1280, 720) // HD resolution, downsample 4K

        Glide.with(context)
            .load(url)
            .apply(options)
            .transition(DrawableTransitionOptions.withCrossFade())
            .into(imageView)
    }

    /**
     * Load a thumbnail image with aggressive memory optimization
     *
     * @param context Android context
     * @param url Image URL
     * @param imageView Target ImageView
     * @param placeholder Placeholder drawable while loading
     * @param error Error drawable if load fails
     */
    fun loadThumbnail(
        context: Context,
        url: String?,
        imageView: ImageView,
        placeholder: Drawable? = null,
        error: Drawable? = null
    ) {
        if (url.isNullOrBlank()) {
            imageView.setImageDrawable(error ?: placeholder)
            return
        }

        val options = RequestOptions()
            .format(DecodeFormat.PREFER_RGB_565) // Lowest memory usage
            .centerCrop()
            .diskCacheStrategy(DiskCacheStrategy.AUTOMATIC)
            .placeholder(placeholder)
            .error(error)
            .override(200, 300) // Small size for lists

        Glide.with(context)
            .load(url)
            .apply(options)
            .transition(DrawableTransitionOptions.withCrossFade())
            .into(imageView)
    }

    /**
     * Preload an image into memory/disk cache for faster display later
     *
     * @param context Android context
     * @param url Image URL to preload
     * @param width Target width for preloading
     * @param height Target height for preloading
     */
    fun preload(
        context: Context,
        url: String?,
        width: Int = 500,
        height: Int = 750
    ) {
        if (url.isNullOrBlank()) return

        Glide.with(context)
            .load(url)
            .diskCacheStrategy(DiskCacheStrategy.AUTOMATIC)
            .override(width, height)
            .preload()
    }

    /**
     * Load image and execute callback with bitmap/drawable
     * Useful for custom rendering or analysis
     *
     * @param context Android context
     * @param url Image URL
     * @param onResourceReady Callback when image is loaded
     */
    fun loadWithCallback(
        context: Context,
        url: String?,
        onResourceReady: (Drawable) -> Unit
    ) {
        if (url.isNullOrBlank()) return

        Glide.with(context)
            .load(url)
            .into(object : CustomTarget<Drawable>() {
                override fun onResourceReady(
                    resource: Drawable,
                    transition: Transition<in Drawable>?
                ) {
                    onResourceReady(resource)
                }

                override fun onLoadCleared(placeholder: Drawable?) {
                    // Cleanup if needed
                }
            })
    }

    /**
     * Clear memory cache (call on low memory events)
     *
     * @param context Android context
     */
    fun clearMemoryCache(context: Context) {
        Glide.get(context).clearMemory()
    }

    /**
     * Clear disk cache (call this in background thread)
     *
     * @param context Android context
     */
    fun clearDiskCache(context: Context) {
        Thread {
            Glide.get(context).clearDiskCache()
        }.start()
    }
}
