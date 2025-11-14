package com.flixcapacitor.chromecast

import android.content.Context
import com.google.android.gms.cast.framework.CastOptions
import com.google.android.gms.cast.framework.OptionsProvider
import com.google.android.gms.cast.framework.SessionProvider
import com.google.android.gms.cast.framework.media.CastMediaOptions
import com.google.android.gms.cast.framework.media.NotificationOptions

/**
 * Cast Options Provider for Google Cast SDK
 * Phase 10B.1: Google Cast SDK Integration
 *
 * This class configures the Cast Framework with default settings.
 * The actual receiver application ID can be overridden via ChromecastPlugin.initialize()
 */
class CastOptionsProvider : OptionsProvider {

    companion object {
        // Default media receiver application ID
        // This is Google's default receiver, supports basic media playback
        const val DEFAULT_RECEIVER_APP_ID = "CC1AD845"

        // Store custom receiver ID set by the plugin
        var customReceiverAppId: String? = null
    }

    override fun getCastOptions(context: Context): CastOptions {
        // Use custom receiver ID if set, otherwise use default
        val receiverAppId = customReceiverAppId ?: DEFAULT_RECEIVER_APP_ID

        // Configure notification options for media playback
        val notificationOptions = NotificationOptions.Builder()
            .setActions(
                listOf(
                    com.google.android.gms.cast.framework.media.MediaIntentReceiver.ACTION_SKIP_PREV,
                    com.google.android.gms.cast.framework.media.MediaIntentReceiver.ACTION_TOGGLE_PLAYBACK,
                    com.google.android.gms.cast.framework.media.MediaIntentReceiver.ACTION_SKIP_NEXT,
                    com.google.android.gms.cast.framework.media.MediaIntentReceiver.ACTION_STOP_CASTING
                ),
                intArrayOf(0, 1, 2, 3)
            )
            .setTargetActivityClassName(expandedControllerActivity)
            .build()

        // Configure cast media options
        val mediaOptions = CastMediaOptions.Builder()
            .setNotificationOptions(notificationOptions)
            .setExpandedControllerActivityClassName(expandedControllerActivity)
            .build()

        // Build and return cast options
        return CastOptions.Builder()
            .setReceiverApplicationId(receiverAppId)
            .setCastMediaOptions(mediaOptions)
            .setEnableReconnectionService(true)
            .setResumeSavedSession(true)
            .build()
    }

    override fun getAdditionalSessionProviders(context: Context): List<SessionProvider>? {
        return null
    }

    /**
     * Get the expanded controller activity class name
     * This would be the full-screen playback control activity
     * For now, we return null to use the default Cast SDK UI
     */
    private val expandedControllerActivity: String
        get() = "com.google.android.gms.cast.framework.media.widget.ExpandedControllerActivity"
}
