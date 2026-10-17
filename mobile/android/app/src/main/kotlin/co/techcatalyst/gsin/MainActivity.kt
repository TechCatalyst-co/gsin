package co.techcatalyst.gsin

import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.os.Bundle
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        createBreakingChannel()
    }

    // FCM posts alerts to this channel (see default_notification_channel_id in
    // the manifest); readers can tune it in system settings.
    private fun createBreakingChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(
            getString(R.string.breaking_channel_id),
            getString(R.string.breaking_channel_name),
            NotificationManager.IMPORTANCE_HIGH,
        ).apply { description = getString(R.string.breaking_channel_description) }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }
}
