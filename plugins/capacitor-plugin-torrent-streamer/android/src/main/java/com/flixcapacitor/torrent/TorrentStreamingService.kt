package com.flixcapacitor.torrent

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Environment
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.widget.Toast
import androidx.core.app.NotificationCompat
import com.frostwire.jlibtorrent.TorrentInfo
import com.frostwire.jlibtorrent.TorrentStatus
import com.getcapacitor.JSObject
import java.io.File

/**
 * TorrentStreamingService - Android Foreground Service for torrent streaming
 * Keeps torrent alive when app is backgrounded and manages streaming lifecycle
 */
class TorrentStreamingService : Service() {

    companion object {
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "torrent_streaming_channel"
        private const val CHANNEL_NAME = "Torrent Streaming"

        // Timeouts
        private const val METADATA_TIMEOUT_MS = 90000L // 90 seconds
        private const val PEERS_TIMEOUT_MS = 90000L // 90 seconds
        private const val PROGRESS_UPDATE_INTERVAL_MS = 1000L // 1 second

        // Static reference for pause/resume/getStatus from plugin
        private var instance: TorrentStreamingService? = null

        fun pause() {
            instance?.torrentSession?.pause()
        }

        fun resume() {
            instance?.torrentSession?.resume()
        }

        fun getStatus(): JSObject {
            return instance?.torrentSession?.getStatus() ?: JSObject().apply {
                put("error", "Service not running")
            }
        }

        fun reloadProxySettings() {
            instance?.let { service ->
                val proxySettings = service.loadProxySettings()
                service.torrentSession?.updateProxySettings(proxySettings)
                android.util.Log.d("TorrentStreamingService", "✅ Proxy settings reloaded and applied")
            }
        }

        fun getVideoFileList(): List<JSObject>? {
            return instance?.torrentSession?.getVideoFileList()
        }

        fun selectFile(fileIndex: Int): Boolean {
            return instance?.torrentSession?.selectFile(fileIndex) ?: false
        }
    }

    // Components
    private var torrentSession: TorrentSession? = null
    private var streamingServer: StreamingServer? = null

    // Handlers and runnables for timeouts and progress
    private val mainHandler = Handler(Looper.getMainLooper())
    private var metadataTimeoutRunnable: Runnable? = null
    private var peersTimeoutRunnable: Runnable? = null
    private var progressUpdateRunnable: Runnable? = null
    private var checkFileRunnable: Runnable? = null

    // State tracking
    private var hasMetadata = false
    private var hasPeers = false
    private var isReady = false
    private var callId: String? = null

    // Notification
    private lateinit var notificationManager: NotificationManager

    override fun onCreate() {
        super.onCreate()
        android.util.Log.d("TorrentStreamingService", "onCreate() called")

        try {
            instance = this

            // Initialize LogHelper FIRST with application context
            LogHelper.init(applicationContext)
            LogHelper.i("Service", "🚀 TorrentStreamingService onCreate() - Initializing...")

            // Initialize notification manager
            notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            android.util.Log.d("TorrentStreamingService", "NotificationManager obtained")
            LogHelper.d("Service", "NotificationManager obtained")

            // Create notification channel (Android 8+) - MUST be done before any notifications
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_LOW
                ).apply {
                    description = "Shows torrent download progress"
                    setShowBadge(false)
                    enableVibration(false)
                    setSound(null, null)
                }
                notificationManager.createNotificationChannel(channel)
                android.util.Log.d("TorrentStreamingService", "Notification channel created: $CHANNEL_ID")
            }

            // Small delay to ensure channel is fully registered
            Thread.sleep(50)

            android.util.Log.d("TorrentStreamingService", "onCreate() completed successfully")
            LogHelper.i("Service", "✅ Service onCreate() completed successfully")
            LogHelper.i("Service", "📝 Log file location: ${LogHelper.getLogPath()}")
        } catch (e: Exception) {
            android.util.Log.e("TorrentStreamingService", "onCreate() failed", e)
            LogHelper.e("Service", "💥 FATAL onCreate() error", e)
            // Don't call showErrorToast here - notification manager might not be ready
            android.util.Log.e("TorrentStreamingService", "FATAL onCreate error: ${e.message}", e)
            throw e
        }
    }

    /**
     * Show error as Toast notification (visible to user without adb)
     * Also creates persistent notification with full error
     */
    private fun showErrorToast(message: String) {
        mainHandler.post {
            try {
                // Show toast for immediate feedback (always works)
                Toast.makeText(applicationContext, "🍿 $message", Toast.LENGTH_LONG).show()
                android.util.Log.d("TorrentStreamingService", "Toast: $message")

                // Also create persistent notification with full message
                if (::notificationManager.isInitialized) {
                    val notification = NotificationCompat.Builder(applicationContext, CHANNEL_ID)
                        .setContentTitle("Torrent Debug")
                        .setContentText(message)
                        .setStyle(NotificationCompat.BigTextStyle().bigText(message))
                        .setSmallIcon(android.R.drawable.stat_sys_download)
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setOngoing(false)
                        .build()

                    notificationManager.notify(message.hashCode(), notification)
                } else {
                    android.util.Log.w("TorrentStreamingService", "NotificationManager not initialized yet, skipping notification")
                }
            } catch (e: Exception) {
                // Ignore if notification fails, but log it
                android.util.Log.e("TorrentStreamingService", "Failed to show toast/notification: $message", e)
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        android.util.Log.d("TorrentStreamingService", "onStartCommand() called")
        android.util.Log.d("TorrentStreamingService", "Intent received: ${intent != null}")
        android.util.Log.d("TorrentStreamingService", "Intent extras: ${intent?.extras?.keySet()?.joinToString()}")
        showErrorToast("Service starting...")

        try {
            // Check if intent is null
            if (intent == null) {
                android.util.Log.e("TorrentStreamingService", "Intent is NULL!")
                showErrorToast("Intent is NULL - service restart?")
                stopSelf()
                return START_NOT_STICKY
            }

            // Get parameters from intent
            val magnetUri = intent.getStringExtra("magnetUri")
            val maxDownloadSpeed = intent.getIntExtra("maxDownloadSpeed", 0)
            val maxUploadSpeed = intent.getIntExtra("maxUploadSpeed", 100 * 1024)
            val maxConnections = intent.getIntExtra("maxConnections", 50)
            callId = intent.getStringExtra("callId")

            android.util.Log.d("TorrentStreamingService", "Parameters received:")
            android.util.Log.d("TorrentStreamingService", "  magnetUri=$magnetUri")
            android.util.Log.d("TorrentStreamingService", "  maxDownloadSpeed=$maxDownloadSpeed")
            android.util.Log.d("TorrentStreamingService", "  maxUploadSpeed=$maxUploadSpeed")
            android.util.Log.d("TorrentStreamingService", "  maxConnections=$maxConnections")
            android.util.Log.d("TorrentStreamingService", "  callId=$callId")

            if (magnetUri.isNullOrEmpty()) {
                android.util.Log.e("TorrentStreamingService", "magnetUri is null or empty")
                showErrorToast("No magnet URI provided (null or empty)")
                notifyError("magnetUri is required")
                stopSelf()
                return START_NOT_STICKY
            }

            // Start foreground service with initial notification
            android.util.Log.d("TorrentStreamingService", "Starting foreground...")
            showErrorToast("Starting foreground service...")
            startForeground(NOTIFICATION_ID, createNotification("Connecting to torrent...", 0))
            android.util.Log.d("TorrentStreamingService", "Foreground started successfully")
            showErrorToast("Foreground service started")

            // Initialize components
            startTorrentStreaming(magnetUri, maxDownloadSpeed, maxUploadSpeed, maxConnections)

            // Use START_NOT_STICKY to prevent auto-restart with null Intent on crash
            return START_NOT_STICKY
        } catch (e: Exception) {
            android.util.Log.e("TorrentStreamingService", "onStartCommand() failed", e)
            showErrorToast("CRASH: ${e.javaClass.simpleName}: ${e.message}")
            notifyError("Service failed to start: ${e.message}\n${e.stackTraceToString()}")
            stopSelf()
            return START_NOT_STICKY
        }
    }

    /**
     * Initialize torrent session and streaming server
     */
    private fun startTorrentStreaming(
        magnetUri: String,
        maxDownloadSpeed: Int,
        maxUploadSpeed: Int,
        maxConnections: Int
    ) {
        try {
            android.util.Log.d("TorrentStreamingService", "startTorrentStreaming() - Creating save directory")
            showErrorToast("Creating torrent directory...")

            // Create save directory in external storage (accessible via file manager)
            // On Android 10+, this uses scoped storage (no extra permissions needed)
            val saveDir = File(applicationContext.getExternalFilesDir(Environment.DIRECTORY_MOVIES), "FlixCapacitor")
            if (!saveDir.exists()) {
                val created = saveDir.mkdirs()
                android.util.Log.d("TorrentStreamingService", "Directory created: $created")
                showErrorToast("Created: ${saveDir.absolutePath}")
            }
            android.util.Log.d("TorrentStreamingService", "Save directory: ${saveDir.absolutePath}")

            // Load proxy settings from preferences
            val proxySettings = loadProxySettings()

            // Initialize torrent session with proxy settings
            android.util.Log.d("TorrentStreamingService", "Initializing TorrentSession...")
            showErrorToast("Initializing jlibtorrent...")
            torrentSession = TorrentSession(saveDir, proxySettings)
            torrentSession?.initialize()
            android.util.Log.d("TorrentStreamingService", "TorrentSession initialized successfully")
            showErrorToast("jlibtorrent initialized")

            // Set up callbacks
            torrentSession?.onMetadataReceived = { torrentInfo ->
                try {
                    handleMetadataReceived(torrentInfo)
                } catch (e: Exception) {
                    android.util.Log.e("TorrentStreamingService", "onMetadataReceived callback failed", e)
                    showErrorToast("Metadata callback failed: ${e.message}")
                }
            }

            torrentSession?.onProgress = { status ->
                try {
                    handleProgressUpdate(status)
                } catch (e: Exception) {
                    android.util.Log.e("TorrentStreamingService", "onProgress callback failed", e)
                    showErrorToast("Progress callback failed: ${e.message}")
                }
            }

            torrentSession?.onError = { error ->
                try {
                    handleError(error)
                } catch (e: Exception) {
                    android.util.Log.e("TorrentStreamingService", "onError callback failed", e)
                    showErrorToast("Error callback failed: ${e.message}")
                }
            }

            // Log file location
            LogHelper.i("Service", "📝 Log file: ${LogHelper.getLogPath()}")
            showErrorToast("Log: ${LogHelper.getLogPath()}")

            // Start streaming server
            LogHelper.i("Service", "🌐 Starting HTTP StreamingServer on port 8888...")
            android.util.Log.d("TorrentStreamingService", "Starting StreamingServer...")
            showErrorToast("Starting HTTP server...")

            // Stop any existing server first (cleanup from previous session)
            streamingServer?.let { existingServer ->
                LogHelper.w("Service", "⚠️ Stopping existing StreamingServer from previous session...")
                try {
                    existingServer.cleanup()
                    Thread.sleep(100) // Give it time to release the port
                } catch (e: Exception) {
                    LogHelper.e("Service", "Error stopping existing server", e)
                }
                streamingServer = null
            }

            try {
                streamingServer = StreamingServer()
                LogHelper.d("Service", "  - StreamingServer instance created")
                streamingServer?.start()
                LogHelper.i("Service", "✅ StreamingServer started successfully on port 8888")
                android.util.Log.d("TorrentStreamingService", "StreamingServer started on port 8888")
                showErrorToast("HTTP server started on port 8888")
            } catch (e: java.net.BindException) {
                // Port still in use - try to force kill and restart
                LogHelper.e("Service", "💥 Port 8888 already in use - attempting recovery...", e)
                android.util.Log.e("TorrentStreamingService", "Port 8888 in use, retrying...", e)
                showErrorToast("Port 8888 busy, retrying...")

                try {
                    // Wait a bit longer for OS to release port
                    Thread.sleep(500)
                    streamingServer = StreamingServer()
                    streamingServer?.start()
                    LogHelper.i("Service", "✅ StreamingServer started on retry")
                    showErrorToast("HTTP server started (retry)")
                } catch (retryException: Exception) {
                    LogHelper.e("Service", "💥 Failed to start server after retry", retryException)
                    showErrorToast("FATAL: Port 8888 locked. Restart app.")
                    throw RuntimeException("Port 8888 is locked from previous session. Please force-stop and restart the app.", retryException)
                }
            } catch (e: Exception) {
                LogHelper.e("Service", "💥 Failed to start StreamingServer", e)
                android.util.Log.e("TorrentStreamingService", "Failed to start StreamingServer", e)
                showErrorToast("HTTP server failed: ${e.message}")
                throw RuntimeException("Failed to start HTTP streaming server: ${e.message}", e)
            }

            // Start torrent download - CRITICAL CRASH POINT
            android.util.Log.d("TorrentStreamingService", "Adding magnet URI to torrent session...")
            showErrorToast("Adding magnet URI...")

            try {
                torrentSession?.addMagnet(magnetUri, maxDownloadSpeed, maxUploadSpeed, maxConnections)
                android.util.Log.d("TorrentStreamingService", "Magnet added successfully, waiting for metadata...")
                showErrorToast("Magnet added, waiting for alerts...")
            } catch (e: Exception) {
                android.util.Log.e("TorrentStreamingService", "addMagnet() CRASHED", e)
                showErrorToast("CRASH in addMagnet: ${e.javaClass.simpleName}: ${e.message}")
                throw e
            }

            // Start timeout timers
            android.util.Log.d("TorrentStreamingService", "Starting timeout timers...")
            showErrorToast("Starting timers...")
            startMetadataTimeout()
            startPeersTimeout()

            // DON'T start progress updates yet - wait for metadata
            // Progress updates will start in handleMetadataReceived()
            android.util.Log.d("TorrentStreamingService", "Waiting for first alert from jlibtorrent...")

            showErrorToast("All initialization complete - waiting for torrent data")

        } catch (e: Exception) {
            android.util.Log.e("TorrentStreamingService", "startTorrentStreaming() failed", e)
            showErrorToast("FATAL: ${e.javaClass.simpleName}: ${e.message}")
            notifyError("Failed to start streaming: ${e.message}\n${e.stackTraceToString()}")
            stopSelf()
        }
    }

    /**
     * Handle metadata received event
     */
    private fun handleMetadataReceived(torrentInfo: TorrentInfo) {
        if (hasMetadata) return
        hasMetadata = true

        LogHelper.i("Service", "📦 handleMetadataReceived() - Metadata callback invoked")
        android.util.Log.d("TorrentStreamingService", "handleMetadataReceived() - Metadata received!")
        showErrorToast("Metadata received!")

        // Cancel metadata timeout
        cancelMetadataTimeout()

        // Find largest video file
        LogHelper.i("Service", "🔍 Calling findLargestVideoFile()...")
        val videoFile = torrentSession?.findLargestVideoFile()

        if (videoFile == null) {
            LogHelper.e("Service", "❌ findLargestVideoFile() returned null - no video file found")
            android.util.Log.e("TorrentStreamingService", "No video file found in torrent")
            showErrorToast("No video file found!")
            notifyError("No video file found in torrent")
            stopSelf()
            return
        }

        val (fileIndex, fileName, fileSize) = videoFile
        LogHelper.i("Service", "✅ Video file selected by service:")
        LogHelper.i("Service", "  - File index: $fileIndex")
        LogHelper.i("Service", "  - File name: $fileName")
        LogHelper.i("Service", "  - File size: ${fileSize / 1024 / 1024} MB")
        android.util.Log.d("TorrentStreamingService", "Selected file: $fileName (${fileSize / 1024 / 1024} MB)")
        showErrorToast("Selected: $fileName")

        // Prioritize selected file for streaming
        torrentSession?.prioritizeSelectedFile()

        // NOW start progress updates (torrent is active)
        android.util.Log.d("TorrentStreamingService", "Starting progress updates...")
        showErrorToast("Starting progress updates...")
        startProgressUpdates()

        // Wait for file to be available then start streaming
        waitForFileAndStartStreaming(fileName)

        // Notify metadata event
        try {
            val metadataData = JSObject().apply {
                put("name", torrentInfo.name())
                put("totalSize", torrentInfo.totalSize())
                put("numFiles", torrentInfo.numFiles())
                put("selectedFile", fileName)
                put("selectedFileSize", fileSize)
            }

            TorrentStreamerPlugin.notifyEvent("metadata", metadataData)
            android.util.Log.d("TorrentStreamingService", "Metadata event sent to JavaScript")
        } catch (e: Exception) {
            android.util.Log.e("TorrentStreamingService", "Failed to send metadata event", e)
            showErrorToast("Failed to send metadata event: ${e.message}")
        }
    }

    /**
     * Wait for video file to be available and start streaming
     */
    private fun waitForFileAndStartStreaming(fileName: String) {
        // Check if file exists periodically
        checkFileRunnable = object : Runnable {
            override fun run() {
                val filePath = torrentSession?.getSelectedFilePath()

                if (filePath != null) {
                    val file = File(filePath)

                    // Wait for file to have some data (at least 5 MB or 2% of file)
                    val fileSize = torrentSession?.getSelectedFileSize() ?: 0
                    val minimumBytes = minOf(5 * 1024 * 1024L, (fileSize * 0.02).toLong())

                    if (file.exists() && file.length() >= minimumBytes) {
                        // File ready, start streaming
                        startStreaming(file, fileName)
                    } else {
                        // Check again in 500ms
                        mainHandler.postDelayed(this, 500)
                    }
                } else {
                    // Check again in 500ms
                    mainHandler.postDelayed(this, 500)
                }
            }
        }

        checkFileRunnable?.let { mainHandler.post(it) }
    }

    /**
     * Start HTTP streaming server
     */
    private fun startStreaming(file: File, fileName: String) {
        if (isReady) return
        isReady = true

        LogHelper.i("Service", "🎬 startStreaming() - File ready, setting up streaming")
        LogHelper.i("Service", "  - File path: ${file.absolutePath}")
        LogHelper.i("Service", "  - File exists: ${file.exists()}")
        LogHelper.i("Service", "  - File size: ${file.length() / 1024 / 1024} MB")

        // Set video file in streaming server
        streamingServer?.setVideoFile(file)
        LogHelper.d("Service", "  - Video file set in StreamingServer")

        // Get stream URL
        val streamUrl = streamingServer?.getStreamUrl() ?: ""
        LogHelper.i("Service", "🔗 Generated streamUrl: $streamUrl")

        // Get torrent info
        val torrentInfo = torrentSession?.getTorrentInfo()
        LogHelper.d("Service", "  - Torrent info retrieved")

        // Update notification
        notificationManager.notify(
            NOTIFICATION_ID,
            createNotification("Streaming: $fileName", 0)
        )

        // Notify ready event
        val readyData = JSObject().apply {
            put("streamUrl", streamUrl)
            put("torrentInfo", torrentInfo)
        }

        LogHelper.i("Service", "📢 Sending 'ready' event to JavaScript with streamUrl")
        TorrentStreamerPlugin.notifyEvent("ready", readyData)

        // Resolve pending start() call
        callId?.let { id ->
            val result = JSObject().apply {
                put("streamUrl", streamUrl)
            }
            LogHelper.i("Service", "✅ Resolving start() call with streamUrl: $streamUrl")
            TorrentStreamerPlugin.instance?.resolveStartCall(id, result)
        }
    }

    /**
     * Handle progress update
     */
    private fun handleProgressUpdate(status: TorrentStatus) {
        try {
            // Check for peers here instead of a separate callback
            if (status.numPeers() > 0 && !hasPeers) {
                hasPeers = true
                cancelPeersTimeout()
                android.util.Log.d("TorrentStreamingService", "First peer connected!")
                showErrorToast("First peer connected!")
            }

            // Update notification with progress
            val progress = (status.progress() * 100).toInt()
            val downloadSpeed = status.downloadRate() / 1024 / 1024 // MB/s
            val numPeers = status.numPeers()

            try {
                notificationManager.notify(
                    NOTIFICATION_ID,
                    createNotification(
                        "Downloading: ${status.progress() * 100}% | $downloadSpeed MB/s | $numPeers peers",
                        progress
                    )
                )
            } catch (e: Exception) {
                android.util.Log.e("TorrentStreamingService", "Failed to update notification", e)
            }

            // Send progress event to JavaScript
            try {
                val progressData = JSObject().apply {
                    val progressFloat = status.progress()
                    // Prevent JSONException from non-finite float values (NaN, Infinity)
                    put("progress", if (progressFloat.isFinite()) progressFloat else 0.0f)
                    put("downloadSpeed", status.downloadRate().toLong())
                    put("uploadSpeed", status.uploadRate().toLong())
                    put("numPeers", status.numPeers())
                    put("totalDownloaded", status.totalDownload())
                    put("totalUploaded", status.totalUpload())
                    put("state", status.state().name)
                }

                TorrentStreamerPlugin.notifyEvent("progress", progressData)
            } catch (e: Exception) {
                android.util.Log.e("TorrentStreamingService", "Failed to send progress event", e)
                // Don't crash on progress event failure
            }
        } catch (e: Exception) {
            android.util.Log.e("TorrentStreamingService", "handleProgressUpdate() failed", e)
            showErrorToast("Progress update error: ${e.javaClass.simpleName}")
        }
    }

    /**
     * Handle error
     */
    private fun handleError(error: String) {
        notifyError(error)
        stopSelf()
    }

    /**
     * Notify error to JavaScript and reject pending call
     */
    private fun notifyError(error: String) {
        val errorData = JSObject().apply {
            put("message", error)
        }

        TorrentStreamerPlugin.notifyEvent("error", errorData)

        // Reject pending start() call
        callId?.let { id ->
            TorrentStreamerPlugin.instance?.rejectStartCall(id, error)
        }
    }

    /**
     * Start metadata timeout (90 seconds)
     */
    private fun startMetadataTimeout() {
        metadataTimeoutRunnable = Runnable {
            if (!hasMetadata) {
                notifyError("Timeout: Failed to receive torrent metadata after 90 seconds")
                stopSelf()
            }
        }
        mainHandler.postDelayed(metadataTimeoutRunnable!!, METADATA_TIMEOUT_MS)
    }

    /**
     * Cancel metadata timeout
     */
    private fun cancelMetadataTimeout() {
        metadataTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
    }

    /**
     * Start peers timeout (90 seconds)
     */
    private fun startPeersTimeout() {
        peersTimeoutRunnable = Runnable {
            if (!hasPeers) {
                notifyError("Timeout: No peers found after 90 seconds")
                stopSelf()
            }
        }
        mainHandler.postDelayed(peersTimeoutRunnable!!, PEERS_TIMEOUT_MS)
    }

    /**
     * Cancel peers timeout
     */
    private fun cancelPeersTimeout() {
        peersTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
    }

    /**
     * Start periodic progress updates
     */
    private fun startProgressUpdates() {
        progressUpdateRunnable = object : Runnable {
            override fun run() {
                torrentSession?.let {
                    // This forces the session manager to post updates for all torrents,
                    // ensuring your StateUpdateAlert listener receives fresh data.
                    it.postTorrentUpdates()
                }
                mainHandler.postDelayed(this, PROGRESS_UPDATE_INTERVAL_MS)
            }
        }
        mainHandler.post(progressUpdateRunnable!!)
    }

    /**
     * Stop progress updates
     */
    private fun stopProgressUpdates() {
        progressUpdateRunnable?.let { mainHandler.removeCallbacks(it) }
    }

    /**
     * Create notification for foreground service
     */
    private fun createNotification(text: String, progress: Int): Notification {
        val notificationBuilder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("FlixCapacitor")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)

        // Add progress bar if progress > 0
        if (progress > 0) {
            notificationBuilder.setProgress(100, progress, false)
        }

        return notificationBuilder.build()
    }

    /**
     * Load proxy settings from SharedPreferences
     * Returns null if proxy is disabled
     */
    private fun loadProxySettings(): TorrentSession.ProxySettings? {
        try {
            val prefs = applicationContext.getSharedPreferences("CapacitorStorage", MODE_PRIVATE)

            // Check if proxy is enabled
            val proxyEnabled = prefs.getBoolean("proxy_enabled", false)
            if (!proxyEnabled) {
                android.util.Log.d("TorrentStreamingService", "Proxy disabled in settings")
                return null
            }

            // Load proxy configuration
            val proxyTypeStr = prefs.getString("proxy_type", "SOCKS5") ?: "SOCKS5"
            val proxyHost = prefs.getString("proxy_host", "") ?: ""
            val proxyPort = prefs.getInt("proxy_port", 1080)
            val proxyUsername = prefs.getString("proxy_username", "") ?: ""
            val proxyPassword = prefs.getString("proxy_password", "") ?: ""

            if (proxyHost.isEmpty()) {
                android.util.Log.w("TorrentStreamingService", "Proxy enabled but no host configured")
                return null
            }

            // Map proxy type string to enum
            val proxyType = when (proxyTypeStr.uppercase()) {
                "SOCKS4" -> TorrentSession.ProxyType.SOCKS4
                "SOCKS5" -> if (proxyUsername.isNotEmpty()) TorrentSession.ProxyType.SOCKS5_PW else TorrentSession.ProxyType.SOCKS5
                "HTTP" -> if (proxyUsername.isNotEmpty()) TorrentSession.ProxyType.HTTP_PW else TorrentSession.ProxyType.HTTP
                else -> TorrentSession.ProxyType.SOCKS5
            }

            android.util.Log.d("TorrentStreamingService", "Loaded proxy settings: $proxyType $proxyHost:$proxyPort")

            return TorrentSession.ProxySettings(
                type = proxyType,
                hostname = proxyHost,
                port = proxyPort,
                username = proxyUsername,
                password = proxyPassword
            )
        } catch (e: Exception) {
            android.util.Log.e("TorrentStreamingService", "Error loading proxy settings", e)
            return null
        }
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    /**
     * Service cleanup when destroyed
     * CRITICAL: Must clean up all resources to prevent memory leaks
     */
    override fun onDestroy() {
        android.util.Log.d("TorrentStreamingService", "onDestroy() - Cleaning up service...")

        try {
            // Cancel all timeouts and updates using helper methods
            cancelMetadataTimeout()
            cancelPeersTimeout()
            stopProgressUpdates()

            // Clear static instance reference
            instance = null

            // Cancel any remaining runnables to prevent memory leaks
            metadataTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
            peersTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
            progressUpdateRunnable?.let { mainHandler.removeCallbacks(it) }
            checkFileRunnable?.let { mainHandler.removeCallbacks(it) }

            metadataTimeoutRunnable = null
            peersTimeoutRunnable = null
            progressUpdateRunnable = null
            checkFileRunnable = null

            // Stop streaming server
            LogHelper.i("Service", "🛑 Stopping StreamingServer in onDestroy()...")
            try {
                streamingServer?.cleanup()
                streamingServer = null
                LogHelper.i("Service", "✅ StreamingServer stopped successfully")
            } catch (e: Exception) {
                LogHelper.e("Service", "Error stopping StreamingServer", e)
            }

            // Stop torrent session and cleanup jlibtorrent resources
            torrentSession?.cleanup()
            torrentSession = null

            // Send stopped event to JavaScript
            TorrentStreamerPlugin.notifyEvent("stopped", JSObject())

            // Remove foreground notification
            stopForeground(true)

            android.util.Log.d("TorrentStreamingService", "onDestroy() completed successfully")
        } catch (e: Exception) {
            android.util.Log.e("TorrentStreamingService", "Error during onDestroy()", e)
        }

        super.onDestroy()
    }
}
