package app.flixcapacitor.mobile

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager as AndroidBatteryManager
import android.os.Build
import android.os.PowerManager
import android.util.Log
import org.json.JSONObject

/**
 * Battery management service for FlixCapacitor (Phase 10D.2: Battery Management)
 *
 * Monitors battery state and network conditions to optimize app behavior:
 * - Battery level and charging status
 * - Doze mode detection (Android 6+)
 * - Battery Saver mode detection
 * - Network type detection (WiFi vs cellular)
 * - Power-aware download throttling
 *
 * Integrates with download manager to pause/throttle on low battery.
 */
class BatteryManager(private val context: Context) {

    companion object {
        private const val TAG = "BatteryManager"

        // Battery thresholds
        const val LOW_BATTERY_THRESHOLD = 20
        const val CRITICAL_BATTERY_THRESHOLD = 10

        // Power states
        const val POWER_STATE_NORMAL = "normal"
        const val POWER_STATE_LOW_BATTERY = "low_battery"
        const val POWER_STATE_CRITICAL_BATTERY = "critical_battery"
        const val POWER_STATE_DOZE_MODE = "doze_mode"
        const val POWER_STATE_BATTERY_SAVER = "battery_saver"
    }

    private val powerManager: PowerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    private val batteryReceiver: BatteryBroadcastReceiver
    private var batteryChangeListener: ((BatteryInfo) -> Unit)? = null
    private var currentBatteryInfo: BatteryInfo? = null

    init {
        batteryReceiver = BatteryBroadcastReceiver()
        registerBatteryReceiver()
        Log.i(TAG, "BatteryManager initialized")
    }

    /**
     * Battery information data class
     */
    data class BatteryInfo(
        val level: Int,
        val isCharging: Boolean,
        val powerState: String,
        val isDozeMode: Boolean,
        val isBatterySaver: Boolean,
        val isWiFiConnected: Boolean,
        val shouldThrottle: Boolean,
        val shouldPauseDownloads: Boolean
    ) {
        fun toJSON(): JSONObject {
            return JSONObject().apply {
                put("level", level)
                put("isCharging", isCharging)
                put("powerState", powerState)
                put("isDozeMode", isDozeMode)
                put("isBatterySaver", isBatterySaver)
                put("isWiFiConnected", isWiFiConnected)
                put("shouldThrottle", shouldThrottle)
                put("shouldPauseDownloads", shouldPauseDownloads)
            }
        }
    }

    /**
     * Get current battery information
     */
    fun getBatteryInfo(): BatteryInfo {
        val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as AndroidBatteryManager

        // Get battery level
        val level = batteryManager.getIntProperty(AndroidBatteryManager.BATTERY_PROPERTY_CAPACITY)

        // Get charging status
        val batteryStatus: Intent? = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val status = batteryStatus?.getIntExtra(AndroidBatteryManager.EXTRA_STATUS, -1) ?: -1
        val isCharging = status == AndroidBatteryManager.BATTERY_STATUS_CHARGING ||
                        status == AndroidBatteryManager.BATTERY_STATUS_FULL

        // Check Doze mode (Android 6+)
        val isDozeMode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            powerManager.isDeviceIdleMode
        } else {
            false
        }

        // Check Battery Saver mode (Android 5+)
        val isBatterySaver = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            powerManager.isPowerSaveMode
        } else {
            false
        }

        // Check WiFi connection
        val isWiFiConnected = isConnectedToWiFi()

        // Determine power state
        val powerState = when {
            isDozeMode -> POWER_STATE_DOZE_MODE
            isBatterySaver -> POWER_STATE_BATTERY_SAVER
            level <= CRITICAL_BATTERY_THRESHOLD -> POWER_STATE_CRITICAL_BATTERY
            level <= LOW_BATTERY_THRESHOLD -> POWER_STATE_LOW_BATTERY
            else -> POWER_STATE_NORMAL
        }

        // Determine if should throttle downloads
        val shouldThrottle = !isCharging && (level <= LOW_BATTERY_THRESHOLD || isBatterySaver)

        // Determine if should pause downloads
        val shouldPauseDownloads = !isCharging && level <= CRITICAL_BATTERY_THRESHOLD

        val info = BatteryInfo(
            level = level,
            isCharging = isCharging,
            powerState = powerState,
            isDozeMode = isDozeMode,
            isBatterySaver = isBatterySaver,
            isWiFiConnected = isWiFiConnected,
            shouldThrottle = shouldThrottle,
            shouldPauseDownloads = shouldPauseDownloads
        )

        currentBatteryInfo = info
        return info
    }

    /**
     * Check if connected to WiFi
     */
    private fun isConnectedToWiFi(): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = connectivityManager.activeNetwork ?: return false
            val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
            return capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
        } else {
            @Suppress("DEPRECATION")
            val networkInfo = connectivityManager.activeNetworkInfo ?: return false
            @Suppress("DEPRECATION")
            return networkInfo.type == ConnectivityManager.TYPE_WIFI
        }
    }

    /**
     * Set battery change listener
     */
    fun setBatteryChangeListener(listener: (BatteryInfo) -> Unit) {
        this.batteryChangeListener = listener
        Log.d(TAG, "Battery change listener set")
    }

    /**
     * Remove battery change listener
     */
    fun removeBatteryChangeListener() {
        this.batteryChangeListener = null
        Log.d(TAG, "Battery change listener removed")
    }

    /**
     * Register battery broadcast receiver
     */
    private fun registerBatteryReceiver() {
        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_BATTERY_CHANGED)
            addAction(Intent.ACTION_BATTERY_LOW)
            addAction(Intent.ACTION_BATTERY_OKAY)
            addAction(Intent.ACTION_POWER_CONNECTED)
            addAction(Intent.ACTION_POWER_DISCONNECTED)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                addAction(PowerManager.ACTION_DEVICE_IDLE_MODE_CHANGED)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                addAction(PowerManager.ACTION_POWER_SAVE_MODE_CHANGED)
            }
        }
        context.registerReceiver(batteryReceiver, filter)
        Log.i(TAG, "Battery broadcast receiver registered")
    }

    /**
     * Unregister battery broadcast receiver
     */
    fun destroy() {
        try {
            context.unregisterReceiver(batteryReceiver)
            Log.i(TAG, "Battery broadcast receiver unregistered")
        } catch (e: Exception) {
            Log.e(TAG, "Error unregistering battery receiver", e)
        }
    }

    /**
     * Broadcast receiver for battery events
     */
    private inner class BatteryBroadcastReceiver : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                Intent.ACTION_BATTERY_CHANGED,
                Intent.ACTION_BATTERY_LOW,
                Intent.ACTION_BATTERY_OKAY,
                Intent.ACTION_POWER_CONNECTED,
                Intent.ACTION_POWER_DISCONNECTED,
                PowerManager.ACTION_DEVICE_IDLE_MODE_CHANGED,
                PowerManager.ACTION_POWER_SAVE_MODE_CHANGED -> {
                    val info = getBatteryInfo()
                    Log.d(TAG, "Battery event: ${intent.action}, level=${info.level}%, " +
                            "charging=${info.isCharging}, state=${info.powerState}")

                    batteryChangeListener?.invoke(info)
                }
            }
        }
    }
}
