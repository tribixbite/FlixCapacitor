package app.flixcapacitor.mobile;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
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
            strings = {
                Manifest.permission.READ_EXTERNAL_STORAGE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            },
            alias = "storage"
        )
    }
)
public class MediaPermissionsPlugin extends Plugin {

    /**
     * Check if media permissions are granted
     */
    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject result = new JSObject();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) { // Android 13+
            boolean videoGranted = ContextCompat.checkSelfPermission(
                getContext(),
                Manifest.permission.READ_MEDIA_VIDEO
            ) == PackageManager.PERMISSION_GRANTED;

            boolean audioGranted = ContextCompat.checkSelfPermission(
                getContext(),
                Manifest.permission.READ_MEDIA_AUDIO
            ) == PackageManager.PERMISSION_GRANTED;

            result.put("readMediaVideo", videoGranted ? "granted" : "denied");
            result.put("readMediaAudio", audioGranted ? "granted" : "denied");
            result.put("granted", videoGranted || audioGranted);
        } else { // Android 12 and below
            boolean storageGranted = ContextCompat.checkSelfPermission(
                getContext(),
                Manifest.permission.READ_EXTERNAL_STORAGE
            ) == PackageManager.PERMISSION_GRANTED;

            result.put("storage", storageGranted ? "granted" : "denied");
            result.put("granted", storageGranted);
        }

        call.resolve(result);
    }

    /**
     * Request media permissions
     */
    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) { // Android 13+
            // Request both READ_MEDIA_VIDEO and READ_MEDIA_AUDIO
            if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_MEDIA_VIDEO) != PackageManager.PERMISSION_GRANTED ||
                ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_MEDIA_AUDIO) != PackageManager.PERMISSION_GRANTED) {

                requestPermissionForAliases(
                    new String[] { "readMediaVideo", "readMediaAudio" },
                    call,
                    "permissionsCallback"
                );
            } else {
                // Already granted
                JSObject result = new JSObject();
                result.put("readMediaVideo", "granted");
                result.put("readMediaAudio", "granted");
                result.put("granted", true);
                call.resolve(result);
            }
        } else { // Android 12 and below
            // Request READ_EXTERNAL_STORAGE
            if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                requestPermissionForAlias("storage", call, "permissionsCallback");
            } else {
                // Already granted
                JSObject result = new JSObject();
                result.put("storage", "granted");
                result.put("granted", true);
                call.resolve(result);
            }
        }
    }

    /**
     * Handle permission request result
     */
    @PermissionCallback
    private void permissionsCallback(PluginCall call) {
        JSObject result = new JSObject();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) { // Android 13+
            boolean videoGranted = ContextCompat.checkSelfPermission(
                getContext(),
                Manifest.permission.READ_MEDIA_VIDEO
            ) == PackageManager.PERMISSION_GRANTED;

            boolean audioGranted = ContextCompat.checkSelfPermission(
                getContext(),
                Manifest.permission.READ_MEDIA_AUDIO
            ) == PackageManager.PERMISSION_GRANTED;

            result.put("readMediaVideo", videoGranted ? "granted" : "denied");
            result.put("readMediaAudio", audioGranted ? "granted" : "denied");
            result.put("granted", videoGranted || audioGranted);

            if (!videoGranted && !audioGranted) {
                call.reject("Media permissions were denied");
                return;
            }
        } else { // Android 12 and below
            boolean storageGranted = ContextCompat.checkSelfPermission(
                getContext(),
                Manifest.permission.READ_EXTERNAL_STORAGE
            ) == PackageManager.PERMISSION_GRANTED;

            result.put("storage", storageGranted ? "granted" : "denied");
            result.put("granted", storageGranted);

            if (!storageGranted) {
                call.reject("Storage permission was denied");
                return;
            }
        }

        call.resolve(result);
    }
}
