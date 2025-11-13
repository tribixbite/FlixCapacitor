package com.flixcapacitor.torrent

import fi.iki.elonen.NanoHTTPD
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import kotlin.random.Random

/**
 * Unit tests for StreamingServer
 * Tests HTTP Range requests, dynamic port allocation, and video streaming functionality
 */
class StreamingServerTest {

    private lateinit var server: StreamingServer
    private lateinit var testVideoFile: File
    private val testVideoSize = 1024 * 1024 // 1 MB test file

    @Before
    fun setUp() {
        // Create test video file
        testVideoFile = File.createTempFile("test_video", ".mp4")
        testVideoFile.deleteOnExit()

        // Write random data to simulate video file
        FileOutputStream(testVideoFile).use { fos ->
            val randomData = ByteArray(testVideoSize)
            Random.nextBytes(randomData)
            fos.write(randomData)
        }

        // Create server with dynamic port allocation
        server = StreamingServer(0)
    }

    @After
    fun tearDown() {
        try {
            server.cleanup()
        } catch (e: Exception) {
            // Ignore cleanup errors
        }
        testVideoFile.delete()
    }

    // ===== CRITICAL BUG FIX TESTS =====

    @Test
    fun `test dynamic port allocation - port 0 assigns free port`() {
        // Given: Server created with port 0
        server.setVideoFile(testVideoFile)

        // When: Server is started
        server.start()

        // Then: OS should assign a non-zero port
        val assignedPort = server.listeningPort
        assertTrue("Server should be assigned a non-zero port", assignedPort > 0)
        assertTrue("Assigned port should be in ephemeral range", assignedPort >= 1024)
        assertTrue("Server should be running", server.isRunning())
    }

    @Test
    fun `test multiple servers can coexist with dynamic ports`() {
        // Given: Two servers with dynamic port allocation
        val server1 = StreamingServer(0)
        val server2 = StreamingServer(0)

        try {
            // When: Both servers are started
            server1.start()
            server2.start()

            // Then: Both should get different ports
            val port1 = server1.listeningPort
            val port2 = server2.listeningPort

            assertNotEquals("Servers should get different ports", port1, port2)
            assertTrue("Server 1 should be running", server1.isRunning())
            assertTrue("Server 2 should be running", server2.isRunning())
        } finally {
            server1.cleanup()
            server2.cleanup()
        }
    }

    @Test
    fun `test getStreamUrl returns correct URL with dynamic port`() {
        // Given: Server with dynamic port
        server.setVideoFile(testVideoFile)
        server.start()

        // When: Getting stream URL
        val streamUrl = server.getStreamUrl()
        val actualPort = server.listeningPort

        // Then: URL should contain actual assigned port
        assertEquals("http://127.0.0.1:$actualPort/video", streamUrl)
        assertTrue("Stream URL should be parseable", URL(streamUrl).protocol == "http")
    }

    // ===== HTTP RANGE REQUEST TESTS =====

    @Test
    fun `test HTTP Range request parsing - start and end`() {
        // Given: Server with test video file
        server.setVideoFile(testVideoFile)
        server.start()
        val port = server.listeningPort

        // When: Requesting bytes 100-199
        val connection = URL("http://127.0.0.1:$port/video").openConnection() as HttpURLConnection
        connection.setRequestProperty("Range", "bytes=100-199")

        // Then: Should return partial content (206)
        assertEquals(HttpURLConnection.HTTP_PARTIAL, connection.responseCode)

        // Verify Content-Range header
        val contentRange = connection.getHeaderField("Content-Range")
        assertNotNull("Content-Range header should be present", contentRange)
        assertTrue("Content-Range should specify bytes 100-199",
            contentRange.contains("bytes 100-199"))

        // Verify Content-Length
        assertEquals("Content-Length should be 100 bytes", "100",
            connection.getHeaderField("Content-Length"))

        connection.disconnect()
    }

    @Test
    fun `test HTTP Range request - open-ended range`() {
        // Given: Server with test video file
        server.setVideoFile(testVideoFile)
        server.start()
        val port = server.listeningPort

        // When: Requesting bytes from 1000 to end (bytes=1000-)
        val connection = URL("http://127.0.0.1:$port/video").openConnection() as HttpURLConnection
        connection.setRequestProperty("Range", "bytes=1000-")

        // Then: Should return partial content from 1000 to file end
        assertEquals(HttpURLConnection.HTTP_PARTIAL, connection.responseCode)

        val contentLength = connection.getHeaderField("Content-Length").toInt()
        val expectedLength = testVideoSize - 1000
        assertEquals("Content-Length should be file size minus start position",
            expectedLength, contentLength)

        connection.disconnect()
    }

    @Test
    fun `test HTTP Range request - validates skip loop works correctly`() {
        // CRITICAL TEST: Verifies InputStream.skip() loop fix
        // This test ensures we correctly handle the skip() loop for large offsets

        // Given: Server with test video file
        server.setVideoFile(testVideoFile)
        server.start()
        val port = server.listeningPort

        // When: Requesting bytes from near end of file (large skip offset)
        val startPosition = testVideoSize - 1024 // Last 1KB
        val connection = URL("http://127.0.0.1:$port/video").openConnection() as HttpURLConnection
        connection.setRequestProperty("Range", "bytes=$startPosition-")

        // Then: Should successfully skip to position and return data
        assertEquals(HttpURLConnection.HTTP_PARTIAL, connection.responseCode)

        val data = connection.inputStream.readBytes()
        assertEquals("Should return exactly 1024 bytes", 1024, data.size)

        // Verify data matches expected bytes from file
        val expectedData = testVideoFile.readBytes().copyOfRange(startPosition, testVideoSize)
        assertArrayEquals("Returned data should match file data at offset",
            expectedData, data)

        connection.disconnect()
    }

    @Test
    fun `test HTTP Range request - invalid range returns 416`() {
        // Given: Server with test video file
        server.setVideoFile(testVideoFile)
        server.start()
        val port = server.listeningPort

        // When: Requesting invalid range (start > end)
        val connection = URL("http://127.0.0.1:$port/video").openConnection() as HttpURLConnection
        connection.setRequestProperty("Range", "bytes=1000-500")

        // Then: Should return Range Not Satisfiable (416)
        assertEquals(416, connection.responseCode)  // HTTP 416 Range Not Satisfiable

        connection.disconnect()
    }

    @Test
    fun `test HTTP Range request - range beyond file size returns 416`() {
        // Given: Server with test video file
        server.setVideoFile(testVideoFile)
        server.start()
        val port = server.listeningPort

        // When: Requesting range beyond file size
        val connection = URL("http://127.0.0.1:$port/video").openConnection() as HttpURLConnection
        connection.setRequestProperty("Range", "bytes=${testVideoSize + 1000}-")

        // Then: Should return Range Not Satisfiable (416)
        assertEquals(416, connection.responseCode)  // HTTP 416 Range Not Satisfiable

        connection.disconnect()
    }

    // ===== FULL FILE REQUEST TESTS =====

    @Test
    fun `test full file request without Range header`() {
        // Given: Server with test video file
        server.setVideoFile(testVideoFile)
        server.start()
        val port = server.listeningPort

        // When: Requesting file without Range header
        val connection = URL("http://127.0.0.1:$port/video").openConnection() as HttpURLConnection

        // Then: Should return full file (200 OK)
        assertEquals(HttpURLConnection.HTTP_OK, connection.responseCode)
        assertEquals(testVideoSize.toString(),
            connection.getHeaderField("Content-Length"))
        assertEquals("Accept-Ranges: bytes should be present",
            "bytes", connection.getHeaderField("Accept-Ranges"))

        connection.disconnect()
    }

    @Test
    fun `test CORS headers are present`() {
        // Given: Server with test video file
        server.setVideoFile(testVideoFile)
        server.start()
        val port = server.listeningPort

        // When: Making request
        val connection = URL("http://127.0.0.1:$port/video").openConnection() as HttpURLConnection

        // Then: CORS headers should be present for WebView compatibility
        assertEquals("*", connection.getHeaderField("Access-Control-Allow-Origin"))
        assertTrue(connection.getHeaderField("Access-Control-Allow-Methods")
            .contains("GET"))

        connection.disconnect()
    }

    @Test
    fun `test OPTIONS preflight request`() {
        // Given: Server running
        server.setVideoFile(testVideoFile)
        server.start()
        val port = server.listeningPort

        // When: Sending OPTIONS request
        val connection = URL("http://127.0.0.1:$port/video").openConnection() as HttpURLConnection
        connection.requestMethod = "OPTIONS"

        // Then: Should return 200 OK with CORS headers
        assertEquals(HttpURLConnection.HTTP_OK, connection.responseCode)
        assertEquals("*", connection.getHeaderField("Access-Control-Allow-Origin"))

        connection.disconnect()
    }

    // ===== MIME TYPE TESTS =====

    @Test
    fun `test MIME type detection for common video formats`() {
        val testCases = mapOf(
            ".mp4" to "video/mp4",
            ".mkv" to "video/x-matroska",
            ".avi" to "video/x-msvideo",
            ".mov" to "video/quicktime",
            ".webm" to "video/webm",
            ".m4v" to "video/x-m4v",
            ".mpg" to "video/mpeg",
            ".mpeg" to "video/mpeg",
            ".xyz" to "application/octet-stream"
        )

        testCases.forEach { (extension, expectedMime) ->
            // Given: Server with file of specific extension
            val testFile = File.createTempFile("test_video", extension)
            testFile.deleteOnExit()
            testFile.writeBytes(ByteArray(100))

            val testServer = StreamingServer(0)
            testServer.setVideoFile(testFile)
            testServer.start()

            try {
                // When: Requesting file
                val port = testServer.listeningPort
                val connection = URL("http://127.0.0.1:$port/video")
                    .openConnection() as HttpURLConnection

                // Then: Content-Type should match expected MIME type
                val contentType = connection.contentType ?: ""
                val actualMimeType = contentType.split(";")[0].trim()  // Remove charset if present
                assertEquals("File with extension $extension should have MIME type $expectedMime",
                    expectedMime, actualMimeType)

                connection.disconnect()
            } finally {
                testServer.cleanup()
                testFile.delete()
            }
        }
    }

    // ===== ERROR HANDLING TESTS =====

    @Test
    fun `test request for non-existent endpoint returns 404`() {
        // Given: Server running
        server.setVideoFile(testVideoFile)
        server.start()
        val port = server.listeningPort

        // When: Requesting wrong endpoint
        val connection = URL("http://127.0.0.1:$port/wrong").openConnection() as HttpURLConnection

        // Then: Should return 404 Not Found
        assertEquals(HttpURLConnection.HTTP_NOT_FOUND, connection.responseCode)

        connection.disconnect()
    }

    @Test
    fun `test request when video file not set returns 404`() {
        // Given: Server without video file set
        server.start()
        val port = server.listeningPort

        // When: Requesting video
        val connection = URL("http://127.0.0.1:$port/video").openConnection() as HttpURLConnection

        // Then: Should return 404 Not Found
        assertEquals(HttpURLConnection.HTTP_NOT_FOUND, connection.responseCode)

        connection.disconnect()
    }

    @Test
    fun `test cleanup stops server`() {
        // Given: Running server
        server.setVideoFile(testVideoFile)
        server.start()
        assertTrue("Server should be running", server.isRunning())

        // When: Cleanup is called
        server.cleanup()

        // Then: Server should be stopped
        assertFalse("Server should be stopped after cleanup", server.isRunning())
    }

    // ===== EDGE CASE TESTS =====

    @Test
    fun `test concurrent Range requests`() {
        // CRITICAL TEST: Ensures multiple simultaneous requests work correctly

        // Given: Server with test video file
        server.setVideoFile(testVideoFile)
        server.start()
        val port = server.listeningPort

        // When: Making multiple concurrent requests
        val threads = (1..5).map { threadNum ->
            Thread {
                val start = threadNum * 1000
                val end = start + 999

                val connection = URL("http://127.0.0.1:$port/video")
                    .openConnection() as HttpURLConnection
                connection.setRequestProperty("Range", "bytes=$start-$end")

                // Then: Each should succeed
                assertEquals(HttpURLConnection.HTTP_PARTIAL, connection.responseCode)
                assertEquals(1000, connection.contentLength)

                connection.disconnect()
            }
        }

        threads.forEach { it.start() }
        threads.forEach { it.join(5000) } // Wait max 5 seconds
    }

    @Test
    fun `test Range request for single byte`() {
        // Given: Server with test video file
        server.setVideoFile(testVideoFile)
        server.start()
        val port = server.listeningPort

        // When: Requesting single byte (bytes=0-0)
        val connection = URL("http://127.0.0.1:$port/video").openConnection() as HttpURLConnection
        connection.setRequestProperty("Range", "bytes=0-0")

        // Then: Should return exactly 1 byte
        assertEquals(HttpURLConnection.HTTP_PARTIAL, connection.responseCode)
        assertEquals("1", connection.getHeaderField("Content-Length"))

        val data = connection.inputStream.readBytes()
        assertEquals(1, data.size)

        connection.disconnect()
    }

    @Test
    fun `test Range request for last byte`() {
        // Given: Server with test video file
        server.setVideoFile(testVideoFile)
        server.start()
        val port = server.listeningPort

        // When: Requesting last byte
        val lastBytePos = testVideoSize - 1
        val connection = URL("http://127.0.0.1:$port/video").openConnection() as HttpURLConnection
        connection.setRequestProperty("Range", "bytes=$lastBytePos-$lastBytePos")

        // Then: Should return exactly 1 byte
        assertEquals(HttpURLConnection.HTTP_PARTIAL, connection.responseCode)
        assertEquals("1", connection.getHeaderField("Content-Length"))

        val data = connection.inputStream.readBytes()
        assertEquals(1, data.size)

        // Verify it's the actual last byte
        val expectedByte = testVideoFile.readBytes()[lastBytePos]
        assertEquals(expectedByte, data[0])

        connection.disconnect()
    }
}
