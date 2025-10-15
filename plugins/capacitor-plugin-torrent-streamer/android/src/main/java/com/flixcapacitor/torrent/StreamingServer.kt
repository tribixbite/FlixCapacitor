package com.flixcapacitor.torrent

import fi.iki.elonen.NanoHTTPD
import java.io.File
import java.io.FileInputStream
import java.io.IOException

/**
 * StreamingServer - HTTP server for streaming torrent video files
 * Implements HTTP Range requests for video seeking support
 */
class StreamingServer(private val port: Int = 8888) : NanoHTTPD(port) {

    private var videoFile: File? = null
    private var videoSize: Long = 0

    companion object {
        private const val BUFFER_SIZE = 8192 // 8 KB chunks
    }

    /**
     * Set video file to stream
     */
    fun setVideoFile(file: File) {
        videoFile = file
        videoSize = if (file.exists()) file.length() else 0
    }

    /**
     * Get streaming URL for video player
     */
    fun getStreamUrl(): String {
        return "http://127.0.0.1:$port/video"
    }

    /**
     * Handle HTTP requests
     */
    override fun serve(session: IHTTPSession): Response {
        // Handle OPTIONS preflight request for CORS
        if (session.method == Method.OPTIONS) {
            val response = newFixedLengthResponse(Response.Status.OK, "text/plain", null, 0)
            response.addHeader("Access-Control-Allow-Origin", "*")
            response.addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            response.addHeader("Access-Control-Allow-Headers", "Range, Accept-Encoding")
            return response
        }

        val uri = session.uri

        // Only serve /video endpoint
        if (uri != "/video") {
            return newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "Not found")
        }

        // Check if video file is set
        val file = videoFile
        if (file == null || !file.exists()) {
            return newFixedLengthResponse(
                Response.Status.NOT_FOUND,
                "text/plain",
                "Video file not available"
            )
        }

        try {
            // Handle Range requests for seeking
            val rangeHeader = session.headers["range"]

            return if (rangeHeader != null) {
                serveRangeRequest(file, rangeHeader)
            } else {
                serveFullFile(file)
            }

        } catch (e: IOException) {
            return newFixedLengthResponse(
                Response.Status.INTERNAL_ERROR,
                "text/plain",
                "Error serving file: ${e.message}"
            )
        }
    }

    /**
     * Serve full file (no range request)
     */
    private fun serveFullFile(file: File): Response {
        val fileSize = file.length()
        val fis = FileInputStream(file)

        val response = newFixedLengthResponse(
            Response.Status.OK,
            getMimeType(file),
            fis,
            fileSize
        )

        // Add headers for video streaming
        response.addHeader("Accept-Ranges", "bytes")
        response.addHeader("Content-Length", fileSize.toString())
        response.addHeader("Connection", "close")

        // Add CORS headers to allow WebView access from capacitor:// origin
        response.addHeader("Access-Control-Allow-Origin", "*")
        response.addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        response.addHeader("Access-Control-Allow-Headers", "Range, Accept-Encoding")

        return response
    }

    /**
     * Serve range request for video seeking
     * Format: Range: bytes=start-end
     */
    private fun serveRangeRequest(file: File, rangeHeader: String): Response {
        val fileSize = file.length()

        // Parse range header (e.g., "bytes=0-1023" or "bytes=1024-")
        val range = parseRangeHeader(rangeHeader, fileSize)

        if (range == null) {
            return newFixedLengthResponse(
                Response.Status.RANGE_NOT_SATISFIABLE,
                "text/plain",
                "Invalid range"
            )
        }

        val (start, end) = range
        val contentLength = end - start + 1

        // Open file and skip to start position
        val fis = FileInputStream(file)
        fis.skip(start)

        // Create response with partial content
        val response = newFixedLengthResponse(
            Response.Status.PARTIAL_CONTENT,
            getMimeType(file),
            fis,
            contentLength
        )

        // Add range headers
        response.addHeader("Accept-Ranges", "bytes")
        response.addHeader("Content-Range", "bytes $start-$end/$fileSize")
        response.addHeader("Content-Length", contentLength.toString())
        response.addHeader("Connection", "close")

        // Add CORS headers to allow WebView access from capacitor:// origin
        response.addHeader("Access-Control-Allow-Origin", "*")
        response.addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        response.addHeader("Access-Control-Allow-Headers", "Range, Accept-Encoding")

        return response
    }

    /**
     * Parse Range header
     * Returns Pair(start, end) or null if invalid
     */
    private fun parseRangeHeader(rangeHeader: String, fileSize: Long): Pair<Long, Long>? {
        try {
            // Remove "bytes=" prefix
            val rangeValue = rangeHeader.removePrefix("bytes=").trim()

            // Split by "-"
            val parts = rangeValue.split("-")

            if (parts.size != 2) return null

            // Parse start and end
            val start = if (parts[0].isNotEmpty()) parts[0].toLong() else 0L
            val end = if (parts[1].isNotEmpty()) parts[1].toLong() else fileSize - 1

            // Validate range
            if (start < 0 || end >= fileSize || start > end) {
                return null
            }

            return Pair(start, end)

        } catch (e: NumberFormatException) {
            return null
        }
    }

    /**
     * Get MIME type based on file extension
     */
    private fun getMimeType(file: File): String {
        val filename = file.name.lowercase()

        return when {
            filename.endsWith(".mp4") -> "video/mp4"
            filename.endsWith(".mkv") -> "video/x-matroska"
            filename.endsWith(".avi") -> "video/x-msvideo"
            filename.endsWith(".mov") -> "video/quicktime"
            filename.endsWith(".wmv") -> "video/x-ms-wmv"
            filename.endsWith(".flv") -> "video/x-flv"
            filename.endsWith(".webm") -> "video/webm"
            filename.endsWith(".m4v") -> "video/x-m4v"
            filename.endsWith(".mpg") || filename.endsWith(".mpeg") -> "video/mpeg"
            filename.endsWith(".3gp") -> "video/3gpp"
            filename.endsWith(".ogv") -> "video/ogg"
            else -> "application/octet-stream"
        }
    }

    /**
     * Check if server is running
     */
    fun isRunning(): Boolean {
        return isAlive
    }

    /**
     * Cleanup
     */
    fun cleanup() {
        try {
            stop()
        } catch (e: Exception) {
            // Ignore cleanup errors
        }
        videoFile = null
        videoSize = 0
    }
}
