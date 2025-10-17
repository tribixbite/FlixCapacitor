package app.flixcapacitor.mobile

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

/**
 * Capacitor plugin to request Android 13+ granular media permissions
 * (READ_MEDIA_VIDEO and READ_MEDIA_AUDIO)
 *
 * Best Practices:
 * - Request permissions contextually (when user needs the feature)
 * - Check shouldShowRationale to provide context
 * - READ_MEDIA_VIDEO/AUDIO is sufficient - no need for MANAGE_EXTERNAL_STORAGE
 * - WRITE_EXTERNAL_STORAGE removed - not needed for reading files
 */
@CapacitorPlugin(
    name = "MediaPermissions",
    permissions = [
        Permission(
            strings = [Manifest.permission.READ_MEDIA_VIDEO],
            alias = "readMediaVideo"
        ),
        Permission(
            strings = [Manifest.permission.READ_MEDIA_AUDIO],
            alias = "readMediaAudio"
        ),
        Permission(
            strings = [Manifest.permission.READ_EXTERNAL_STORAGE],
            alias = "storage"
        )
    ]
)
class MediaPermissionsPlugin : Plugin() {

    /**
     * Convert PermissionState to lowercase string for JS compatibility
     */
    private fun permissionStateToString(state: PermissionState): String {
        return when (state) {
            PermissionState.GRANTED -> "granted"
            PermissionState.DENIED -> "denied"
            PermissionState.PROMPT -> "prompt"
            PermissionState.PROMPT_WITH_RATIONALE -> "prompt-with-rationale"
        }
    }

    /**
     * Check if media permissions are granted
     * Returns detailed state for each permission
     */
    @PluginMethod
    override fun checkPermissions(call: PluginCall) {
        val result = JSObject()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) { // Android 13+
            val videoState = getPermissionState("readMediaVideo")
            val audioState = getPermissionState("readMediaAudio")

            result.put("readMediaVideo", permissionStateToString(videoState))
            result.put("readMediaAudio", permissionStateToString(audioState))
            result.put("granted", videoState == PermissionState.GRANTED || audioState == PermissionState.GRANTED)
        } else { // Android 12 and below
            val storageState = getPermissionState("storage")
            result.put("storage", permissionStateToString(storageState))
            result.put("granted", storageState == PermissionState.GRANTED)
        }

        call.resolve(result)
    }

    /**
     * Request media permissions
     */
    @PluginMethod
    override fun requestPermissions(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) { // Android 13+
            requestPermissionForAliases(
                arrayOf("readMediaVideo", "readMediaAudio"),
                call,
                "permissionsCallback"
            )
        } else { // Android 12 and below
            requestPermissionForAlias("storage", call, "permissionsCallback")
        }
    }

    /**
     * Handle permission request result
     * After request, check permissions returns the updated state
     */
    @PermissionCallback
    private fun permissionsCallback(call: PluginCall) {
        // Reuse checkPermissions logic for consistency
        checkPermissions(call)
    }

    /**
     * Open app settings page where user can manually grant permissions
     * Opens ACTION_APPLICATION_DETAILS_SETTINGS (most reliable across devices)
     *
     * Note: There's no standard Intent to open the Permissions sub-page directly.
     * Accompany this with UI instruction: "Tap 'Permissions' → Enable media access"
     */
    @PluginMethod
    fun openSettings(call: PluginCall) {
        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.fromParts("package", context.packageName, null)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)

            val result = JSObject()
            result.put("opened", true)
            call.resolve(result)
        } catch (e: Exception) {
            call.reject("Failed to open settings: ${e.message}")
        }
    }
}
