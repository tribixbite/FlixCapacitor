package app.flixcapacitor.mobile

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import com.getcapacitor.BridgeActivity

/**
 * TestActivity - Automated testing via ADB intents
 * Allows triggering app features programmatically for testing
 *
 * Usage:
 *   adb shell am start -n app.flixcapacitor.mobile/.TestActivity \
 *     -a android.intent.action.VIEW \
 *     -d "flixtest://command?action=test_name&param1=value1"
 *
 * Available tests:
 *   - test_multifile_playback: Test sequential playback of multiple files
 *   - test_favorites: Test adding/removing favorites
 *   - test_library_scan: Test library folder scanning
 *   - test_video_switching: Test video switching bug scenario
 *   - test_subtitle_detection: Test subtitle file detection
 *   - get_logs: Retrieve test logs
 */
class TestActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "FlixTest"
        private val testLogs = mutableListOf<String>()

        fun log(message: String) {
            val timestamp = System.currentTimeMillis()
            val logEntry = "[$timestamp] $message"
            testLogs.add(logEntry)
            Log.d(TAG, message)
        }

        fun getLogs(): List<String> = testLogs.toList()

        fun clearLogs() {
            testLogs.clear()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        log("TestActivity created")

        // Handle intent
        intent?.let { handleTestIntent(it) }
    }

    private fun handleTestIntent(intent: Intent) {
        val data = intent.data

        if (data == null) {
            log("ERROR: No intent data provided")
            finish()
            return
        }

        log("Received test intent: $data")

        val action = data.getQueryParameter("action")

        when (action) {
            "test_multifile_playback" -> testMultiFilePlayback(data)
            "test_favorites" -> testFavorites(data)
            "test_library_scan" -> testLibraryScan(data)
            "test_video_switching" -> testVideoSwitching(data)
            "test_subtitle_detection" -> testSubtitleDetection(data)
            "get_logs" -> outputLogs()
            "clear_logs" -> clearTestLogs()
            else -> {
                log("ERROR: Unknown test action: $action")
                finish()
            }
        }
    }

    /**
     * Test multi-file torrent playback queue
     *
     * Parameters:
     *   - magnet: Magnet link for multi-file torrent
     *   - files: Comma-separated file indices (e.g., "0,1,2")
     *   - title: Movie/show title
     */
    private fun testMultiFilePlayback(data: android.net.Uri) {
        log("=== MULTI-FILE PLAYBACK TEST ===")

        val magnet = data.getQueryParameter("magnet")
        val filesStr = data.getQueryParameter("files") ?: "0,1,2"
        val title = data.getQueryParameter("title") ?: "Test Multi-File Content"

        if (magnet.isNullOrEmpty()) {
            log("ERROR: magnet parameter required")
            finish()
            return
        }

        val fileIndices = filesStr.split(",").mapNotNull { it.trim().toIntOrNull() }
        log("Testing playback queue with ${fileIndices.size} files: $fileIndices")
        log("Magnet: ${magnet.take(50)}...")
        log("Title: $title")

        // Launch main app with deep link to trigger playback
        val webIntent = Intent(Intent.ACTION_VIEW).apply {
            setClassName(packageName, "app.flixcapacitor.mobile.MainActivity")
            putExtra("TEST_MODE", true)
            putExtra("TEST_ACTION", "multifile_playback")
            putExtra("MAGNET_LINK", magnet)
            putExtra("FILE_INDICES", fileIndices.toIntArray())
            putExtra("TITLE", title)
        }

        log("Launching MainActivity for playback test...")
        startActivity(webIntent)

        // Wait and check results
        Handler(Looper.getMainLooper()).postDelayed({
            log("Test initiated - monitor logcat for playback events")
            finish()
        }, 2000)
    }

    /**
     * Test file-level favorites functionality
     *
     * Parameters:
     *   - hash: Torrent hash
     *   - index: File index
     *   - name: File name
     *   - operation: "add" or "remove"
     */
    private fun testFavorites(data: android.net.Uri) {
        log("=== FAVORITES TEST ===")

        val hash = data.getQueryParameter("hash") ?: "test_hash_12345"
        val index = data.getQueryParameter("index")?.toIntOrNull() ?: 0
        val name = data.getQueryParameter("name") ?: "test_file.mp4"
        val operation = data.getQueryParameter("operation") ?: "add"

        log("Operation: $operation")
        log("Hash: $hash")
        log("File Index: $index")
        log("File Name: $name")

        val webIntent = Intent(Intent.ACTION_VIEW).apply {
            setClassName(packageName, "app.flixcapacitor.mobile.MainActivity")
            putExtra("TEST_MODE", true)
            putExtra("TEST_ACTION", "favorites")
            putExtra("TORRENT_HASH", hash)
            putExtra("FILE_INDEX", index)
            putExtra("FILE_NAME", name)
            putExtra("OPERATION", operation)
        }

        log("Launching MainActivity for favorites test...")
        startActivity(webIntent)

        Handler(Looper.getMainLooper()).postDelayed({
            log("Favorites test initiated")
            finish()
        }, 2000)
    }

    /**
     * Test library folder scanning
     *
     * Parameters:
     *   - path: Folder path to scan (uses SAF URI)
     */
    private fun testLibraryScan(data: android.net.Uri) {
        log("=== LIBRARY SCAN TEST ===")

        val folderUri = data.getQueryParameter("folder")

        if (folderUri.isNullOrEmpty()) {
            log("ERROR: folder parameter required")
            finish()
            return
        }

        log("Folder URI: $folderUri")

        val webIntent = Intent(Intent.ACTION_VIEW).apply {
            setClassName(packageName, "app.flixcapacitor.mobile.MainActivity")
            putExtra("TEST_MODE", true)
            putExtra("TEST_ACTION", "library_scan")
            putExtra("FOLDER_URI", folderUri)
        }

        log("Launching MainActivity for library scan test...")
        startActivity(webIntent)

        Handler(Looper.getMainLooper()).postDelayed({
            log("Library scan test initiated")
            finish()
        }, 2000)
    }

    /**
     * Test video switching bug scenario
     * Simulates clicking second video while first is loading
     *
     * Parameters:
     *   - magnet1: First magnet link
     *   - magnet2: Second magnet link
     *   - delay: Delay in ms before switching (default 1000)
     */
    private fun testVideoSwitching(data: android.net.Uri) {
        log("=== VIDEO SWITCHING BUG TEST ===")

        val magnet1 = data.getQueryParameter("magnet1")
        val magnet2 = data.getQueryParameter("magnet2")
        val delay = data.getQueryParameter("delay")?.toLongOrNull() ?: 1000L

        if (magnet1.isNullOrEmpty() || magnet2.isNullOrEmpty()) {
            log("ERROR: Both magnet1 and magnet2 parameters required")
            finish()
            return
        }

        log("Video 1: ${magnet1.take(50)}...")
        log("Video 2: ${magnet2.take(50)}...")
        log("Switch delay: ${delay}ms")

        val webIntent = Intent(Intent.ACTION_VIEW).apply {
            setClassName(packageName, "app.flixcapacitor.mobile.MainActivity")
            putExtra("TEST_MODE", true)
            putExtra("TEST_ACTION", "video_switching")
            putExtra("MAGNET_1", magnet1)
            putExtra("MAGNET_2", magnet2)
            putExtra("SWITCH_DELAY", delay)
        }

        log("Launching MainActivity for video switching test...")
        startActivity(webIntent)

        Handler(Looper.getMainLooper()).postDelayed({
            log("Video switching test initiated - check for proper flag handling")
            finish()
        }, 2000)
    }

    /**
     * Test subtitle file detection in torrents
     *
     * Parameters:
     *   - magnet: Magnet link for torrent with subtitles
     */
    private fun testSubtitleDetection(data: android.net.Uri) {
        log("=== SUBTITLE DETECTION TEST ===")

        val magnet = data.getQueryParameter("magnet")

        if (magnet.isNullOrEmpty()) {
            log("ERROR: magnet parameter required")
            finish()
            return
        }

        log("Magnet: ${magnet.take(50)}...")

        val webIntent = Intent(Intent.ACTION_VIEW).apply {
            setClassName(packageName, "app.flixcapacitor.mobile.MainActivity")
            putExtra("TEST_MODE", true)
            putExtra("TEST_ACTION", "subtitle_detection")
            putExtra("MAGNET_LINK", magnet)
        }

        log("Launching MainActivity for subtitle detection test...")
        startActivity(webIntent)

        Handler(Looper.getMainLooper()).postDelayed({
            log("Subtitle detection test initiated")
            finish()
        }, 2000)
    }

    /**
     * Output all test logs to logcat and finish
     */
    private fun outputLogs() {
        log("=== TEST LOGS OUTPUT ===")
        log("Total log entries: ${testLogs.size}")

        testLogs.forEachIndexed { index, entry ->
            Log.d(TAG, "[$index] $entry")
        }

        log("=== END TEST LOGS ===")
        finish()
    }

    /**
     * Clear all test logs
     */
    private fun clearTestLogs() {
        log("Clearing test logs (${testLogs.size} entries)")
        clearLogs()
        log("Test logs cleared")
        finish()
    }
}
