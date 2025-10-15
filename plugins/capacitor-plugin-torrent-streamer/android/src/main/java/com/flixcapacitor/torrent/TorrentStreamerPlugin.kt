package com.flixcapacitor.torrent

import android.Manifest
import android.content.Intent
import android.os.Build
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.PermissionState
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

/**
 * TorrentStreamer Plugin
 * Main entry point for the Capacitor plugin
 * Manages communication between JavaScript and native Android code
 */
@CapacitorPlugin(
    name = "TorrentStreamer",
    permissions = [
        Permission(
            alias = "notifications",
            strings = [Manifest.permission.POST_NOTIFICATIONS]
        )
    ]
)
class TorrentStreamerPlugin : Plugin() {

    companion object {
        // Static reference to plugin instance for service communication
        var instance: TorrentStreamerPlugin? = null
            private set

        /**
         * Called by TorrentStreamingService to notify plugin of events
         */
        fun notifyEvent(eventName: String, data: JSObject) {
            instance?.notifyListeners(eventName, data)
        }
    }

    override fun load() {
        super.load()
        instance = this
    }

    /**
     * Start streaming a torrent
     * @param call PluginCall with magnetUri and optional settings
     */
    @PluginMethod
    fun start(call: PluginCall) {
        // On Android 13+ (TIRAMISU), check for notification permission first
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (getPermissionState("notifications") != PermissionState.GRANTED) {
                // Request permission, callback will execute startService
                requestPermissionForAlias("notifications", call, "notificationsPermissionCallback")
                return
            }
        }

        // Permission granted or not needed, start service
        startService(call)
    }

    @PermissionCallback
    fun notificationsPermissionCallback(call: PluginCall) {
        android.util.Log.d("TorrentStreamerPlugin", "Permission callback triggered")
        if (getPermissionState("notifications") == PermissionState.GRANTED) {
            android.util.Log.d("TorrentStreamerPlugin", "Notification permission granted, starting service")
            startService(call)
        } else {
            android.util.Log.e("TorrentStreamerPlugin", "Notification permission denied")
            call.reject("Notification permission is required to run the torrent service.")
        }
    }

    private fun startService(call: PluginCall) {
        val magnetUri = call.getString("magnetUri")

        if (magnetUri.isNullOrEmpty()) {
            call.reject("magnetUri is required")
            return
        }

        // Keep the call alive until the service is ready or fails
        call.setKeepAlive(true)

        // Get optional settings
        val maxDownloadSpeed = call.getInt("maxDownloadSpeed", 0)
        val maxUploadSpeed = call.getInt("maxUploadSpeed", 100 * 1024) // 100 KB/s default
        val maxConnections = call.getInt("maxConnections", 50)

        // Start foreground service
        val intent = Intent(context, TorrentStreamingService::class.java).apply {
            putExtra("magnetUri", magnetUri)
            putExtra("maxDownloadSpeed", maxDownloadSpeed)
            putExtra("maxUploadSpeed", maxUploadSpeed)
            putExtra("maxConnections", maxConnections)
            putExtra("callId", call.callbackId)
        }

        try {
            android.util.Log.d("TorrentStreamerPlugin", "Starting foreground service...")
            android.util.Log.d("TorrentStreamerPlugin", "Intent extras - magnetUri: $magnetUri")
            android.util.Log.d("TorrentStreamerPlugin", "Intent extras - callId: ${call.callbackId}")
            context.startForegroundService(intent)
            android.util.Log.d("TorrentStreamerPlugin", "Service start command sent successfully")
        } catch (e: Exception) {
            android.util.Log.e("TorrentStreamerPlugin", "Failed to start service", e)
            call.reject("Failed to start service: ${e.message}", e)

            // Notify error event
            val errorData = JSObject().apply {
                put("error", "Failed to start torrent service: ${e.message}")
            }
            notifyEvent("error", errorData)
        }
    }

    /**
     * Stop the torrent stream and clean up
     */
    @PluginMethod
    fun stop(call: PluginCall) {
        try {
            val intent = Intent(context, TorrentStreamingService::class.java)
            context.stopService(intent)
            call.resolve()
        } catch (e: Exception) {
            call.reject("Failed to stop service: ${e.message}", e)
        }
    }

    /**
     * Pause the torrent download
     */
    @PluginMethod
    fun pause(call: PluginCall) {
        try {
            TorrentStreamingService.pause()
            call.resolve()
        } catch (e: Exception) {
            call.reject("Failed to pause: ${e.message}", e)
        }
    }

    /**
     * Resume the torrent download
     */
    @PluginMethod
    fun resume(call: PluginCall) {
        try {
            TorrentStreamingService.resume()
            call.resolve()
        } catch (e: Exception) {
            call.reject("Failed to resume: ${e.message}", e)
        }
    }

    /**
     * Get current torrent status
     */
    @PluginMethod
    fun getStatus(call: PluginCall) {
        try {
            val status = TorrentStreamingService.getStatus()
            call.resolve(status)
        } catch (e: Exception) {
            call.reject("Failed to get status: ${e.message}", e)
        }
    }

    /**
     * Reload proxy settings from preferences and apply them
     * Will take effect immediately on active torrents
     */
    @PluginMethod
    fun reloadProxySettings(call: PluginCall) {
        try {
            TorrentStreamingService.reloadProxySettings()
            call.resolve(JSObject().apply {
                put("success", true)
                put("message", "Proxy settings reloaded")
            })
        } catch (e: Exception) {
            call.reject("Failed to reload proxy settings: ${e.message}", e)
        }
    }

    /**
     * Get list of all video files in the current torrent
     * Returns array of {index, name, size} for each video file
     */
    @PluginMethod
    fun getVideoFileList(call: PluginCall) {
        try {
            val videoFiles = TorrentStreamingService.getVideoFileList()
            if (videoFiles != null) {
                val result = JSObject()
                result.put("files", videoFiles)
                call.resolve(result)
            } else {
                call.reject("No active torrent or no video files found")
            }
        } catch (e: Exception) {
            call.reject("Failed to get video file list: ${e.message}", e)
        }
    }

    /**
     * Select a specific file index to stream
     * Must be called before streaming starts
     */
    @PluginMethod
    fun selectFile(call: PluginCall) {
        val fileIndex = call.getInt("fileIndex")
        if (fileIndex == null) {
            call.reject("fileIndex is required")
            return
        }

        try {
            val success = TorrentStreamingService.selectFile(fileIndex)
            if (success) {
                call.resolve(JSObject().apply {
                    put("success", true)
                    put("message", "File $fileIndex selected")
                })
            } else {
                call.reject("Failed to select file $fileIndex - invalid index or no active torrent")
            }
        } catch (e: Exception) {
            call.reject("Failed to select file: ${e.message}", e)
        }
    }

    /**
     * Open stream URL in external player (VLC, MX Player, etc.)
     * Uses Android Intent.ACTION_VIEW to let user choose player
     */
    @PluginMethod
    fun openExternalPlayer(call: PluginCall) {
        val streamUrl = call.getString("streamUrl")

        if (streamUrl.isNullOrEmpty()) {
            call.reject("streamUrl is required")
            return
        }

        try {
            android.util.Log.d("TorrentStreamerPlugin", "Opening external player for: $streamUrl")

            // Create Intent to open video with external player
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(android.net.Uri.parse(streamUrl), "video/*")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            // Check if there are apps that can handle this intent
            val packageManager = context.packageManager
            if (intent.resolveActivity(packageManager) != null) {
                // Show chooser dialog to let user pick player
                val chooser = Intent.createChooser(intent, "Play video with...")
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(chooser)

                android.util.Log.d("TorrentStreamerPlugin", "External player intent launched")
                call.resolve(JSObject().apply {
                    put("success", true)
                    put("message", "External player opened")
                })
            } else {
                android.util.Log.w("TorrentStreamerPlugin", "No video player apps found")
                call.reject("No video player app found. Please install VLC or MX Player.")
            }
        } catch (e: Exception) {
            android.util.Log.e("TorrentStreamerPlugin", "Failed to open external player", e)
            call.reject("Failed to open external player: ${e.message}", e)
        }
    }

    /**
     * Resolve pending start() call when service is ready
     */
    fun resolveStartCall(callId: String, result: JSObject) {
        val bridge = this.bridge
        val savedCall = bridge?.getSavedCall(callId)

        savedCall?.let {
            it.resolve(result)
            bridge.releaseCall(it)
        }
    }

    /**
     * Reject pending start() call on error
     */
    fun rejectStartCall(callId: String, errorMessage: String) {
        val bridge = this.bridge
        val savedCall = bridge?.getSavedCall(callId)

        savedCall?.let {
            it.reject(errorMessage)
            bridge.releaseCall(it)
        }
    }
}
