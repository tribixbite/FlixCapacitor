package com.flixcapacitor.downloader

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.frostwire.jlibtorrent.*
import com.frostwire.jlibtorrent.alerts.*
import kotlinx.coroutines.*
import java.io.File
import java.util.concurrent.ConcurrentHashMap

/**
 * Capacitor plugin for torrent downloading using jlibtorrent
 * Phase 10A.1: jlibtorrent Capacitor Plugin
 */
@CapacitorPlugin(name = "TorrentDownload")
class TorrentDownloadPlugin : Plugin() {

    companion object {
        private const val TAG = "TorrentDownloadPlugin"
        private const val NOTIFICATION_CHANNEL_ID = "torrent_downloads"
        private const val NOTIFICATION_CHANNEL_NAME = "Torrent Downloads"
        private const val PROGRESS_UPDATE_INTERVAL = 1000L // 1 second
    }

    /**
     * Represents an active torrent download
     */
    private data class ActiveDownload(
        val downloadId: Int,
        val handle: TorrentHandle,
        val savePath: String,
        var isPaused: Boolean = false,
        var lastProgress: Int = 0
    )

    // jlibtorrent session manager
    private var sessionManager: SessionManager? = null

    // Active downloads map: downloadId -> ActiveDownload
    private val activeDownloads = ConcurrentHashMap<Int, ActiveDownload>()

    // Coroutine scope for background tasks
    private val pluginScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    // Progress update job
    private var progressUpdateJob: Job? = null

    /**
     * Plugin initialization
     */
    override fun load() {
        super.load()
        Log.d(TAG, "TorrentDownloadPlugin loaded")

        // Initialize notification channel
        createNotificationChannel()

        // Initialize jlibtorrent session
        initializeSession()

        // Start progress update loop
        startProgressUpdates()
    }

    /**
     * Plugin cleanup
     */
    override fun handleOnDestroy() {
        super.handleOnDestroy()
        Log.d(TAG, "TorrentDownloadPlugin destroyed")

        // Cancel all coroutines
        progressUpdateJob?.cancel()
        pluginScope.cancel()

        // Stop all downloads and cleanup session
        activeDownloads.values.forEach { download ->
            try {
                sessionManager?.remove(download.handle)
            } catch (e: Exception) {
                Log.e(TAG, "Error removing torrent handle on destroy", e)
            }
        }
        activeDownloads.clear()

        sessionManager?.stop()
        sessionManager = null
    }

    /**
     * Initialize jlibtorrent session with optimal settings
     */
    private fun initializeSession() {
        try {
            sessionManager = SessionManager()

            val settings = sessionManager!!.settings()

            // Optimize for mobile devices
            settings.connectionsLimit(200)
            settings.downloadRateLimit(0) // Unlimited by default
            settings.uploadRateLimit(0) // Unlimited by default
            settings.activeDhtLimit(88)
            settings.activeDownloads(4)
            settings.activeSeeds(4)
            settings.activeLimit(15)

            // Enable DHT for magnet links
            sessionManager!!.start()
            sessionManager!!.startDht()

            Log.d(TAG, "jlibtorrent session initialized successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize jlibtorrent session", e)
        }
    }

    /**
     * Create notification channel for download progress
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                NOTIFICATION_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows progress of torrent downloads"
                setShowBadge(false)
            }

            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    /**
     * Start background coroutine for progress updates
     */
    private fun startProgressUpdates() {
        progressUpdateJob = pluginScope.launch {
            while (isActive) {
                try {
                    updateAllProgress()
                } catch (e: Exception) {
                    Log.e(TAG, "Error updating progress", e)
                }
                delay(PROGRESS_UPDATE_INTERVAL)
            }
        }
    }

    /**
     * Update progress for all active downloads
     */
    private fun updateAllProgress() {
        var totalDownloadSpeed = 0L
        var totalUploadSpeed = 0L
        var totalProgress = 0
        var activeCount = 0

        activeDownloads.values.forEach { download ->
            try {
                if (!download.handle.isValid) {
                    return@forEach
                }

                val status = download.handle.status()
                val progress = (status.progress() * 100).toInt()

                // Aggregate stats for foreground service notification
                if (!download.isPaused) {
                    totalDownloadSpeed += status.downloadRate()
                    totalUploadSpeed += status.uploadRate()
                    totalProgress += progress
                    activeCount++
                }

                // Only notify if progress changed significantly (>1%)
                if (kotlin.math.abs(progress - download.lastProgress) >= 1) {
                    download.lastProgress = progress
                    notifyProgress(download, status)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error updating progress for download ${download.downloadId}", e)
            }
        }

        // Update foreground service notification
        if (activeCount > 0) {
            val avgProgress = totalProgress / activeCount
            TorrentDownloadService.updateProgress(
                context,
                activeCount,
                totalDownloadSpeed,
                totalUploadSpeed,
                avgProgress
            )
        }
    }

    /**
     * Notify JavaScript layer of download progress
     */
    private fun notifyProgress(download: ActiveDownload, status: TorrentStatus) {
        val progressData = JSObject().apply {
            put("downloadId", download.downloadId)
            put("totalBytes", status.totalWanted())
            put("downloadedBytes", status.totalDone())
            put("uploadedBytes", status.totalUpload())
            put("downloadSpeed", status.downloadRate())
            put("uploadSpeed", status.uploadRate())
            put("progress", (status.progress() * 100).toInt())
            put("seeds", status.numSeeds())
            put("peers", status.numPeers())
            put("ratio", if (status.totalDone() > 0) {
                status.totalUpload().toDouble() / status.totalDone().toDouble()
            } else 0.0)
            put("eta", calculateEta(status))
            put("state", mapState(status.state()))
        }

        notifyListeners("downloadProgress", progressData)
    }

    /**
     * Calculate estimated time to completion (seconds)
     */
    private fun calculateEta(status: TorrentStatus): Int {
        val remaining = status.totalWanted() - status.totalDone()
        val downloadRate = status.downloadRate()

        return if (downloadRate > 0) {
            (remaining / downloadRate).toInt()
        } else {
            -1 // Unknown
        }
    }

    /**
     * Map jlibtorrent state to plugin state enum
     */
    private fun mapState(state: TorrentStatus.State): String {
        return when (state) {
            TorrentStatus.State.CHECKING_FILES -> "checking"
            TorrentStatus.State.DOWNLOADING_METADATA -> "metadata"
            TorrentStatus.State.DOWNLOADING -> "downloading"
            TorrentStatus.State.FINISHED -> "finished"
            TorrentStatus.State.SEEDING -> "seeding"
            TorrentStatus.State.ALLOCATING -> "allocating"
            TorrentStatus.State.CHECKING_RESUME_DATA -> "checking"
            else -> "unknown"
        }
    }

    /**
     * Start a new torrent download
     * @param call Plugin call with downloadId, magnetUri, savePath, maxDownloadSpeed, maxUploadSpeed
     */
    @PluginMethod
    fun startDownload(call: PluginCall) {
        val downloadId = call.getInt("downloadId") ?: run {
            call.reject("downloadId is required")
            return
        }

        val magnetUri = call.getString("magnetUri") ?: run {
            call.reject("magnetUri is required")
            return
        }

        val savePath = call.getString("savePath") ?: run {
            call.reject("savePath is required")
            return
        }

        val maxDownloadSpeed = call.getInt("maxDownloadSpeed", 0) ?: 0
        val maxUploadSpeed = call.getInt("maxUploadSpeed", 0) ?: 0

        pluginScope.launch {
            try {
                // Validate save path
                val saveDir = File(savePath)
                if (!saveDir.exists()) {
                    saveDir.mkdirs()
                }

                // Parse magnet URI
                val params = SessionManager.parseMagnetUri(magnetUri)

                // Configure download
                params.savePath(saveDir)

                // Add torrent to session
                val handle = sessionManager?.download(params) ?: run {
                    call.reject("Session not initialized")
                    return@launch
                }

                // Apply speed limits if specified
                if (maxDownloadSpeed > 0) {
                    handle.setDownloadLimit(maxDownloadSpeed)
                }
                if (maxUploadSpeed > 0) {
                    handle.setUploadLimit(maxUploadSpeed)
                }

                // Store active download
                val activeDownload = ActiveDownload(
                    downloadId = downloadId,
                    handle = handle,
                    savePath = savePath
                )
                activeDownloads[downloadId] = activeDownload

                // Start foreground service if this is the first download
                if (activeDownloads.size == 1) {
                    TorrentDownloadService.start(context)
                }

                Log.d(TAG, "Started download $downloadId: $magnetUri")

                val result = JSObject().apply {
                    put("downloadId", downloadId)
                }
                call.resolve(result)

            } catch (e: Exception) {
                Log.e(TAG, "Failed to start download $downloadId", e)
                call.reject("Failed to start download: ${e.message}")
            }
        }
    }

    /**
     * Pause an active download
     * @param call Plugin call with downloadId
     */
    @PluginMethod
    fun pauseDownload(call: PluginCall) {
        val downloadId = call.getInt("downloadId") ?: run {
            call.reject("downloadId is required")
            return
        }

        val download = activeDownloads[downloadId] ?: run {
            call.reject("Download not found: $downloadId")
            return
        }

        try {
            download.handle.pause()
            download.isPaused = true

            Log.d(TAG, "Paused download $downloadId")
            call.resolve()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to pause download $downloadId", e)
            call.reject("Failed to pause download: ${e.message}")
        }
    }

    /**
     * Resume a paused download
     * @param call Plugin call with downloadId
     */
    @PluginMethod
    fun resumeDownload(call: PluginCall) {
        val downloadId = call.getInt("downloadId") ?: run {
            call.reject("downloadId is required")
            return
        }

        val download = activeDownloads[downloadId] ?: run {
            call.reject("Download not found: $downloadId")
            return
        }

        try {
            download.handle.resume()
            download.isPaused = false

            Log.d(TAG, "Resumed download $downloadId")
            call.resolve()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to resume download $downloadId", e)
            call.reject("Failed to resume download: ${e.message}")
        }
    }

    /**
     * Cancel and remove a download (keeps files)
     * @param call Plugin call with downloadId
     */
    @PluginMethod
    fun cancelDownload(call: PluginCall) {
        val downloadId = call.getInt("downloadId") ?: run {
            call.reject("downloadId is required")
            return
        }

        val download = activeDownloads[downloadId] ?: run {
            call.reject("Download not found: $downloadId")
            return
        }

        try {
            // Remove from session (keeps files)
            sessionManager?.remove(download.handle, SessionHandle.DELETE_FILES)
            activeDownloads.remove(downloadId)

            // Stop foreground service if no more downloads
            if (activeDownloads.isEmpty()) {
                TorrentDownloadService.stop(context)
            }

            Log.d(TAG, "Cancelled download $downloadId")
            call.resolve()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to cancel download $downloadId", e)
            call.reject("Failed to cancel download: ${e.message}")
        }
    }

    /**
     * Delete a download including all files
     * @param call Plugin call with downloadId
     */
    @PluginMethod
    fun deleteDownload(call: PluginCall) {
        val downloadId = call.getInt("downloadId") ?: run {
            call.reject("downloadId is required")
            return
        }

        val download = activeDownloads[downloadId] ?: run {
            call.reject("Download not found: $downloadId")
            return
        }

        try {
            // Remove from session and delete files
            sessionManager?.remove(download.handle, SessionHandle.DELETE_FILES)
            activeDownloads.remove(downloadId)

            // Stop foreground service if no more downloads
            if (activeDownloads.isEmpty()) {
                TorrentDownloadService.stop(context)
            }

            // Delete save directory
            val saveDir = File(download.savePath)
            if (saveDir.exists()) {
                saveDir.deleteRecursively()
            }

            Log.d(TAG, "Deleted download $downloadId")
            call.resolve()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to delete download $downloadId", e)
            call.reject("Failed to delete download: ${e.message}")
        }
    }

    /**
     * Get current progress for a download
     * @param call Plugin call with downloadId
     */
    @PluginMethod
    fun getDownloadProgress(call: PluginCall) {
        val downloadId = call.getInt("downloadId") ?: run {
            call.reject("downloadId is required")
            return
        }

        val download = activeDownloads[downloadId] ?: run {
            call.reject("Download not found: $downloadId")
            return
        }

        try {
            if (!download.handle.isValid) {
                call.reject("Download handle is invalid")
                return
            }

            val status = download.handle.status()
            val progressData = JSObject().apply {
                put("downloadId", download.downloadId)
                put("totalBytes", status.totalWanted())
                put("downloadedBytes", status.totalDone())
                put("uploadedBytes", status.totalUpload())
                put("downloadSpeed", status.downloadRate())
                put("uploadSpeed", status.uploadRate())
                put("progress", (status.progress() * 100).toInt())
                put("seeds", status.numSeeds())
                put("peers", status.numPeers())
                put("ratio", if (status.totalDone() > 0) {
                    status.totalUpload().toDouble() / status.totalDone().toDouble()
                } else 0.0)
                put("eta", calculateEta(status))
                put("state", mapState(status.state()))
            }

            call.resolve(progressData)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get progress for download $downloadId", e)
            call.reject("Failed to get progress: ${e.message}")
        }
    }

    /**
     * Stop seeding a completed download
     * @param call Plugin call with downloadId
     */
    @PluginMethod
    fun stopSeeding(call: PluginCall) {
        val downloadId = call.getInt("downloadId") ?: run {
            call.reject("downloadId is required")
            return
        }

        val download = activeDownloads[downloadId] ?: run {
            call.reject("Download not found: $downloadId")
            return
        }

        try {
            // Pause the torrent to stop seeding
            download.handle.pause()
            download.isPaused = true

            Log.d(TAG, "Stopped seeding for download $downloadId")
            call.resolve()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop seeding for download $downloadId", e)
            call.reject("Failed to stop seeding: ${e.message}")
        }
    }
}
