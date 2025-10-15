package com.flixcapacitor.torrent

import com.frostwire.jlibtorrent.*
import com.frostwire.jlibtorrent.alerts.*
import com.getcapacitor.JSObject
import java.io.File

/**
 * TorrentSession - Manages jlibtorrent session and torrent operations
 * Handles magnet links, metadata, progress tracking, and file selection
 */
class TorrentSession(
    private val saveDirectory: File,
    private val proxySettings: ProxySettings? = null
) {

    /**
     * Proxy configuration for routing torrent traffic
     */
    data class ProxySettings(
        val type: ProxyType,
        val hostname: String,
        val port: Int,
        val username: String = "",
        val password: String = ""
    )

    enum class ProxyType(val value: Int) {
        NONE(0),
        SOCKS4(1),
        SOCKS5(2),
        SOCKS5_PW(3),  // SOCKS5 with password
        HTTP(4),
        HTTP_PW(5),    // HTTP with password
        I2P(6)
    }

    // jlibtorrent components
    private var sessionManager: SessionManager? = null
    // CRITICAL: Never store TorrentHandle - JNI pointers become stale
    // Store Sha1Hash instead and get fresh handle from SessionManager when needed
    private var activeSha1Hash: Sha1Hash? = null

    // Callbacks for events
    var onMetadataReceived: ((TorrentInfo) -> Unit)? = null
    var onProgress: ((TorrentStatus) -> Unit)? = null
    var onError: ((String) -> Unit)? = null
    var onTorrentAdded: ((TorrentHandle) -> Unit)? = null

    // Tracking state
    private var hasReceivedMetadata = false
    private var selectedFileIndex: Int = -1

    /**
     * Safely retrieves a fresh TorrentHandle from the SessionManager.
     * This is the ONLY way torrent handles should be accessed outside alert context.
     * CRITICAL: Never store TorrentHandle - always get fresh from SessionManager
     */
    private fun getActiveTorrentHandle(): TorrentHandle? {
        val sm = sessionManager ?: return null
        val sha1 = activeSha1Hash ?: return null
        val handle = sm.find(sha1)
        // Ensure the handle is not only found but also valid before returning
        return if (handle != null && handle.isValid) {
            handle
        } else {
            null
        }
    }

    /**
     * Initialize jlibtorrent SessionManager with mobile-optimized settings
     */
    fun initialize() {
        try {
            android.util.Log.d("TorrentSession", "initialize() - Creating SessionManager...")
            sessionManager = SessionManager()
            android.util.Log.d("TorrentSession", "SessionManager created successfully")

            // Mobile-optimized settings (jlibtorrent 2.x simplified API)
            val settingsPack = SettingsPack()

            // Connection limits (mobile-friendly)
            settingsPack.connectionsLimit(50)

            // Bandwidth limits (0 = unlimited)
            settingsPack.downloadRateLimit(0)
            settingsPack.uploadRateLimit(100 * 1024) // 100 KB/s

            // Active torrent limits
            settingsPack.activeDownloads(3)
            settingsPack.activeSeeds(2)
            settingsPack.activeLimit(5)

            // CRITICAL FIX: Disable incoming connections to prevent listen socket crash
            // Android apps cannot bind to listening sockets, which causes onListenFailed
            // and subsequent SIGSEGV crash. Setting empty string disables listening.
            // We can still connect outgoing to peers and DHT.
            settingsPack.listenInterfaces("")

            // Configure proxy if provided
            proxySettings?.let { proxy ->
                android.util.Log.d("TorrentSession", "Proxy requested: ${proxy.type} ${proxy.hostname}:${proxy.port}")

                try {
                    // Using raw settings key values for jlibtorrent proxy configuration
                    // Based on libtorrent settings: https://www.libtorrent.org/reference-Settings.html
                    val SP = com.frostwire.jlibtorrent.swig.settings_pack()

                    // proxy_type: 0=none, 1=socks4, 2=socks5, 3=socks5_pw, 4=http, 5=http_pw, 6=i2p
                    SP.set_int(com.frostwire.jlibtorrent.swig.settings_pack.int_types.proxy_type.swigValue(), proxy.type.value)

                    // proxy_hostname
                    SP.set_str(com.frostwire.jlibtorrent.swig.settings_pack.string_types.proxy_hostname.swigValue(), proxy.hostname)

                    // proxy_port
                    SP.set_int(com.frostwire.jlibtorrent.swig.settings_pack.int_types.proxy_port.swigValue(), proxy.port)

                    if (proxy.username.isNotEmpty()) {
                        SP.set_str(com.frostwire.jlibtorrent.swig.settings_pack.string_types.proxy_username.swigValue(), proxy.username)
                    }
                    if (proxy.password.isNotEmpty()) {
                        SP.set_str(com.frostwire.jlibtorrent.swig.settings_pack.string_types.proxy_password.swigValue(), proxy.password)
                    }

                    // Route all traffic through proxy
                    SP.set_bool(com.frostwire.jlibtorrent.swig.settings_pack.bool_types.proxy_peer_connections.swigValue(), true)
                    SP.set_bool(com.frostwire.jlibtorrent.swig.settings_pack.bool_types.proxy_tracker_connections.swigValue(), true)
                    SP.set_bool(com.frostwire.jlibtorrent.swig.settings_pack.bool_types.proxy_hostnames.swigValue(), true)

                    // Apply proxy settings to our SettingsPack
                    sessionManager!!.applySettings(SettingsPack(SP))

                    android.util.Log.d("TorrentSession", "✅ Proxy configured successfully")
                } catch (e: Exception) {
                    android.util.Log.e("TorrentSession", "❌ Failed to configure proxy", e)
                }
            } ?: run {
                android.util.Log.d("TorrentSession", "No proxy configured, using direct connection")
            }

            // Note: DHT, LSD, UTP are enabled by default in jlibtorrent 2.x
            // Tracker settings are also enabled by default

            android.util.Log.d("TorrentSession", "Applying settings and starting session...")
            sessionManager!!.applySettings(settingsPack)
            sessionManager!!.start()
            android.util.Log.d("TorrentSession", "Session started successfully")

            // Start DHT for peer discovery
            android.util.Log.d("TorrentSession", "Starting DHT...")
            sessionManager!!.startDht()
            android.util.Log.d("TorrentSession", "DHT started")

            // DHT bootstrap nodes are automatically used by jlibtorrent
            // The library connects to well-known DHT routers by default

            // Add alert listener for events
            android.util.Log.d("TorrentSession", "Adding alert listener...")
            sessionManager!!.addListener(object : AlertListener {
                override fun types(): IntArray? {
                    // Listen to specific alert types
                    return intArrayOf(
                        AlertType.ADD_TORRENT.swig(),
                        AlertType.METADATA_RECEIVED.swig(),
                        AlertType.STATE_UPDATE.swig(),
                        AlertType.TORRENT_ERROR.swig(),
                        AlertType.DHT_STATS.swig()
                    )
                }

                override fun alert(alert: Alert<*>) {
                    try {
                        val alertType = alert.type()
                        android.util.Log.d("TorrentSession", "🔔 Received alert: $alertType")

                        when (alertType) {
                            AlertType.ADD_TORRENT -> {
                                android.util.Log.d("TorrentSession", "Processing ADD_TORRENT alert")
                                handleAddTorrent(alert as AddTorrentAlert)
                            }
                            AlertType.METADATA_RECEIVED -> {
                                android.util.Log.d("TorrentSession", "Processing METADATA_RECEIVED alert")
                                handleMetadataReceived(alert as MetadataReceivedAlert)
                            }
                            AlertType.STATE_UPDATE -> {
                                android.util.Log.d("TorrentSession", "Processing STATE_UPDATE alert")
                                handleStateUpdate(alert as StateUpdateAlert)
                            }
                            AlertType.TORRENT_ERROR -> {
                                android.util.Log.d("TorrentSession", "Processing TORRENT_ERROR alert")
                                handleTorrentError(alert as TorrentErrorAlert)
                            }
                            else -> {
                                android.util.Log.d("TorrentSession", "Ignoring alert: $alertType")
                            }
                        }
                        android.util.Log.d("TorrentSession", "✅ Alert $alertType processed successfully")
                    } catch (e: Throwable) {
                        // CRITICAL: Log any exception from the alert loop to prevent a native crash
                        android.util.Log.e("TorrentSession", "💥 CRASH in alert listener for ${alert.type()}", e)
                        onError?.invoke("Alert handler crash (${alert.type()}): ${e.javaClass.simpleName} - ${e.message}")
                    }
                }
            })
            android.util.Log.d("TorrentSession", "Alert listener added successfully")
            android.util.Log.d("TorrentSession", "TorrentSession initialization complete!")

        } catch (e: Exception) {
            android.util.Log.e("TorrentSession", "initialize() failed", e)
            onError?.invoke("Failed to initialize torrent session: ${e.message}\n${e.stackTraceToString()}")
        }
    }

    /**
     * Handle ADD_TORRENT alert (torrent added successfully)
     */
    private fun handleAddTorrent(alert: AddTorrentAlert) {
        try {
            val errorCode = alert.error()
            // ErrorCode.value() == 0 means success, non-zero means error
            if (errorCode == null || errorCode.value() == 0) {
                val handle = alert.handle()
                // Store the stable Sha1Hash instead of the handle
                activeSha1Hash = handle.infoHash()
                android.util.Log.d("TorrentSession", "Torrent added successfully: ${handle.name()}")

                // Set sequential download flag for streaming
                handle.setFlags(TorrentFlags.SEQUENTIAL_DOWNLOAD)

                // Notify callback
                onTorrentAdded?.invoke(handle)
            } else {
                android.util.Log.e("TorrentSession", "Error adding torrent: ${errorCode.message()}")
                onError?.invoke("Error adding torrent: ${errorCode.message()}")
            }
        } catch (e: Exception) {
            android.util.Log.e("TorrentSession", "handleAddTorrent crashed", e)
            onError?.invoke("Failed to handle add torrent: ${e.message}")
        }
    }

    /**
     * Add magnet URI and start downloading
     */
    fun addMagnet(magnetUri: String, maxDownloadSpeed: Int = 0, maxUploadSpeed: Int = 100 * 1024, maxConnections: Int = 50) {
        try {
            sessionManager?.let { sm ->
                // Apply bandwidth settings dynamically
                android.util.Log.d("TorrentSession", "Applying bandwidth settings: download=$maxDownloadSpeed, upload=$maxUploadSpeed, connections=$maxConnections")

                val settingsPack = SettingsPack()
                settingsPack.downloadRateLimit(maxDownloadSpeed)
                settingsPack.uploadRateLimit(maxUploadSpeed)
                settingsPack.connectionsLimit(maxConnections)

                sm.applySettings(settingsPack)
                android.util.Log.d("TorrentSession", "Bandwidth settings applied successfully")

                // Use SessionManager.fetchMagnet to get metadata first, then download
                // This avoids the null flags issue when using download(magnetUri, saveDir, flags)
                // We'll add the torrent without flags and set them in handleAddTorrent
                val th = TorrentHandle(sm.swig().find_torrent(com.frostwire.jlibtorrent.swig.add_torrent_params.parse_magnet_uri(magnetUri, com.frostwire.jlibtorrent.swig.error_code()).getInfo_hashes().get_best()))
                if (th.isValid) {
                    // Torrent already exists
                    android.util.Log.w("TorrentSession", "Torrent already exists in session")
                    return
                }

                // Add magnet using native session async_add_torrent
                val ec = com.frostwire.jlibtorrent.swig.error_code()
                val p = com.frostwire.jlibtorrent.swig.add_torrent_params.parse_magnet_uri(magnetUri, ec)

                if (ec.value() != 0) {
                    throw IllegalArgumentException(ec.message())
                }

                p.setSave_path(saveDirectory.absolutePath)
                sm.swig().async_add_torrent(p)

            } ?: run {
                onError?.invoke("SessionManager not initialized")
            }
        } catch (e: Exception) {
            android.util.Log.e("TorrentSession", "Failed to add magnet", e)
            onError?.invoke("Failed to add magnet: ${e.message}")
        }
    }

    /**
     * Handle metadata received alert
     * CRITICAL: Get handle directly from alert, not from stored torrentHandle
     * Stored handles can become invalid between alerts causing native crashes
     */
    private fun handleMetadataReceived(alert: MetadataReceivedAlert) {
        try {
            LogHelper.i("TorrentSession", "🎯 METADATA_RECEIVED alert triggered")

            // Get FRESH handle directly from the alert - this is the key fix
            // Never use the stored torrentHandle as it can become stale
            val handle = alert.handle()

            if (!handle.isValid) {
                LogHelper.w("TorrentSession", "❌ Handle from metadata alert is invalid")
                android.util.Log.w("TorrentSession", "handleMetadataReceived: handle from alert is invalid, ignoring")
                onError?.invoke("Torrent handle from metadata alert is invalid")
                return
            }

            // Get torrent info
            val torrentInfo = handle.torrentFile()
            if (torrentInfo == null) {
                LogHelper.w("TorrentSession", "❌ torrentFile() returned null")
                android.util.Log.w("TorrentSession", "handleMetadataReceived: torrentFile() returned null")
                return
            }

            LogHelper.i("TorrentSession", "✅ Metadata received successfully:")
            LogHelper.i("TorrentSession", "  - Name: ${torrentInfo.name()}")
            LogHelper.i("TorrentSession", "  - Total size: ${torrentInfo.totalSize() / 1024 / 1024} MB")
            LogHelper.i("TorrentSession", "  - Num files: ${torrentInfo.numFiles()}")

            if (!hasReceivedMetadata) {
                hasReceivedMetadata = true
                // Sha1Hash already stored from ADD_TORRENT alert, no need to update handle
                LogHelper.i("TorrentSession", "📢 Invoking onMetadataReceived callback")
                onMetadataReceived?.invoke(torrentInfo)
            }
        } catch (e: Exception) {
            LogHelper.e("TorrentSession", "💥 handleMetadataReceived crashed", e)
            android.util.Log.e("TorrentSession", "handleMetadataReceived: unexpected error", e)
            onError?.invoke("Failed to handle metadata: ${e.message}")
        }
    }

    /**
     * Handle state update alert (progress)
     * CRITICAL: Get status from alert instead of calling status() on stored handle
     * The stored handle can become stale and cause native crashes
     */
    private fun handleStateUpdate(alert: StateUpdateAlert) {
        // CRITICAL FIX: Only process state updates AFTER we have metadata
        // Processing before metadata is available can crash
        if (!hasReceivedMetadata) {
            android.util.Log.d("TorrentSession", "Ignoring STATE_UPDATE - no metadata yet")
            return
        }

        try {
            val sha1 = activeSha1Hash ?: return // No active torrent to update
            val statusArray = alert.status()

            // Find the status for our specific torrent by matching the info hash
            for (status in statusArray) {
                if (status.infoHash() == sha1) {
                    onProgress?.invoke(status)
                    break // Found our torrent, no need to check others
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("TorrentSession", "handleStateUpdate failed", e)
            // Don't call onError here - state updates are frequent and non-critical
        }
    }

    /**
     * Handle torrent error alert
     */
    private fun handleTorrentError(alert: TorrentErrorAlert) {
        onError?.invoke("Torrent error: ${alert.error().message()}")
    }

    /**
     * Find largest video file in torrent for streaming
     * Returns tuple of (fileIndex, fileName, fileSize)
     */
    fun findLargestVideoFile(): Triple<Int, String, Long>? {
        LogHelper.i("TorrentSession", "🔍 findLargestVideoFile() - Starting video file search")

        getActiveTorrentHandle()?.let { handle ->
            LogHelper.d("TorrentSession", "  - Got active torrent handle")
            val torrentInfo = handle.torrentFile()
            if (torrentInfo == null) {
                LogHelper.w("TorrentSession", "  ❌ torrentFile() returned null")
                return null
            }

            val files = torrentInfo.files()
            val numFiles = files.numFiles()
            LogHelper.i("TorrentSession", "  - Total files in torrent: $numFiles")

            var largestFileIndex = -1
            var largestFileName = ""
            var largestSize = 0L
            var videoFilesFound = 0

            for (i in 0 until numFiles) {
                val filePath = files.filePath(i)
                val fileSize = files.fileSize(i)

                // Check if video file and larger than current largest
                if (isVideoFile(filePath)) {
                    videoFilesFound++
                    LogHelper.d("TorrentSession", "  - Video file $videoFilesFound: $filePath (${fileSize / 1024 / 1024} MB)")

                    if (fileSize > largestSize) {
                        largestSize = fileSize
                        largestFileName = filePath
                        largestFileIndex = i
                    }
                }
            }

            LogHelper.i("TorrentSession", "  - Total video files found: $videoFilesFound")

            if (largestFileIndex >= 0) {
                selectedFileIndex = largestFileIndex
                LogHelper.i("TorrentSession", "✅ Selected largest video file:")
                LogHelper.i("TorrentSession", "  - Index: $largestFileIndex")
                LogHelper.i("TorrentSession", "  - Name: $largestFileName")
                LogHelper.i("TorrentSession", "  - Size: ${largestSize / 1024 / 1024} MB")
                return Triple(largestFileIndex, largestFileName, largestSize)
            } else {
                LogHelper.w("TorrentSession", "❌ No video files found in torrent")
            }
        } ?: run {
            LogHelper.w("TorrentSession", "❌ getActiveTorrentHandle() returned null")
        }

        return null
    }

    /**
     * Check if file is a video based on extension
     */
    private fun isVideoFile(path: String): Boolean {
        val videoExtensions = listOf(
            ".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv",
            ".webm", ".m4v", ".mpg", ".mpeg", ".3gp", ".ogv"
        )
        return videoExtensions.any { path.lowercase().endsWith(it) }
    }

    /**
     * Get list of all video files in the torrent
     * Returns array of {index, name, size} for each video file
     */
    fun getVideoFileList(): List<JSObject>? {
        LogHelper.i("TorrentSession", "📋 getVideoFileList() - Getting all video files")

        getActiveTorrentHandle()?.let { handle ->
            val torrentInfo = handle.torrentFile()
            if (torrentInfo == null) {
                LogHelper.w("TorrentSession", "  ❌ torrentFile() returned null")
                return null
            }

            val files = torrentInfo.files()
            val numFiles = files.numFiles()
            val videoFiles = mutableListOf<JSObject>()

            for (i in 0 until numFiles) {
                val filePath = files.filePath(i)
                val fileSize = files.fileSize(i)

                if (isVideoFile(filePath)) {
                    val fileObj = JSObject()
                    fileObj.put("index", i)
                    fileObj.put("name", filePath)
                    fileObj.put("size", fileSize)
                    videoFiles.add(fileObj)
                }
            }

            LogHelper.i("TorrentSession", "  - Found ${videoFiles.size} video files")
            return videoFiles
        } ?: run {
            LogHelper.w("TorrentSession", "❌ getActiveTorrentHandle() returned null")
        }

        return null
    }

    /**
     * Select a specific file index to stream
     * Must be called before file is prioritized
     */
    fun selectFile(fileIndex: Int): Boolean {
        LogHelper.i("TorrentSession", "📌 selectFile() - Setting file index to $fileIndex")

        getActiveTorrentHandle()?.let { handle ->
            val torrentInfo = handle.torrentFile()
            if (torrentInfo == null) {
                LogHelper.w("TorrentSession", "  ❌ torrentFile() returned null")
                return false
            }

            val files = torrentInfo.files()
            val numFiles = files.numFiles()

            if (fileIndex < 0 || fileIndex >= numFiles) {
                LogHelper.e("TorrentSession", "  ❌ Invalid file index: $fileIndex (total files: $numFiles)")
                return false
            }

            val filePath = files.filePath(fileIndex)
            val fileSize = files.fileSize(fileIndex)

            selectedFileIndex = fileIndex
            LogHelper.i("TorrentSession", "✅ File selected:")
            LogHelper.i("TorrentSession", "  - Index: $fileIndex")
            LogHelper.i("TorrentSession", "  - Name: $filePath")
            LogHelper.i("TorrentSession", "  - Size: ${fileSize / 1024 / 1024} MB")
            return true
        } ?: run {
            LogHelper.w("TorrentSession", "❌ getActiveTorrentHandle() returned null")
        }

        return false
    }

    /**
     * Get file path for selected video file
     */
    fun getSelectedFilePath(): String? {
        if (selectedFileIndex < 0) return null

        getActiveTorrentHandle()?.let { handle ->
            val torrentInfo = handle.torrentFile() ?: return null
            val files = torrentInfo.files()
            val relativePath = files.filePath(selectedFileIndex)

            // Return absolute path
            return File(saveDirectory, relativePath).absolutePath
        }
        return null
    }

    /**
     * Get selected file size
     */
    fun getSelectedFileSize(): Long {
        if (selectedFileIndex < 0) return 0L

        getActiveTorrentHandle()?.let { handle ->
            val torrentInfo = handle.torrentFile() ?: return 0L
            val files = torrentInfo.files()
            return files.fileSize(selectedFileIndex)
        }
        return 0L
    }

    /**
     * Prioritize pieces for selected file (for streaming)
     * Uses jlibtorrent 2.x Priority API
     */
    fun prioritizeSelectedFile() {
        if (selectedFileIndex < 0) return

        getActiveTorrentHandle()?.let { handle ->
            val torrentInfo = handle.torrentFile() ?: return
            val files = torrentInfo.files()

            // Get current priorities
            val priorities = handle.filePriorities()

            // Set all files to ignore
            for (i in 0 until files.numFiles()) {
                priorities[i] = Priority.IGNORE
            }

            // Set selected file to highest priority (Priority.SEVEN in 2.x)
            priorities[selectedFileIndex] = Priority.SEVEN

            // Apply priorities
            handle.prioritizeFiles(priorities)
        }
    }

    /**
     * Pause torrent download
     */
    fun pause() {
        getActiveTorrentHandle()?.pause()
    }

    /**
     * Resume torrent download
     */
    fun resume() {
        getActiveTorrentHandle()?.resume()
    }

    /**
     * Request manual torrent status update
     * Forces the session manager to post StateUpdate alerts for all torrents
     */
    fun postTorrentUpdates() {
        sessionManager?.postTorrentUpdates()
    }

    /**
     * Get current torrent status as JSObject for JavaScript
     */
    fun getStatus(): JSObject {
        val statusObj = JSObject()

        getActiveTorrentHandle()?.let { handle ->
            // Handle is guaranteed to be valid from getActiveTorrentHandle()
            val status = handle.status()

            val progressFloat = status.progress()
            // Prevent JSONException from non-finite float values (NaN, Infinity)
            statusObj.put("progress", if (progressFloat.isFinite()) progressFloat else 0.0f)
            statusObj.put("downloadSpeed", status.downloadRate().toLong())
            statusObj.put("uploadSpeed", status.uploadRate().toLong())
            statusObj.put("numPeers", status.numPeers())
            statusObj.put("totalDownloaded", status.totalDownload())
            statusObj.put("totalUploaded", status.totalUpload())
            statusObj.put("state", status.state().name)
            statusObj.put("isPaused", status.flags().and_(TorrentFlags.PAUSED).nonZero())
            statusObj.put("hasMetadata", handle.torrentFile() != null)
        } ?: run {
            // No active/valid torrent
            statusObj.put("error", "No active torrent")
            statusObj.put("progress", 0.0)
            statusObj.put("downloadSpeed", 0)
            statusObj.put("uploadSpeed", 0)
            statusObj.put("numPeers", 0)
            statusObj.put("totalDownloaded", 0)
            statusObj.put("totalUploaded", 0)
            statusObj.put("state", "UNKNOWN")
            statusObj.put("isPaused", false)
            statusObj.put("hasMetadata", false)
        }

        return statusObj
    }

    /**
     * Update proxy settings on the active session
     * Can be called at any time to reconfigure the proxy
     */
    fun updateProxySettings(proxySettings: ProxySettings?) {
        try {
            val SP = com.frostwire.jlibtorrent.swig.settings_pack()

            if (proxySettings != null) {
                android.util.Log.d("TorrentSession", "🔧 Updating proxy settings:")
                android.util.Log.d("TorrentSession", "  - Type: ${proxySettings.type}")
                android.util.Log.d("TorrentSession", "  - Host: ${proxySettings.hostname}:${proxySettings.port}")

                SP.set_int(com.frostwire.jlibtorrent.swig.settings_pack.int_types.proxy_type.swigValue(), proxySettings.type.value)
                SP.set_str(com.frostwire.jlibtorrent.swig.settings_pack.string_types.proxy_hostname.swigValue(), proxySettings.hostname)
                SP.set_int(com.frostwire.jlibtorrent.swig.settings_pack.int_types.proxy_port.swigValue(), proxySettings.port)
                SP.set_str(com.frostwire.jlibtorrent.swig.settings_pack.string_types.proxy_username.swigValue(), proxySettings.username)
                SP.set_str(com.frostwire.jlibtorrent.swig.settings_pack.string_types.proxy_password.swigValue(), proxySettings.password)

                // Route all traffic through proxy
                SP.set_bool(com.frostwire.jlibtorrent.swig.settings_pack.bool_types.proxy_peer_connections.swigValue(), true)
                SP.set_bool(com.frostwire.jlibtorrent.swig.settings_pack.bool_types.proxy_tracker_connections.swigValue(), true)
                SP.set_bool(com.frostwire.jlibtorrent.swig.settings_pack.bool_types.proxy_hostnames.swigValue(), true)

                android.util.Log.d("TorrentSession", "✅ Proxy enabled and configured")
            } else {
                android.util.Log.d("TorrentSession", "🔧 Disabling proxy")
                SP.set_int(com.frostwire.jlibtorrent.swig.settings_pack.int_types.proxy_type.swigValue(), ProxyType.NONE.value)
                android.util.Log.d("TorrentSession", "✅ Proxy disabled")
            }

            sessionManager?.applySettings(SettingsPack(SP))
            android.util.Log.d("TorrentSession", "✅ Proxy settings applied successfully")
        } catch (e: Exception) {
            android.util.Log.e("TorrentSession", "❌ Failed to update proxy settings", e)
        }
    }

    /**
     * Get torrent info (name, size, files)
     */
    fun getTorrentInfo(): JSObject? {
        getActiveTorrentHandle()?.let { handle ->
            val torrentInfo = handle.torrentFile() ?: return null

            val info = JSObject()
            info.put("name", torrentInfo.name())
            info.put("totalSize", torrentInfo.totalSize())
            info.put("numFiles", torrentInfo.numFiles())

            // Get info hash from torrent handle (simpler API)
            info.put("infoHash", handle.infoHash().toHex())

            return info
        }
        return null
    }

    /**
     * Cleanup session and release all resources
     * CRITICAL: Must be called to prevent memory leaks from native jlibtorrent resources
     */
    fun cleanup() {
        try {
            android.util.Log.d("TorrentSession", "cleanup() - Stopping session and removing torrent...")

            // Clear callbacks to prevent leaks
            onMetadataReceived = null
            onProgress = null
            onError = null
            onTorrentAdded = null

            // Pause and remove torrent using fresh handle
            getActiveTorrentHandle()?.let { handle ->
                handle.pause()
                sessionManager?.remove(handle)
            }

            // Stop session manager (cleans up native jlibtorrent resources)
            sessionManager?.stop()

            android.util.Log.d("TorrentSession", "cleanup() completed successfully")
        } catch (e: Exception) {
            android.util.Log.e("TorrentSession", "Error during cleanup()", e)
        } finally {
            activeSha1Hash = null
            sessionManager = null
            hasReceivedMetadata = false
            selectedFileIndex = -1
        }
    }

    /**
     * Alias for cleanup() - backwards compatibility
     */
    fun destroy() = cleanup()
}
