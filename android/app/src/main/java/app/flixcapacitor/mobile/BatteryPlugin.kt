package app.flixcapacitor.mobile

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * Capacitor plugin for battery management (Phase 10D.2)
 *
 * Exposes battery information and power state to TypeScript:
 * - getBatteryInfo(): Get current battery state
 * - Battery change events via 'batteryChange' event
 *
 * Usage in TypeScript:
 * ```typescript
 * const info = await BatteryPlugin.getBatteryInfo();
 * console.log(info.level, info.isCharging, info.powerState);
 *
 * BatteryPlugin.addListener('batteryChange', (info) => {
 *   console.log('Battery changed:', info);
 * });
 * ```
 */
@CapacitorPlugin(name = "BatteryPlugin")
class BatteryPlugin : Plugin() {

    private var batteryManager: BatteryManager? = null

    override fun load() {
        super.load()
        batteryManager = BatteryManager(context)

        // Set listener to forward battery events to JavaScript
        batteryManager?.setBatteryChangeListener { info ->
            notifyListeners("batteryChange", info.toJSON())
        }
    }

    /**
     * Get current battery information
     */
    @PluginMethod
    fun getBatteryInfo(call: PluginCall) {
        try {
            val info = batteryManager?.getBatteryInfo()
            if (info != null) {
                call.resolve(info.toJSON())
            } else {
                call.reject("BatteryManager not initialized")
            }
        } catch (e: Exception) {
            call.reject("Error getting battery info: ${e.message}", e)
        }
    }

    override fun handleOnDestroy() {
        super.handleOnDestroy()
        batteryManager?.destroy()
        batteryManager = null
    }
}
