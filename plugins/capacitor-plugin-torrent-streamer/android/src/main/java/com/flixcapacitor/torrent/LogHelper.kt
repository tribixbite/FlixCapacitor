package com.flixcapacitor.torrent

import android.content.Context
import android.os.Environment
import android.util.Log
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.*

/**
 * LogHelper - Centralized logging utility that writes to both logcat and app log file
 * Writes to app-specific external storage (no special permissions needed)
 * Log file: /sdcard/Android/data/app.flixcapacitor.mobile/files/Documents/FlixCapacitor/log.txt
 * This makes debugging possible without adb access
 */
object LogHelper {
    private const val TAG = "TorrentStreamer"
    private var logFile: File? = null
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.US)
    private var isInitialized = false

    /**
     * Initialize LogHelper with application context
     * Must be called before using any logging methods
     */
    fun init(context: Context) {
        if (isInitialized) return

        try {
            // Use app-specific external files directory (no special permissions needed)
            // Path: /sdcard/Android/data/app.flixcapacitor.mobile/files/Documents/FlixCapacitor/log.txt
            val docsDir = context.getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS)
            if (docsDir != null) {
                val logDir = File(docsDir, "FlixCapacitor")
                logDir.mkdirs()
                logFile = File(logDir, "log.txt")

                // Create log file if it doesn't exist
                if (!logFile!!.exists()) {
                    logFile!!.createNewFile()
                }

                // Write session start marker
                appendToFile("\n\n========== NEW SESSION ${dateFormat.format(Date())} ==========\n")
                Log.d(TAG, "Log file initialized: ${logFile!!.absolutePath}")
                isInitialized = true
            } else {
                Log.e(TAG, "Failed to get external files directory")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize log file", e)
        }
    }

    /**
     * Log debug message to both logcat and file
     */
    fun d(component: String, message: String) {
        Log.d(TAG, "[$component] $message")
        appendToFile("D [$component] $message")
    }

    /**
     * Log info message to both logcat and file
     */
    fun i(component: String, message: String) {
        Log.i(TAG, "[$component] $message")
        appendToFile("I [$component] $message")
    }

    /**
     * Log warning message to both logcat and file
     */
    fun w(component: String, message: String) {
        Log.w(TAG, "[$component] $message")
        appendToFile("W [$component] $message")
    }

    /**
     * Log error message to both logcat and file
     */
    fun e(component: String, message: String, throwable: Throwable? = null) {
        Log.e(TAG, "[$component] $message", throwable)
        val fullMessage = if (throwable != null) {
            "$message\n${throwable.javaClass.simpleName}: ${throwable.message}\n${throwable.stackTraceToString()}"
        } else {
            message
        }
        appendToFile("E [$component] $fullMessage")
    }

    /**
     * Append message to log file with timestamp
     */
    private fun appendToFile(message: String) {
        val file = logFile ?: return

        try {
            FileOutputStream(file, true).use { fos ->
                val timestamp = dateFormat.format(Date())
                fos.write("$timestamp | $message\n".toByteArray())
            }
        } catch (e: Exception) {
            // If file logging fails, just log to logcat
            Log.e(TAG, "Failed to write to log file: ${e.message}")
        }
    }

    /**
     * Get log file path for user reference
     */
    fun getLogPath(): String {
        return logFile?.absolutePath ?: "Log file not initialized"
    }
}
