package com.flixcapacitor.chromecast

import android.net.Uri
import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.android.gms.cast.Cast
import com.google.android.gms.cast.CastDevice
import com.google.android.gms.cast.MediaInfo
import com.google.android.gms.cast.MediaLoadRequestData
import com.google.android.gms.cast.MediaMetadata
import com.google.android.gms.cast.MediaSeekOptions
import com.google.android.gms.cast.MediaStatus
import com.google.android.gms.cast.MediaTrack
import com.google.android.gms.cast.framework.CastContext
import com.google.android.gms.cast.framework.CastSession
import com.google.android.gms.cast.framework.SessionManagerListener
import com.google.android.gms.cast.framework.media.RemoteMediaClient
import com.google.android.gms.common.images.WebImage
import org.json.JSONArray
import org.json.JSONObject

/**
 * Capacitor plugin for Google Cast (Chromecast) integration
 * Phase 10B.1: Google Cast SDK Integration
 */
@CapacitorPlugin(name = "Chromecast")
class ChromecastPlugin : Plugin() {

    companion object {
        private const val TAG = "ChromecastPlugin"
    }

    private var castContext: CastContext? = null
    private var castSession: CastSession? = null
    private var remoteMediaClient: RemoteMediaClient? = null

    // Session manager listener
    private val sessionManagerListener = object : SessionManagerListener<CastSession> {
        override fun onSessionStarting(session: CastSession) {
            Log.d(TAG, "Session starting")
            notifySessionStateChanged("STARTING", session)
        }

        override fun onSessionStarted(session: CastSession, sessionId: String) {
            Log.d(TAG, "Session started: $sessionId")
            castSession = session
            remoteMediaClient = session.remoteMediaClient
            setupRemoteMediaClientListeners()
            notifySessionStateChanged("STARTED", session)
        }

        override fun onSessionStartFailed(session: CastSession, error: Int) {
            Log.e(TAG, "Session start failed: $error")
            notifySessionStateChanged("START_FAILED", session)
            notifyCastError("SESSION_START_FAILED", "Failed to start cast session: $error")
        }

        override fun onSessionEnding(session: CastSession) {
            Log.d(TAG, "Session ending")
            notifySessionStateChanged("ENDING", session)
        }

        override fun onSessionEnded(session: CastSession, error: Int) {
            Log.d(TAG, "Session ended")
            castSession = null
            remoteMediaClient = null
            notifySessionStateChanged("ENDED", null)
        }

        override fun onSessionResuming(session: CastSession, sessionId: String) {
            Log.d(TAG, "Session resuming: $sessionId")
            notifySessionStateChanged("RESUMING", session)
        }

        override fun onSessionResumed(session: CastSession, wasSuspended: Boolean) {
            Log.d(TAG, "Session resumed")
            castSession = session
            remoteMediaClient = session.remoteMediaClient
            setupRemoteMediaClientListeners()
            notifySessionStateChanged("RESUMED", session)
        }

        override fun onSessionResumeFailed(session: CastSession, error: Int) {
            Log.e(TAG, "Session resume failed: $error")
            notifySessionStateChanged("START_FAILED", session)
            notifyCastError("SESSION_RESUME_FAILED", "Failed to resume cast session: $error")
        }

        override fun onSessionSuspended(session: CastSession, reason: Int) {
            Log.d(TAG, "Session suspended: $reason")
            notifySessionStateChanged("SUSPENDED", session)
        }
    }

    // Remote media client listener
    private val remoteMediaClientListener = object : RemoteMediaClient.Listener {
        override fun onStatusUpdated() {
            Log.d(TAG, "Media status updated")
            notifyMediaStatusChanged()
        }

        override fun onMetadataUpdated() {
            Log.d(TAG, "Media metadata updated")
            notifyMediaStatusChanged()
        }

        override fun onQueueStatusUpdated() {
            Log.d(TAG, "Queue status updated")
        }

        override fun onPreloadStatusUpdated() {
            Log.d(TAG, "Preload status updated")
        }

        override fun onSendingRemoteMediaRequest() {
            Log.d(TAG, "Sending remote media request")
        }

        override fun onAdBreakStatusUpdated() {
            Log.d(TAG, "Ad break status updated")
        }
    }

    /**
     * Plugin initialization
     */
    override fun load() {
        super.load()
        Log.d(TAG, "ChromecastPlugin loaded")
    }

    /**
     * Initialize the Cast SDK
     * @param call Plugin call with receiverApplicationId
     */
    @PluginMethod
    fun initialize(call: PluginCall) {
        val receiverAppId = call.getString("receiverApplicationId")

        try {
            // Set custom receiver app ID if provided
            if (receiverAppId != null) {
                CastOptionsProvider.customReceiverAppId = receiverAppId
            }

            // Initialize Cast Context
            castContext = CastContext.getSharedInstance(context)

            // Add session manager listener
            castContext?.sessionManager?.addSessionManagerListener(
                sessionManagerListener,
                CastSession::class.java
            )

            // Get current session if available
            castSession = castContext?.sessionManager?.currentCastSession
            if (castSession != null) {
                remoteMediaClient = castSession?.remoteMediaClient
                setupRemoteMediaClientListeners()
            }

            Log.d(TAG, "Cast SDK initialized with receiver: ${receiverAppId ?: "default"}")
            call.resolve()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize Cast SDK", e)
            call.reject("Failed to initialize Cast SDK: ${e.message}")
        }
    }

    /**
     * Start device discovery
     */
    @PluginMethod
    fun startDiscovery(call: PluginCall) {
        try {
            // Cast SDK automatically handles device discovery
            // We just need to ensure the context is initialized
            if (castContext == null) {
                call.reject("Cast SDK not initialized. Call initialize() first.")
                return
            }

            Log.d(TAG, "Device discovery started")
            call.resolve()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start discovery", e)
            call.reject("Failed to start discovery: ${e.message}")
        }
    }

    /**
     * Stop device discovery
     */
    @PluginMethod
    fun stopDiscovery(call: PluginCall) {
        try {
            // Cast SDK automatically handles discovery lifecycle
            Log.d(TAG, "Device discovery stopped")
            call.resolve()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop discovery", e)
            call.reject("Failed to stop discovery: ${e.message}")
        }
    }

    /**
     * Connect to a Chromecast device
     * @param call Plugin call with deviceId
     */
    @PluginMethod
    fun connect(call: PluginCall) {
        val deviceId = call.getString("deviceId") ?: run {
            call.reject("deviceId is required")
            return
        }

        try {
            // Note: In the Cast SDK, device selection is typically handled through
            // the MediaRouteButton UI component. For programmatic connection,
            // we would need the actual CastDevice object which isn't easily
            // accessible by ID alone.

            // For now, we'll return success if we have an active session
            if (castSession?.isConnected == true) {
                call.resolve()
            } else {
                call.reject("No active cast session. Use the cast button to connect.")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to connect", e)
            call.reject("Failed to connect: ${e.message}")
        }
    }

    /**
     * Disconnect from current device
     */
    @PluginMethod
    fun disconnect(call: PluginCall) {
        try {
            castContext?.sessionManager?.endCurrentSession(true)
            Log.d(TAG, "Disconnected from cast device")
            call.resolve()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to disconnect", e)
            call.reject("Failed to disconnect: ${e.message}")
        }
    }

    /**
     * Load media on connected device
     * @param call Plugin call with media options
     */
    @PluginMethod
    fun loadMedia(call: PluginCall) {
        val url = call.getString("url") ?: run {
            call.reject("url is required")
            return
        }

        val contentType = call.getString("contentType") ?: "video/mp4"
        val title = call.getString("title")
        val subtitle = call.getString("subtitle")
        val posterUrl = call.getString("posterUrl")
        val currentTime = call.getDouble("currentTime", 0.0)?.toLong() ?: 0L
        val autoplay = call.getBoolean("autoplay", true) ?: true

        if (remoteMediaClient == null) {
            call.reject("No active cast session")
            return
        }

        try {
            // Build media metadata
            val metadata = MediaMetadata(MediaMetadata.MEDIA_TYPE_MOVIE).apply {
                title?.let { putString(MediaMetadata.KEY_TITLE, it) }
                subtitle?.let { putString(MediaMetadata.KEY_SUBTITLE, it) }
                posterUrl?.let { addImage(WebImage(Uri.parse(it))) }
            }

            // Build media info
            val mediaInfoBuilder = MediaInfo.Builder(url)
                .setStreamType(MediaInfo.STREAM_TYPE_BUFFERED)
                .setContentType(contentType)
                .setMetadata(metadata)

            // Add subtitle tracks if provided
            val subtitles = call.getArray("subtitles")
            if (subtitles != null && subtitles.length() > 0) {
                val tracks = mutableListOf<MediaTrack>()
                for (i in 0 until subtitles.length()) {
                    val sub = subtitles.getJSONObject(i)
                    val track = MediaTrack.Builder(
                        sub.getInt("id").toLong(),
                        MediaTrack.TYPE_TEXT
                    ).apply {
                        setName(sub.getString("name"))
                        setSubtype(MediaTrack.SUBTYPE_SUBTITLES)
                        setContentId(sub.getString("url"))
                        setLanguage(sub.getString("language"))
                    }.build()
                    tracks.add(track)
                }
                mediaInfoBuilder.setMediaTracks(tracks)
            }

            val mediaInfo = mediaInfoBuilder.build()

            // Build load request
            val request = MediaLoadRequestData.Builder()
                .setMediaInfo(mediaInfo)
                .setAutoplay(autoplay)
                .setCurrentTime(currentTime)
                .build()

            // Load media
            remoteMediaClient?.load(request)?.setResultCallback { result ->
                if (result.status.isSuccess) {
                    Log.d(TAG, "Media loaded successfully")
                    call.resolve()
                } else {
                    Log.e(TAG, "Failed to load media: ${result.status}")
                    call.reject("Failed to load media: ${result.status.statusMessage}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load media", e)
            call.reject("Failed to load media: ${e.message}")
        }
    }

    /**
     * Play current media
     */
    @PluginMethod
    fun play(call: PluginCall) {
        try {
            remoteMediaClient?.play()?.setResultCallback { result ->
                if (result.status.isSuccess) {
                    call.resolve()
                } else {
                    call.reject("Failed to play: ${result.status.statusMessage}")
                }
            } ?: call.reject("No active media session")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to play", e)
            call.reject("Failed to play: ${e.message}")
        }
    }

    /**
     * Pause current media
     */
    @PluginMethod
    fun pause(call: PluginCall) {
        try {
            remoteMediaClient?.pause()?.setResultCallback { result ->
                if (result.status.isSuccess) {
                    call.resolve()
                } else {
                    call.reject("Failed to pause: ${result.status.statusMessage}")
                }
            } ?: call.reject("No active media session")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to pause", e)
            call.reject("Failed to pause: ${e.message}")
        }
    }

    /**
     * Seek to position in media
     * @param call Plugin call with position in seconds
     */
    @PluginMethod
    fun seek(call: PluginCall) {
        val position = call.getDouble("position") ?: run {
            call.reject("position is required")
            return
        }

        try {
            val positionMs = (position * 1000).toLong()
            val seekOptions = MediaSeekOptions.Builder()
                .setPosition(positionMs)
                .build()

            remoteMediaClient?.seek(seekOptions)?.setResultCallback { result ->
                if (result.status.isSuccess) {
                    call.resolve()
                } else {
                    call.reject("Failed to seek: ${result.status.statusMessage}")
                }
            } ?: call.reject("No active media session")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to seek", e)
            call.reject("Failed to seek: ${e.message}")
        }
    }

    /**
     * Set volume level
     * @param call Plugin call with level (0-1)
     */
    @PluginMethod
    fun setVolume(call: PluginCall) {
        val level = call.getDouble("level") ?: run {
            call.reject("level is required")
            return
        }

        try {
            castSession?.setVolume(level)?.setResultCallback { result ->
                if (result.status.isSuccess) {
                    call.resolve()
                } else {
                    call.reject("Failed to set volume: ${result.status.statusMessage}")
                }
            } ?: call.reject("No active cast session")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to set volume", e)
            call.reject("Failed to set volume: ${e.message}")
        }
    }

    /**
     * Set mute state
     * @param call Plugin call with muted boolean
     */
    @PluginMethod
    fun setMuted(call: PluginCall) {
        val muted = call.getBoolean("muted") ?: run {
            call.reject("muted is required")
            return
        }

        try {
            castSession?.setMute(muted)?.setResultCallback { result ->
                if (result.status.isSuccess) {
                    call.resolve()
                } else {
                    call.reject("Failed to set mute: ${result.status.statusMessage}")
                }
            } ?: call.reject("No active cast session")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to set mute", e)
            call.reject("Failed to set mute: ${e.message}")
        }
    }

    /**
     * Stop current media
     */
    @PluginMethod
    fun stop(call: PluginCall) {
        try {
            remoteMediaClient?.stop()?.setResultCallback { result ->
                if (result.status.isSuccess) {
                    call.resolve()
                } else {
                    call.reject("Failed to stop: ${result.status.statusMessage}")
                }
            } ?: call.reject("No active media session")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop", e)
            call.reject("Failed to stop: ${e.message}")
        }
    }

    /**
     * Get current session state
     */
    @PluginMethod
    fun getSessionState(call: PluginCall) {
        try {
            val state = buildSessionState()
            call.resolve(state)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get session state", e)
            call.reject("Failed to get session state: ${e.message}")
        }
    }

    /**
     * Get available devices
     * Note: The Cast SDK doesn't expose device list directly
     */
    @PluginMethod
    fun getDevices(call: PluginCall) {
        try {
            val devices = JSObject()
            devices.put("devices", JSONArray())
            call.resolve(devices)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get devices", e)
            call.reject("Failed to get devices: ${e.message}")
        }
    }

    /**
     * Get current media status
     */
    @PluginMethod
    fun getMediaStatus(call: PluginCall) {
        try {
            val status = buildMediaStatus()
            call.resolve(status)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get media status", e)
            call.reject("Failed to get media status: ${e.message}")
        }
    }

    /**
     * Set subtitle track
     * @param call Plugin call with trackId
     */
    @PluginMethod
    fun setSubtitleTrack(call: PluginCall) {
        val trackId = call.getInt("trackId") ?: run {
            call.reject("trackId is required")
            return
        }

        try {
            val activeTrackIds = longArrayOf(trackId.toLong())
            remoteMediaClient?.setActiveMediaTracks(activeTrackIds)?.setResultCallback { result ->
                if (result.status.isSuccess) {
                    call.resolve()
                } else {
                    call.reject("Failed to set subtitle track: ${result.status.statusMessage}")
                }
            } ?: call.reject("No active media session")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to set subtitle track", e)
            call.reject("Failed to set subtitle track: ${e.message}")
        }
    }

    /**
     * Set audio track
     * @param call Plugin call with trackId
     */
    @PluginMethod
    fun setAudioTrack(call: PluginCall) {
        val trackId = call.getInt("trackId") ?: run {
            call.reject("trackId is required")
            return
        }

        try {
            val activeTrackIds = longArrayOf(trackId.toLong())
            remoteMediaClient?.setActiveMediaTracks(activeTrackIds)?.setResultCallback { result ->
                if (result.status.isSuccess) {
                    call.resolve()
                } else {
                    call.reject("Failed to set audio track: ${result.status.statusMessage}")
                }
            } ?: call.reject("No active media session")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to set audio track", e)
            call.reject("Failed to set audio track: ${e.message}")
        }
    }

    // ========================================================================
    // Helper Methods
    // ========================================================================

    /**
     * Setup remote media client listeners
     */
    private fun setupRemoteMediaClientListeners() {
        remoteMediaClient?.registerCallback(remoteMediaClientListener)
    }

    /**
     * Build session state object
     */
    private fun buildSessionState(): JSObject {
        val state = JSObject()

        if (castSession == null || castSession?.isConnected != true) {
            state.put("sessionId", JSONObject.NULL)
            state.put("device", JSONObject.NULL)
            state.put("state", "NO_SESSION")
            state.put("isConnected", false)
            state.put("applicationSessionId", JSONObject.NULL)
            state.put("applicationMetadata", JSONObject.NULL)
            return state
        }

        state.put("sessionId", castSession?.sessionId)
        state.put("device", buildDeviceInfo(castSession?.castDevice))
        state.put("state", "STARTED")
        state.put("isConnected", true)
        state.put("applicationSessionId", castSession?.applicationSessionId)

        val appMetadata = JSObject()
        appMetadata.put("applicationId", castSession?.applicationMetadata?.applicationId)
        appMetadata.put("applicationName", castSession?.applicationMetadata?.name)
        state.put("applicationMetadata", appMetadata)

        return state
    }

    /**
     * Build device info object
     */
    private fun buildDeviceInfo(device: CastDevice?): JSObject? {
        if (device == null) return null

        val deviceInfo = JSObject()
        deviceInfo.put("id", device.deviceId)
        deviceInfo.put("name", device.friendlyName)
        deviceInfo.put("model", device.modelName)
        deviceInfo.put("capabilities", JSONArray(device.capabilities))
        deviceInfo.put("status", if (castSession?.isConnected == true) "connected" else "available")
        deviceInfo.put("volume", castSession?.volume ?: 0.5)
        deviceInfo.put("muted", castSession?.isMute ?: false)

        return deviceInfo
    }

    /**
     * Build media status object
     */
    private fun buildMediaStatus(): JSObject {
        val status = JSObject()
        val mediaStatus = remoteMediaClient?.mediaStatus

        if (mediaStatus == null) {
            status.put("mediaSessionId", JSONObject.NULL)
            status.put("playerState", "IDLE")
            status.put("idleReason", "NONE")
            status.put("currentTime", 0)
            status.put("duration", 0)
            status.put("playbackRate", 1.0)
            status.put("volume", 0.5)
            status.put("muted", false)
            status.put("activeSubtitleTrackId", JSONObject.NULL)
            status.put("activeAudioTrackId", JSONObject.NULL)
            status.put("metadata", JSONObject.NULL)
            status.put("isLive", false)
            status.put("canSeek", false)
            status.put("canPause", false)
            return status
        }

        status.put("mediaSessionId", mediaStatus.mediaSessionId)
        status.put("playerState", getPlayerState(mediaStatus.playerState))
        status.put("idleReason", getIdleReason(mediaStatus.idleReason))
        status.put("currentTime", mediaStatus.streamPosition / 1000.0)
        status.put("duration", mediaStatus.mediaInfo?.streamDuration?.div(1000.0) ?: 0.0)
        status.put("playbackRate", mediaStatus.playbackRate)
        status.put("volume", mediaStatus.streamVolume)
        status.put("muted", mediaStatus.isMute)

        // Get active tracks
        val activeTracks = mediaStatus.activeTrackIds
        status.put("activeSubtitleTrackId", activeTracks?.firstOrNull()?.toInt())
        status.put("activeAudioTrackId", JSONObject.NULL)

        // Metadata
        val metadata = JSObject()
        mediaStatus.mediaInfo?.metadata?.let { meta ->
            metadata.put("title", meta.getString(MediaMetadata.KEY_TITLE))
            metadata.put("subtitle", meta.getString(MediaMetadata.KEY_SUBTITLE))
            meta.images.firstOrNull()?.url?.toString()?.let { url ->
                metadata.put("posterUrl", url)
            }
        }
        status.put("metadata", metadata)

        status.put("isLive", mediaStatus.mediaInfo?.streamType == MediaInfo.STREAM_TYPE_LIVE)
        status.put("canSeek", true)
        status.put("canPause", true)

        return status
    }

    /**
     * Get player state string
     */
    private fun getPlayerState(state: Int): String {
        return when (state) {
            MediaStatus.PLAYER_STATE_IDLE -> "IDLE"
            MediaStatus.PLAYER_STATE_BUFFERING -> "BUFFERING"
            MediaStatus.PLAYER_STATE_PLAYING -> "PLAYING"
            MediaStatus.PLAYER_STATE_PAUSED -> "PAUSED"
            MediaStatus.PLAYER_STATE_LOADING -> "LOADING"
            else -> "IDLE"
        }
    }

    /**
     * Get idle reason string
     */
    private fun getIdleReason(reason: Int): String {
        return when (reason) {
            MediaStatus.IDLE_REASON_NONE -> "NONE"
            MediaStatus.IDLE_REASON_FINISHED -> "FINISHED"
            MediaStatus.IDLE_REASON_CANCELLED -> "CANCELLED"
            MediaStatus.IDLE_REASON_INTERRUPTED -> "INTERRUPTED"
            MediaStatus.IDLE_REASON_ERROR -> "ERROR"
            else -> "NONE"
        }
    }

    /**
     * Notify session state changed
     */
    private fun notifySessionStateChanged(state: String, session: CastSession?) {
        val data = buildSessionState()
        data.put("state", state)
        notifyListeners("sessionStateChanged", data)
    }

    /**
     * Notify media status changed
     */
    private fun notifyMediaStatusChanged() {
        val status = buildMediaStatus()
        notifyListeners("mediaStatusChanged", status)
    }

    /**
     * Notify cast error
     */
    private fun notifyCastError(code: String, message: String) {
        val error = JSObject()
        error.put("code", code)
        error.put("message", message)
        error.put("timestamp", System.currentTimeMillis())
        notifyListeners("castError", error)
    }

    /**
     * Plugin cleanup
     */
    override fun handleOnDestroy() {
        super.handleOnDestroy()
        Log.d(TAG, "ChromecastPlugin destroyed")

        // Remove listeners
        castContext?.sessionManager?.removeSessionManagerListener(
            sessionManagerListener,
            CastSession::class.java
        )
        remoteMediaClient?.unregisterCallback(remoteMediaClientListener)
    }
}
