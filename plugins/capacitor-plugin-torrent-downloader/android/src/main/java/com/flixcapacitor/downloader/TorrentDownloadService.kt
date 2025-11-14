package com.flixcapacitor.downloader

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.flixcapacitor.downloader.R

/**
 * Foreground service for reliable background torrent downloads
 * Phase 10A.3: Background Download Service
 */
class TorrentDownloadService : Service() {

    companion object {
        private const val TAG = "TorrentDownloadService"
        private const val NOTIFICATION_ID = 1001
        private const val NOTIFICATION_CHANNEL_ID = "torrent_downloads"
        private const val NOTIFICATION_CHANNEL_NAME = "Torrent Downloads"

        private const val ACTION_START = "com.flixcapacitor.downloader.ACTION_START"
        private const val ACTION_STOP = "com.flixcapacitor.downloader.ACTION_STOP"
        private const val ACTION_UPDATE_PROGRESS = "com.flixcapacitor.downloader.ACTION_UPDATE_PROGRESS"

        private const val EXTRA_ACTIVE_DOWNLOADS = "activeDownloads"
        private const val EXTRA_DOWNLOAD_SPEED = "downloadSpeed"
        private const val EXTRA_UPLOAD_SPEED = "uploadSpeed"
        private const val EXTRA_PROGRESS = "progress"

        /**
         * Start the foreground service
         */
        fun start(context: Context) {
            val intent = Intent(context, TorrentDownloadService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        /**
         * Stop the foreground service
         */
        fun stop(context: Context) {
            val intent = Intent(context, TorrentDownloadService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }

        /**
         * Update the service notification with download progress
         */
        fun updateProgress(
            context: Context,
            activeDownloads: Int,
            downloadSpeed: Long,
            uploadSpeed: Long,
            progress: Int
        ) {
            val intent = Intent(context, TorrentDownloadService::class.java).apply {
                action = ACTION_UPDATE_PROGRESS
                putExtra(EXTRA_ACTIVE_DOWNLOADS, activeDownloads)
                putExtra(EXTRA_DOWNLOAD_SPEED, downloadSpeed)
                putExtra(EXTRA_UPLOAD_SPEED, uploadSpeed)
                putExtra(EXTRA_PROGRESS, progress)
            }
            context.startService(intent)
        }
    }

    private var activeDownloads = 0
    private var downloadSpeed = 0L
    private var uploadSpeed = 0L
    private var progress = 0

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "TorrentDownloadService created")
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                Log.d(TAG, "Starting foreground service")
                startForeground(NOTIFICATION_ID, buildNotification())
            }
            ACTION_STOP -> {
                Log.d(TAG, "Stopping foreground service")
                stopForeground(true)
                stopSelf()
            }
            ACTION_UPDATE_PROGRESS -> {
                activeDownloads = intent.getIntExtra(EXTRA_ACTIVE_DOWNLOADS, 0)
                downloadSpeed = intent.getLongExtra(EXTRA_DOWNLOAD_SPEED, 0L)
                uploadSpeed = intent.getLongExtra(EXTRA_UPLOAD_SPEED, 0L)
                progress = intent.getIntExtra(EXTRA_PROGRESS, 0)

                // Update notification with new progress
                val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                notificationManager.notify(NOTIFICATION_ID, buildNotification())
            }
        }

        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null // This is a started service, not a bound service
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "TorrentDownloadService destroyed")
    }

    /**
     * Create notification channel for Android O+
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
                setSound(null, null)
            }

            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    /**
     * Build notification for foreground service
     */
    private fun buildNotification(): Notification {
        // Format speeds for display
        val downSpeed = formatSpeed(downloadSpeed)
        val upSpeed = formatSpeed(uploadSpeed)

        // Build notification content
        val contentText = if (activeDownloads > 0) {
            "↓ $downSpeed ↑ $upSpeed • $activeDownloads active"
        } else {
            "No active downloads"
        }

        // Create pending intent to open app
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            packageManager.getLaunchIntentForPackage(packageName),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle("Torrent Downloads")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setProgress(100, progress, progress == 0)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)
            .build()
    }

    /**
     * Format byte speed to human-readable string
     */
    private fun formatSpeed(bytesPerSecond: Long): String {
        return when {
            bytesPerSecond < 1024 -> "$bytesPerSecond B/s"
            bytesPerSecond < 1024 * 1024 -> "${bytesPerSecond / 1024} KB/s"
            else -> String.format("%.1f MB/s", bytesPerSecond / (1024.0 * 1024.0))
        }
    }
}
