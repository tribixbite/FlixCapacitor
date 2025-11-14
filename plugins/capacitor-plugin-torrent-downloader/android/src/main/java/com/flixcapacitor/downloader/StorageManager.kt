package com.flixcapacitor.downloader

import android.content.Context
import android.os.Environment
import android.os.StatFs
import android.util.Log
import java.io.File
import java.security.MessageDigest

/**
 * Storage management for torrent downloads
 * Phase 10A.2: Download Storage Management
 *
 * Handles:
 * - Disk space checks and quota management
 * - Download location management
 * - File cleanup and integrity verification
 * - Storage permission validation
 */
class StorageManager(private val context: Context) {

    companion object {
        private const val TAG = "StorageManager"

        // Default storage locations
        private const val DEFAULT_DOWNLOAD_DIR = "FlixCapacitor/Downloads"
        private const val INCOMPLETE_DIR = ".incomplete"

        // Storage thresholds
        private const val MIN_FREE_SPACE_MB = 100L // 100MB minimum
        private const val WARNING_FREE_SPACE_MB = 500L // 500MB warning threshold
        private const val BYTES_PER_MB = 1024L * 1024L

        // File extensions
        private const val TORRENT_PART_EXTENSION = ".part"
        private const val TORRENT_RESUME_EXTENSION = ".resume"
    }

    /**
     * Storage information data class
     */
    data class StorageInfo(
        val totalBytes: Long,
        val freeBytes: Long,
        val usedBytes: Long,
        val percentUsed: Int,
        val percentFree: Int,
        val hasMinimumSpace: Boolean,
        val needsWarning: Boolean
    )

    /**
     * Storage location data class
     */
    data class StorageLocation(
        val path: String,
        val isExternal: Boolean,
        val isWritable: Boolean,
        val isRemovable: Boolean,
        val storageInfo: StorageInfo
    )

    /**
     * File cleanup result
     */
    data class CleanupResult(
        val filesDeleted: Int,
        val bytesFreed: Long,
        val errors: List<String>
    )

    /**
     * Get the default download directory
     * Creates directory if it doesn't exist
     */
    fun getDefaultDownloadDirectory(): File {
        val externalStorage = Environment.getExternalStorageDirectory()
        val downloadDir = File(externalStorage, DEFAULT_DOWNLOAD_DIR)

        if (!downloadDir.exists()) {
            downloadDir.mkdirs()
            Log.d(TAG, "Created default download directory: ${downloadDir.absolutePath}")
        }

        return downloadDir
    }

    /**
     * Get the incomplete downloads directory
     * Used for temporary files during download
     */
    fun getIncompleteDirectory(): File {
        val downloadDir = getDefaultDownloadDirectory()
        val incompleteDir = File(downloadDir, INCOMPLETE_DIR)

        if (!incompleteDir.exists()) {
            incompleteDir.mkdirs()
            // Hide directory by making it start with dot
            Log.d(TAG, "Created incomplete directory: ${incompleteDir.absolutePath}")
        }

        return incompleteDir
    }

    /**
     * Get storage information for a specific path
     */
    fun getStorageInfo(path: String): StorageInfo {
        val file = File(path)
        val stats = StatFs(file.absolutePath)

        val totalBytes = stats.totalBytes
        val freeBytes = stats.availableBytes
        val usedBytes = totalBytes - freeBytes

        val percentUsed = ((usedBytes.toDouble() / totalBytes.toDouble()) * 100).toInt()
        val percentFree = 100 - percentUsed

        val freeSpaceMB = freeBytes / BYTES_PER_MB
        val hasMinimumSpace = freeSpaceMB >= MIN_FREE_SPACE_MB
        val needsWarning = freeSpaceMB < WARNING_FREE_SPACE_MB

        return StorageInfo(
            totalBytes = totalBytes,
            freeBytes = freeBytes,
            usedBytes = usedBytes,
            percentUsed = percentUsed,
            percentFree = percentFree,
            hasMinimumSpace = hasMinimumSpace,
            needsWarning = needsWarning
        )
    }

    /**
     * Get current storage location information
     */
    fun getCurrentStorageLocation(): StorageLocation {
        val downloadDir = getDefaultDownloadDirectory()
        val storageInfo = getStorageInfo(downloadDir.absolutePath)

        val isExternal = Environment.isExternalStorageManager() ||
                        downloadDir.absolutePath.contains("/storage/emulated")
        val isRemovable = Environment.isExternalStorageRemovable()
        val isWritable = downloadDir.canWrite()

        return StorageLocation(
            path = downloadDir.absolutePath,
            isExternal = isExternal,
            isWritable = isWritable,
            isRemovable = isRemovable,
            storageInfo = storageInfo
        )
    }

    /**
     * Check if there is enough space for a download
     * @param requiredBytes Bytes needed for download
     * @return true if enough space available
     */
    fun hasEnoughSpace(requiredBytes: Long): Boolean {
        val downloadDir = getDefaultDownloadDirectory()
        val storageInfo = getStorageInfo(downloadDir.absolutePath)

        // Ensure we maintain minimum free space after download
        val spaceAfterDownload = storageInfo.freeBytes - requiredBytes
        val minFreeSpaceBytes = MIN_FREE_SPACE_MB * BYTES_PER_MB

        return spaceAfterDownload >= minFreeSpaceBytes
    }

    /**
     * Get recommended cleanup size to meet minimum requirements
     */
    fun getRecommendedCleanupSize(): Long {
        val downloadDir = getDefaultDownloadDirectory()
        val storageInfo = getStorageInfo(downloadDir.absolutePath)

        val minFreeSpaceBytes = MIN_FREE_SPACE_MB * BYTES_PER_MB
        val deficit = minFreeSpaceBytes - storageInfo.freeBytes

        return if (deficit > 0) deficit else 0L
    }

    /**
     * Clean up incomplete downloads
     * Removes .part and .resume files from incomplete directory
     */
    fun cleanupIncompleteDownloads(): CleanupResult {
        val incompleteDir = getIncompleteDirectory()
        var filesDeleted = 0
        var bytesFreed = 0L
        val errors = mutableListOf<String>()

        if (!incompleteDir.exists()) {
            return CleanupResult(0, 0, emptyList())
        }

        try {
            incompleteDir.listFiles()?.forEach { file ->
                try {
                    if (file.isFile && (file.name.endsWith(TORRENT_PART_EXTENSION) ||
                                       file.name.endsWith(TORRENT_RESUME_EXTENSION))) {
                        val fileSize = file.length()
                        if (file.delete()) {
                            filesDeleted++
                            bytesFreed += fileSize
                            Log.d(TAG, "Deleted incomplete file: ${file.name}")
                        } else {
                            errors.add("Failed to delete: ${file.name}")
                        }
                    }
                } catch (e: Exception) {
                    errors.add("Error deleting ${file.name}: ${e.message}")
                    Log.e(TAG, "Error deleting file", e)
                }
            }
        } catch (e: Exception) {
            errors.add("Error listing incomplete directory: ${e.message}")
            Log.e(TAG, "Error listing incomplete directory", e)
        }

        return CleanupResult(filesDeleted, bytesFreed, errors)
    }

    /**
     * Clean up old completed downloads based on age
     * @param maxAgeMillis Delete files older than this (default: 30 days)
     */
    fun cleanupOldDownloads(maxAgeMillis: Long = 30L * 24 * 60 * 60 * 1000): CleanupResult {
        val downloadDir = getDefaultDownloadDirectory()
        var filesDeleted = 0
        var bytesFreed = 0L
        val errors = mutableListOf<String>()

        val cutoffTime = System.currentTimeMillis() - maxAgeMillis

        try {
            downloadDir.listFiles()?.forEach { file ->
                try {
                    // Skip the incomplete directory itself
                    if (file.name == INCOMPLETE_DIR) {
                        return@forEach
                    }

                    if (file.isFile && file.lastModified() < cutoffTime) {
                        val fileSize = file.length()
                        if (file.delete()) {
                            filesDeleted++
                            bytesFreed += fileSize
                            Log.d(TAG, "Deleted old file: ${file.name}")
                        } else {
                            errors.add("Failed to delete: ${file.name}")
                        }
                    }
                } catch (e: Exception) {
                    errors.add("Error deleting ${file.name}: ${e.message}")
                    Log.e(TAG, "Error deleting file", e)
                }
            }
        } catch (e: Exception) {
            errors.add("Error listing download directory: ${e.message}")
            Log.e(TAG, "Error listing download directory", e)
        }

        return CleanupResult(filesDeleted, bytesFreed, errors)
    }

    /**
     * Delete a specific download file and its associated files
     */
    fun deleteDownloadFiles(downloadId: Int, savePath: String): CleanupResult {
        var filesDeleted = 0
        var bytesFreed = 0L
        val errors = mutableListOf<String>()

        try {
            val downloadFile = File(savePath)

            // Delete main file
            if (downloadFile.exists()) {
                val fileSize = downloadFile.length()
                if (downloadFile.delete()) {
                    filesDeleted++
                    bytesFreed += fileSize
                    Log.d(TAG, "Deleted download file: ${downloadFile.name}")
                } else {
                    errors.add("Failed to delete main file: ${downloadFile.name}")
                }
            }

            // Delete .part file if exists
            val partFile = File("${savePath}${TORRENT_PART_EXTENSION}")
            if (partFile.exists()) {
                val fileSize = partFile.length()
                if (partFile.delete()) {
                    filesDeleted++
                    bytesFreed += fileSize
                } else {
                    errors.add("Failed to delete .part file")
                }
            }

            // Delete .resume file if exists
            val resumeFile = File("${savePath}${TORRENT_RESUME_EXTENSION}")
            if (resumeFile.exists()) {
                val fileSize = resumeFile.length()
                if (resumeFile.delete()) {
                    filesDeleted++
                    bytesFreed += fileSize
                } else {
                    errors.add("Failed to delete .resume file")
                }
            }

        } catch (e: Exception) {
            errors.add("Error deleting download files: ${e.message}")
            Log.e(TAG, "Error deleting download files", e)
        }

        return CleanupResult(filesDeleted, bytesFreed, errors)
    }

    /**
     * Verify file integrity using SHA-256 hash
     * @param filePath Path to file to verify
     * @param expectedHash Expected SHA-256 hash (hex string)
     * @return true if hash matches
     */
    fun verifyFileIntegrity(filePath: String, expectedHash: String): Boolean {
        try {
            val file = File(filePath)
            if (!file.exists() || !file.isFile) {
                Log.e(TAG, "File does not exist: $filePath")
                return false
            }

            val digest = MessageDigest.getInstance("SHA-256")
            val buffer = ByteArray(8192)

            file.inputStream().use { inputStream ->
                var bytesRead: Int
                while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                    digest.update(buffer, 0, bytesRead)
                }
            }

            val hashBytes = digest.digest()
            val calculatedHash = hashBytes.joinToString("") { "%02x".format(it) }

            val matches = calculatedHash.equals(expectedHash, ignoreCase = true)

            if (matches) {
                Log.d(TAG, "File integrity verified: $filePath")
            } else {
                Log.w(TAG, "File integrity check failed: $filePath")
                Log.w(TAG, "Expected: $expectedHash")
                Log.w(TAG, "Calculated: $calculatedHash")
            }

            return matches

        } catch (e: Exception) {
            Log.e(TAG, "Error verifying file integrity", e)
            return false
        }
    }

    /**
     * Calculate SHA-256 hash of a file
     * @param filePath Path to file
     * @return SHA-256 hash as hex string, or null on error
     */
    fun calculateFileHash(filePath: String): String? {
        try {
            val file = File(filePath)
            if (!file.exists() || !file.isFile) {
                return null
            }

            val digest = MessageDigest.getInstance("SHA-256")
            val buffer = ByteArray(8192)

            file.inputStream().use { inputStream ->
                var bytesRead: Int
                while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                    digest.update(buffer, 0, bytesRead)
                }
            }

            val hashBytes = digest.digest()
            return hashBytes.joinToString("") { "%02x".format(it) }

        } catch (e: Exception) {
            Log.e(TAG, "Error calculating file hash", e)
            return null
        }
    }

    /**
     * Get total size of all downloads
     */
    fun getTotalDownloadSize(): Long {
        val downloadDir = getDefaultDownloadDirectory()
        return calculateDirectorySize(downloadDir)
    }

    /**
     * Calculate total size of a directory recursively
     */
    private fun calculateDirectorySize(directory: File): Long {
        var size = 0L

        try {
            directory.listFiles()?.forEach { file ->
                size += if (file.isDirectory) {
                    calculateDirectorySize(file)
                } else {
                    file.length()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error calculating directory size", e)
        }

        return size
    }

    /**
     * Format bytes to human-readable string
     */
    fun formatBytes(bytes: Long): String {
        return when {
            bytes < 1024 -> "$bytes B"
            bytes < 1024 * 1024 -> String.format("%.2f KB", bytes / 1024.0)
            bytes < 1024 * 1024 * 1024 -> String.format("%.2f MB", bytes / (1024.0 * 1024.0))
            else -> String.format("%.2f GB", bytes / (1024.0 * 1024.0 * 1024.0))
        }
    }

    /**
     * Check if external storage is available and writable
     */
    fun isExternalStorageWritable(): Boolean {
        val state = Environment.getExternalStorageState()
        return Environment.MEDIA_MOUNTED == state
    }

    /**
     * Check if external storage is available for at least reading
     */
    fun isExternalStorageReadable(): Boolean {
        val state = Environment.getExternalStorageState()
        return Environment.MEDIA_MOUNTED == state || Environment.MEDIA_MOUNTED_READ_ONLY == state
    }
}
