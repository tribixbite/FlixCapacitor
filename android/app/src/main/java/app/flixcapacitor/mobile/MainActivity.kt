package app.flixcapacitor.mobile

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Register BatteryPlugin (Phase 10D.2)
        registerPlugin(BatteryPlugin::class.java)
    }
}
