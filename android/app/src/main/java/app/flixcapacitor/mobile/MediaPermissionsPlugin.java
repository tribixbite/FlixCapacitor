package app.flixcapacitor.mobile;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * Capacitor plugin to request Android 13+ granular media permissions
 * (READ_MEDIA_VIDEO and READ_MEDIA_AUDIO)
 *
 * Best Practices (per Gemini):
 * - Request permissions contextually (when user needs the feature)
 * - Check shouldShowRationale to provide context
 * - READ_MEDIA_VIDEO/AUDIO is sufficient - no need for MANAGE_EXTERNAL_STORAGE
 * - WRITE_EXTERNAL_STORAGE removed - not needed for reading files
 */
@CapacitorPlugin(
    name = "MediaPermissions",
    permissions = {
        @Permission(
            strings = { Manifest.permission.READ_MEDIA_VIDEO },
            alias = "readMediaVideo"
        ),
        @Permission(
            strings = { Manifest.permission.READ_MEDIA_AUDIO },
            alias = "readMediaAudio"
        ),
        @Permission(
            strings = { Manifest.permission.READ_EXTERNAL_STORAGE },
            alias = "storage"
        )
    }
)
public class MediaPermissionsPlugin extends Plugin {

    /**
     * Get permission state for a specific permission
     * Returns: "granted", "prompt-with-rationale", or "prompt"
     */
    private String getPermissionState(String permission) {
        if (ContextCompat.checkSelfPermission(getContext(), permission) == PackageManager.PERMISSION_GRANTED) {
            return "granted";
        } else if (ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), permission)) {
            // User denied once, should show rationale before asking again
            return "prompt-with-rationale";
        } else {
            // Either first time or user selected "Don't ask again"
            return "prompt";
        }
    }

    /**
     * Check if media permissions are granted
     * Returns detailed state for each permission
     */
    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject result = new JSObject();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) { // Android 13+
            String videoState = getPermissionState(Manifest.permission.READ_MEDIA_VIDEO);
            String audioState = getPermissionState(Manifest.permission.READ_MEDIA_AUDIO);

            result.put("readMediaVideo", videoState);
            result.put("readMediaAudio", audioState);
            result.put("granted", videoState.equals("granted") || audioState.equals("granted"));
        } else { // Android 12 and below
            String storageState = getPermissionState(Manifest.permission.READ_EXTERNAL_STORAGE);
            result.put("storage", storageState);
            result.put("granted", storageState.equals("granted"));
        }

        call.resolve(result);
    }

    /**
     * Request media permissions
     */
    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) { // Android 13+
            requestPermissionForAliases(
                new String[] { "readMediaVideo", "readMediaAudio" },
                call,
                "permissionsCallback"
            );
        } else { // Android 12 and below
            requestPermissionForAlias("storage", call, "permissionsCallback");
        }
    }

    /**
     * Handle permission request result
     * After request, check permissions returns the updated state
     */
    @PermissionCallback
    private void permissionsCallback(PluginCall call) {
        // Reuse checkPermissions logic for consistency
        checkPermissions(call);
    }

    /**
     * Open app settings page where user can manually grant permissions
     * Opens ACTION_APPLICATION_DETAILS_SETTINGS (most reliable across devices)
     *
     * Note: There's no standard Intent to open the Permissions sub-page directly.
     * Accompany this with UI instruction: "Tap 'Permissions' → Enable media access"
     */
    @PluginMethod
    public void openSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            Uri uri = Uri.fromParts("package", getContext().getPackageName(), null);
            intent.setData(uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);

            JSObject result = new JSObject();
            result.put("opened", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to open settings: " + e.getMessage());
        }
    }
}
