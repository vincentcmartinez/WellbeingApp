package com.wellbeingapp

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.app.PendingIntent
import android.provider.Settings

class AppDetectionService : Service() {
    companion object {
        private const val TAG = "AppDetectionService"
        private const val CHANNEL_ID = "AppDetectionChannel"
        private const val NOTIFICATION_ID = 1
        
        private val SOCIAL_MEDIA_APPS = listOf(
            "com.instagram.android",
            "com.twitter.android", 
            "com.facebook.katana",
            "com.zhiliaoapp.musically",
            "com.snapchat.android",
            "com.google.android.youtube",
            // Add some common apps for testing on emulators
            "com.android.chrome",
            "com.google.android.gm", // Gmail
            "com.android.calculator2", // Calculator for easy testing
            "com.android.settings" // Settings - guaranteed to have launcher activity
        )
    }
    
    private lateinit var handler: Handler
    private lateinit var appDetectionRunnable: Runnable
    private lateinit var usageStatsManager: UsageStatsManager
    private var lastDetectedApp: String? = null
    private var lastDetectionTime: Long = 0
    private var activeIntentionApps: MutableSet<String> = mutableSetOf()
    private var gracePeriodApps: MutableMap<String, Long> = mutableMapOf() // package name -> end time
    
    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "AppDetectionService created")
        
        handler = Handler(Looper.getMainLooper())
        usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())
        
        startAppDetection()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "AppDetectionService started with action: ${intent?.action}")
        
        when (intent?.action) {
            "ADD_ACTIVE_INTENTION_APP" -> {
                val packageName = intent.getStringExtra("package_name")
                if (packageName != null) {
                    addActiveIntentionApp(packageName)
                }
            }
            "REMOVE_ACTIVE_INTENTION_APP" -> {
                val packageName = intent.getStringExtra("package_name")
                if (packageName != null) {
                    removeActiveIntentionApp(packageName)
                }
            }
            "ADD_GRACE_PERIOD_APP" -> {
                val packageName = intent.getStringExtra("package_name")
                if (packageName != null) {
                    addGracePeriodApp(packageName)
                }
            }
        }
        
        return START_STICKY
    }
    
    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "App Detection Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Monitors app usage for wellbeing breaks"
            }
            
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }
    
    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Wellbeing App Active")
            .setContentText("Monitoring app usage for mindful breaks")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
    
    private fun startAppDetection() {
        appDetectionRunnable = object : Runnable {
            override fun run() {
                checkForSocialMediaApps()
                handler.postDelayed(this, 1000) // Check every second
            }
        }
        handler.post(appDetectionRunnable)
    }
    
    private fun checkForSocialMediaApps() {
        val currentTime = System.currentTimeMillis()
        val startTime = currentTime - 5000 // Check last 5 seconds
        
        try {
            val usageEvents = usageStatsManager.queryEvents(startTime, currentTime)
            val event = UsageEvents.Event()
            
            var eventCount = 0
            while (usageEvents.hasNextEvent()) {
                usageEvents.getNextEvent(event)
                eventCount++
                
                if (event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                    val packageName = event.packageName
                    Log.v(TAG, "App moved to foreground: $packageName")
                    
                    if (SOCIAL_MEDIA_APPS.contains(packageName)) {
                        Log.d(TAG, "Found social media app: $packageName")
                        
                        // Check if this app is currently in an active intention session
                        if (activeIntentionApps.contains(packageName)) {
                            Log.d(TAG, "Ignoring $packageName - currently in active intention session")
                            return
                        }
                        
                        // Check if this app is in grace period (just launched back to)
                        val gracePeriodEndTime = gracePeriodApps[packageName]
                        if (gracePeriodEndTime != null && currentTime < gracePeriodEndTime) {
                            val remainingTime = (gracePeriodEndTime - currentTime) / 1000
                            Log.d(TAG, "Ignoring $packageName - in grace period (${remainingTime}s remaining)")
                            return
                        } else if (gracePeriodEndTime != null) {
                            // Grace period expired, remove from map
                            gracePeriodApps.remove(packageName)
                            Log.d(TAG, "Grace period expired for $packageName")
                        }
                        
                        // Prevent multiple detections of the same app in a short time
                        if (lastDetectedApp != packageName || currentTime - lastDetectionTime > 10000) {
                            Log.i(TAG, "🚨 Social media app detected: $packageName")
                            lastDetectedApp = packageName
                            lastDetectionTime = currentTime
                            
                            // Send event to React Native first
                            sendAppDetectionEvent(packageName, getAppDisplayName(packageName))
                            
                            // Then bring wellbeing app to foreground after a short delay
                            Handler(Looper.getMainLooper()).postDelayed({
                                bringWellbeingAppToForeground(packageName, getAppDisplayName(packageName))
                            }, 500) // 500ms delay
                        } else {
                            Log.d(TAG, "Recent detection for $packageName, skipping (last: ${currentTime - lastDetectionTime}ms ago)")
                        }
                    } else {
                        // Log Instagram specifically for debugging
                        if (packageName == "com.instagram.android") {
                            Log.w(TAG, "⚠️ Instagram detected but NOT in tracked list!")
                        }
                        // Log other social apps for debugging
                        if (packageName.contains("instagram") || packageName.contains("facebook") || packageName.contains("twitter")) {
                            Log.d(TAG, "Non-tracked social app detected: $packageName")
                        }
                    }
                }
            }
            
            if (eventCount == 0) {
                Log.v(TAG, "No usage events in last 5 seconds")
            } else {
                Log.v(TAG, "Processed $eventCount usage events")
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error checking for social media apps", e)
        }
    }
    
    private fun bringWellbeingAppToForeground(packageName: String = "", appName: String = "") {
        try {
            Log.d(TAG, "Bringing wellbeing app to foreground for detected app: $appName")
            
            // Method 1: Use persistent overlay service (most reliable and persistent)
            Log.d(TAG, "Trying Method 1: Persistent Overlay Service approach")
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && android.provider.Settings.canDrawOverlays(this)) {
                    val persistentOverlayIntent = Intent(this, PersistentOverlayService::class.java).apply {
                        putExtra(PersistentOverlayService.EXTRA_APP_NAME, appName)
                        putExtra(PersistentOverlayService.EXTRA_PACKAGE_NAME, packageName)
                    }
                    startService(persistentOverlayIntent)
                    Log.d(TAG, "Successfully started persistent overlay service")
                    return // Exit early if overlay worked
                } else {
                    Log.d(TAG, "Overlay permission not granted, trying other methods")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error starting persistent overlay service", e)
            }
            
            // Method 2: Fallback to regular overlay activity
            Log.d(TAG, "Trying Method 2: Regular Overlay Activity approach")
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && android.provider.Settings.canDrawOverlays(this)) {
                    val overlayIntent = Intent(this, OverlayActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or 
                                Intent.FLAG_ACTIVITY_CLEAR_TOP or 
                                Intent.FLAG_ACTIVITY_SINGLE_TOP or
                                Intent.FLAG_ACTIVITY_NO_ANIMATION
                        putExtra(OverlayActivity.EXTRA_APP_NAME, appName)
                        putExtra(OverlayActivity.EXTRA_PACKAGE_NAME, packageName)
                    }
                    startActivity(overlayIntent)
                    Log.d(TAG, "Successfully launched regular overlay activity")
                    return // Exit early if overlay worked
                } else {
                    Log.d(TAG, "Overlay permission not granted, trying other methods")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error launching overlay activity", e)
            }
            
            // Method 3: Full-screen notification with better implementation
            Log.d(TAG, "Trying Method 3: Improved full-screen notification")
            try {
                val fullScreenIntent = Intent(this, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or 
                            Intent.FLAG_ACTIVITY_CLEAR_TOP or 
                            Intent.FLAG_ACTIVITY_SINGLE_TOP or
                            Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED
                    action = Intent.ACTION_MAIN
                    addCategory(Intent.CATEGORY_LAUNCHER)
                    putExtra("detected_app_name", appName)
                    putExtra("detected_package_name", packageName)
                }
                
                val fullScreenPendingIntent = PendingIntent.getActivity(
                    this, 
                    1003, 
                    fullScreenIntent, 
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                
                // Create high priority notification channel for full screen
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    val fullScreenChannel = android.app.NotificationChannel(
                        "FULLSCREEN_CHANNEL",
                        "Wellbeing Full Screen",
                        android.app.NotificationManager.IMPORTANCE_HIGH
                    ).apply {
                        description = "Shows full screen wellbeing notifications"
                        setBypassDnd(true)
                        lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
                    }
                    val notificationManager = getSystemService(android.app.NotificationManager::class.java)
                    notificationManager?.createNotificationChannel(fullScreenChannel)
                }
                
                val fullScreenNotification = NotificationCompat.Builder(this, "FULLSCREEN_CHANNEL")
                    .setContentTitle("🧘‍♀️ Wellbeing Break Time")
                    .setContentText("Take a mindful break from $appName")
                    .setSmallIcon(android.R.drawable.ic_dialog_info)
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setCategory(NotificationCompat.CATEGORY_ALARM)
                    .setAutoCancel(false)
                    .setOngoing(true)
                    .setFullScreenIntent(fullScreenPendingIntent, true)
                    .setContentIntent(fullScreenPendingIntent)
                    .build()
                
                val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
                notificationManager.notify(1003, fullScreenNotification)
                Log.d(TAG, "Sent improved full-screen notification")
                
            } catch (e: Exception) {
                Log.e(TAG, "Error creating full-screen notification", e)
            }
            
            // Method 4: Direct MainActivity launch (backup)
            Log.d(TAG, "Trying Method 4: Direct MainActivity launch")
            try {
                val mainActivityIntent = Intent(this, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or 
                            Intent.FLAG_ACTIVITY_CLEAR_TOP or 
                            Intent.FLAG_ACTIVITY_SINGLE_TOP or
                            Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED
                    action = Intent.ACTION_MAIN
                    addCategory(Intent.CATEGORY_LAUNCHER)
                    putExtra("detected_app_name", appName)
                    putExtra("detected_package_name", packageName)
                }
                
                startActivity(mainActivityIntent)
                Log.d(TAG, "Launched MainActivity directly")
            } catch (e: Exception) {
                Log.e(TAG, "Error launching MainActivity", e)
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error bringing app to foreground", e)
        }
    }
    
    private fun getAppDisplayName(packageName: String): String {
        return when (packageName) {
            "com.instagram.android" -> "Instagram"
            "com.twitter.android" -> "X (Twitter)"
            "com.facebook.katana" -> "Facebook"
            "com.zhiliaoapp.musically" -> "TikTok"
            "com.snapchat.android" -> "Snapchat"
            "com.google.android.youtube" -> "YouTube"
            else -> packageName
        }
    }
    
    private fun sendAppDetectionEvent(packageName: String, appName: String) {
        try {
            val reactContext = MainApplication.getReactApplicationContext()
            reactContext?.let { context ->
                context
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onSocialMediaAppDetected", 
                        "{\"packageName\":\"$packageName\",\"appName\":\"$appName\"}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error sending app detection event", e)
        }
    }
    
    fun addActiveIntentionApp(packageName: String) {
        activeIntentionApps.add(packageName)
        Log.d(TAG, "Added $packageName to active intention apps: $activeIntentionApps")
    }
    
    fun removeActiveIntentionApp(packageName: String) {
        activeIntentionApps.remove(packageName)
        Log.d(TAG, "Removed $packageName from active intention apps: $activeIntentionApps")
    }
    
    fun addGracePeriodApp(packageName: String) {
        val gracePeriodDuration = 45000L // 45 seconds grace period
        val endTime = System.currentTimeMillis() + gracePeriodDuration
        gracePeriodApps[packageName] = endTime
        Log.d(TAG, "🛡️ Added $packageName to grace period (45 seconds)")
    }
    
    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "AppDetectionService destroyed")
        
        if (::handler.isInitialized && ::appDetectionRunnable.isInitialized) {
            handler.removeCallbacks(appDetectionRunnable)
        }
    }
} 