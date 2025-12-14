package com.flixcapacitor.directorypicker

import android.content.Intent
import android.net.Uri
import androidx.activity.result.contract.ActivityResultContracts
import androidx.documentfile.provider.DocumentFile
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "DirectoryPicker")
class DirectoryPickerPlugin : Plugin() {

    private var savedCall: PluginCall? = null
    private lateinit var directoryPicker: androidx.activity.result.ActivityResultLauncher<Uri?>

    /**
     * Called when the plugin is loaded - register ActivityResultLauncher here
     * This MUST be called before Activity is STARTED per Android lifecycle requirements
     */
    override fun load() {
        super.load()
        // Register the ActivityResultLauncher in load() to satisfy Android lifecycle requirements
        directoryPicker = bridge.registerForActivityResult(
            ActivityResultContracts.OpenDocumentTree()
        ) { uri ->
            handleDirectoryPickerResult(uri)
        }
    }

    /**
     * Open the system directory picker and request persistent access
     */
    @PluginMethod
    fun pickDirectory(call: PluginCall) {
        savedCall = call
        try {
            // Launch the directory picker
            directoryPicker.launch(null)
        } catch (e: Exception) {
            call.reject("Failed to open directory picker: ${e.message}", e)
            savedCall = null
        }
    }

    /**
     * Handle the result from the directory picker
     */
    private fun handleDirectoryPickerResult(uri: Uri?) {
        val call = savedCall
        savedCall = null

        if (uri == null) {
            call?.reject("No directory selected")
            return
        }

        try {
            // THIS IS CRITICAL: Take persistent read permissions
            val contentResolver = context.contentResolver
            val takeFlags = Intent.FLAG_GRANT_READ_URI_PERMISSION
            contentResolver.takePersistableUriPermission(uri, takeFlags)

            // Get display name if available
            val directory = DocumentFile.fromTreeUri(context, uri)
            val displayName = directory?.name ?: "Unknown"

            // Return the URI and display name
            val result = JSObject()
            result.put("uri", uri.toString())
            result.put("displayName", displayName)
            call?.resolve(result)

        } catch (e: Exception) {
            call?.reject("Failed to grant persistent permissions: ${e.message}", e)
        }
    }

    /**
     * List all files in a directory using its content:// URI
     * Supports recursive scanning and file extension filtering
     */
    @PluginMethod
    fun listFiles(call: PluginCall) {
        val uriString = call.getString("uri")
        if (uriString == null) {
            call.reject("URI is required")
            return
        }

        try {
            val directoryUri = Uri.parse(uriString)
            val directory = DocumentFile.fromTreeUri(context, directoryUri)

            if (directory == null || !directory.isDirectory) {
                call.reject("Invalid directory URI or not a directory")
                return
            }

            // Get options
            val extensionsArray = call.getArray("extensions")
            val extensions = if (extensionsArray != null) {
                (0 until extensionsArray.length()).mapNotNull {
                    extensionsArray.getString(it)?.lowercase()
                }
            } else {
                null
            }
            val recursive = call.getBoolean("recursive", true) ?: true

            // List files
            val files = listFilesRecursive(directory, extensions, recursive, "")

            // Return results
            val filesArray = JSArray()
            files.forEach { filesArray.put(it) }

            val result = JSObject()
            result.put("files", filesArray)
            call.resolve(result)

        } catch (e: Exception) {
            call.reject("Failed to list files: ${e.message}", e)
        }
    }

    /**
     * Recursively list files in a directory
     */
    private fun listFilesRecursive(
        directory: DocumentFile,
        extensions: List<String>?,
        recursive: Boolean,
        relativePath: String
    ): List<JSObject> {
        val files = mutableListOf<JSObject>()

        directory.listFiles().forEach { file ->
            when {
                file.isFile -> {
                    // Check if file matches extension filter
                    val fileName = file.name ?: return@forEach
                    val matchesExtension = extensions == null ||
                        extensions.any { fileName.lowercase().endsWith(it) }

                    if (matchesExtension) {
                        val fileObj = JSObject()
                        fileObj.put("uri", file.uri.toString())
                        fileObj.put("name", fileName)
                        fileObj.put("size", file.length())
                        fileObj.put("mimeType", file.type ?: "application/octet-stream")
                        fileObj.put("relativePath", if (relativePath.isEmpty()) fileName else "$relativePath/$fileName")
                        files.add(fileObj)
                    }
                }
                file.isDirectory && recursive -> {
                    // Recursively scan subdirectory
                    val newRelativePath = if (relativePath.isEmpty()) {
                        file.name ?: ""
                    } else {
                        "$relativePath/${file.name ?: ""}"
                    }
                    files.addAll(listFilesRecursive(file, extensions, recursive, newRelativePath))
                }
            }
        }

        return files
    }

    /**
     * Get list of all directories with persistent permissions
     */
    @PluginMethod
    fun getPersistedDirectories(call: PluginCall) {
        try {
            val contentResolver = context.contentResolver
            val persistedUriPermissions = contentResolver.persistedUriPermissions

            val uris = JSArray()
            persistedUriPermissions.forEach { permission ->
                if (permission.isReadPermission) {
                    uris.put(permission.uri.toString())
                }
            }

            val result = JSObject()
            result.put("uris", uris)
            call.resolve(result)

        } catch (e: Exception) {
            call.reject("Failed to get persisted directories: ${e.message}", e)
        }
    }

    /**
     * Release persistent permissions for a directory
     */
    @PluginMethod
    fun releaseDirectory(call: PluginCall) {
        val uriString = call.getString("uri")
        if (uriString == null) {
            call.reject("URI is required")
            return
        }

        try {
            val uri = Uri.parse(uriString)
            val contentResolver = context.contentResolver
            val releaseFlags = Intent.FLAG_GRANT_READ_URI_PERMISSION

            contentResolver.releasePersistableUriPermission(uri, releaseFlags)

            call.resolve()

        } catch (e: Exception) {
            call.reject("Failed to release directory permissions: ${e.message}", e)
        }
    }
}
