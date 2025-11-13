package app.flixcapacitor.mobile.workers

import android.content.Context
import androidx.work.*
import java.util.concurrent.TimeUnit

/**
 * WorkManager worker for background library scanning
 * Phase 9A.2: Enables non-blocking library scans
 */
class LibraryScanWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    companion object {
        const val TAG = "LibraryScanWorker"
        const val KEY_FOLDER_PATHS = "folder_paths"
        const val KEY_FORCE_FULL_SCAN = "force_full_scan"
        const val KEY_SCAN_ID = "scan_id"

        /**
         * Enqueue a background library scan
         */
        fun enqueue(
            context: Context,
            folderPaths: List<String>,
            forceFullScan: Boolean = false
        ): String {
            val inputData = Data.Builder()
                .putStringArray(KEY_FOLDER_PATHS, folderPaths.toTypedArray())
                .putBoolean(KEY_FORCE_FULL_SCAN, forceFullScan)
                .build()

            val constraints = Constraints.Builder()
                .setRequiresBatteryNotLow(true) // Only run when battery not low
                .build()

            val scanRequest = OneTimeWorkRequestBuilder<LibraryScanWorker>()
                .setInputData(inputData)
                .setConstraints(constraints)
                .addTag(TAG)
                .setBackoffCriteria(
                    BackoffPolicy.EXPONENTIAL,
                    WorkRequest.MIN_BACKOFF_MILLIS,
                    TimeUnit.MILLISECONDS
                )
                .build()

            WorkManager.getInstance(context).enqueue(scanRequest)

            return scanRequest.id.toString()
        }

        /**
         * Cancel all pending scans
         */
        fun cancelAll(context: Context) {
            WorkManager.getInstance(context).cancelAllWorkByTag(TAG)
        }

        /**
         * Cancel specific scan by ID
         */
        fun cancel(context: Context, workId: String) {
            WorkManager.getInstance(context).cancelWorkById(java.util.UUID.fromString(workId))
        }
    }

    override suspend fun doWork(): Result {
        val folderPaths = inputData.getStringArray(KEY_FOLDER_PATHS)?.toList() ?: emptyList()
        val forceFullScan = inputData.getBoolean(KEY_FORCE_FULL_SCAN, false)

        if (folderPaths.isEmpty()) {
            return Result.failure(
                Data.Builder().putString("error", "No folders specified").build()
            )
        }

        return try {
            // Set foreground info for notification
            setForeground(createForegroundInfo())

            // Perform scan
            val scanId = performScan(folderPaths, forceFullScan)

            // Return success with scan ID
            Result.success(
                Data.Builder().putInt(KEY_SCAN_ID, scanId).build()
            )
        } catch (e: Exception) {
            // Retry on failure
            if (runAttemptCount < 3) {
                Result.retry()
            } else {
                Result.failure(
                    Data.Builder().putString("error", e.message ?: "Unknown error").build()
                )
            }
        }
    }

    /**
     * Create foreground notification info
     */
    private fun createForegroundInfo(): ForegroundInfo {
        val notification = android.app.NotificationCompat.Builder(
            applicationContext,
            "library_scan_channel"
        )
            .setContentTitle("Scanning Media Library")
            .setContentText("Finding video files...")
            .setSmallIcon(android.R.drawable.ic_menu_search)
            .setOngoing(true)
            .build()

        return ForegroundInfo(1001, notification)
    }

    /**
     * Perform the actual scan (delegates to JavaScript via WebView)
     */
    private suspend fun performScan(
        folderPaths: List<String>,
        forceFullScan: Boolean
    ): Int {
        // TODO: This would ideally call into the JavaScript enhancedScanner
        // via a Capacitor plugin or WebView evaluation
        // For now, return a placeholder scan ID
        return System.currentTimeMillis().toInt()
    }

    /**
     * Update progress notification
     */
    private suspend fun updateProgress(
        phase: String,
        currentFile: String,
        filesProcessed: Int,
        filesTotal: Int
    ) {
        val progress = Data.Builder()
            .putString("phase", phase)
            .putString("currentFile", currentFile)
            .putInt("filesProcessed", filesProcessed)
            .putInt("filesTotal", filesTotal)
            .build()

        setProgress(progress)
    }
}
