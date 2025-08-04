package com.wellbeingapp

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import android.util.Log
import android.app.PendingIntent
import android.content.pm.PackageManager
import android.net.Uri

class IntentionTimerService : Service() {
    companion object {
        private const val TAG = "IntentionTimerService"
        private const val CHANNEL_ID = "IntentionTimerChannel"
        private const val NOTIFICATION_ID = 2
        
        // Intent extras
        const val EXTRA_PACKAGE_NAME = "package_name"
        const val EXTRA_APP_NAME = "app_name"
        const val EXTRA_DURATION_SECONDS = "duration_seconds"
        const val EXTRA_INTENTION = "intention"
        
        // Actions
        const val ACTION_START_TIMER = "start_timer"
        const val ACTION_TIMER_COMPLETE = "timer_complete"
        const val ACTION_CANCEL_TIMER = "cancel_timer"
    }
    
    private lateinit var handler: Handler
    private var timerRunnable: Runnable? = null
    private var timeRemaining: Int = 0
    private var packageName: String = ""
    private var appName: String = ""
    private var intention: String = ""
    private var isTimerActive: Boolean = false
    
    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "🎯 IntentionTimerService created successfully")
        
        try {
            handler = Handler(Looper.getMainLooper())
            createNotificationChannel()
            Log.d(TAG, "✅ Service initialization completed")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Service initialization failed: ${e.message}")
            throw e
        }
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "🚀 IntentionTimerService onStartCommand called")
        Log.d(TAG, "📡 Intent action: ${intent?.action}")
        Log.d(TAG, "🔢 StartId: $startId, Flags: $flags")
        
        if (intent == null) {
            Log.w(TAG, "⚠️ Received null intent in onStartCommand")
            return START_NOT_STICKY
        }
        
        try {
            when (intent.action) {
                ACTION_START_TIMER -> {
                    Log.d(TAG, "🎯 Processing ACTION_START_TIMER")
                    val packageName = intent.getStringExtra(EXTRA_PACKAGE_NAME)
                    val appName = intent.getStringExtra(EXTRA_APP_NAME)
                    val durationSeconds = intent.getIntExtra(EXTRA_DURATION_SECONDS, 0)
                    val intention = intent.getStringExtra(EXTRA_INTENTION)
                    
                    Log.d(TAG, "📦 Extracted values: packageName=$packageName, appName=$appName, duration=$durationSeconds")
                    
                    if (packageName == null || appName == null) {
                        Log.e(TAG, "❌ Missing required extras: packageName=$packageName, appName=$appName")
                        return START_NOT_STICKY
                    }
                    
                    Log.d(TAG, "✅ About to call startTimer")
                    startTimer(packageName, appName, durationSeconds, intention ?: "")
                }
                ACTION_TIMER_COMPLETE -> {
                    Log.d(TAG, "🎯 Processing ACTION_TIMER_COMPLETE")
                    handleTimerComplete()
                }
                ACTION_CANCEL_TIMER -> {
                    Log.d(TAG, "🎯 Processing ACTION_CANCEL_TIMER")
                    cancelTimer()
                }
                else -> {
                    Log.w(TAG, "⚠️ Unknown action: ${intent.action}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Exception in onStartCommand: ${e.message}", e)
            return START_NOT_STICKY
        }
        
        Log.d(TAG, "✅ onStartCommand completed successfully")
        return START_STICKY
    }
    
    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
    
    private fun startTimer(packageName: String, appName: String, durationSeconds: Int, intention: String) {
        Log.d(TAG, "🎯 Starting timer for $appName: $durationSeconds seconds")
        Log.d(TAG, "🚀 CRITICAL: startTimer method called - service is working!")
        
        this.packageName = packageName
        this.appName = appName
        this.intention = intention
        this.timeRemaining = durationSeconds
        this.isTimerActive = true
        
        // Add to active intention apps to prevent interruption
        addToActiveIntentionApps(packageName)
        
        // Start foreground service with timer notification
        startForeground(NOTIFICATION_ID, createTimerNotification())
        
        // Launch the target app immediately, no delay
        Log.d(TAG, "🚀 About to call launchTargetApp for: $packageName")
        launchTargetApp(packageName)
        Log.d(TAG, "✅ launchTargetApp call completed")
        
        // Start the timer
        startTimerRunnable()
    }
    
    private fun startTimerRunnable() {
        timerRunnable = object : Runnable {
            override fun run() {
                if (timeRemaining > 0 && isTimerActive) {
                    timeRemaining--
                    
                    // Update notification with remaining time
                    updateTimerNotification()
                    
                    // Schedule next tick
                    handler.postDelayed(this, 1000)
                } else if (timeRemaining <= 0 && isTimerActive) {
                    // Timer completed
                    handleTimerComplete()
                }
            }
        }
        
        handler.post(timerRunnable!!)
    }
    
    private fun launchTargetApp(packageName: String) {
        try {
            Log.d(TAG, "🚀 Launching target app: $packageName")
            
            // Method 1: Try direct PackageManager getLaunchIntentForPackage
            Log.d(TAG, "🔄 Method 1: Direct launch intent for $packageName")
            try {
                val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
                if (launchIntent != null) {
                    Log.d(TAG, "✅ Found direct launch intent for $packageName")
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    startActivity(launchIntent)
                    Log.d(TAG, "✅ Successfully launched $packageName using direct method")
                    addToGracePeriod(packageName)
                    return
                } else {
                    Log.d(TAG, "⚠️ Direct launch intent returned null for $packageName")
                }
            } catch (e: Exception) {
                Log.w(TAG, "❌ Direct launch failed: ${e.message}")
            }
            
            // Method 2: Hardcoded Instagram launch (since we know the exact component)
            if (packageName == "com.instagram.android") {
                Log.d(TAG, "🔄 Method 2: Hardcoded Instagram launch")
                try {
                    val instagramIntent = Intent().apply {
                        action = Intent.ACTION_MAIN
                        addCategory(Intent.CATEGORY_LAUNCHER)
                        component = android.content.ComponentName(
                            "com.instagram.android",
                            "com.instagram.android.activity.MainTabActivity"
                        )
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    }
                    
                    startActivity(instagramIntent)
                    Log.d(TAG, "✅ Successfully launched Instagram using hardcoded component")
                    addToGracePeriod(packageName)
                    return
                } catch (e: Exception) {
                    Log.w(TAG, "❌ Hardcoded Instagram launch failed: ${e.message}")
                }
            }

            // Method 3: Try launcher intent with explicit package
            Log.d(TAG, "🔄 Method 3: Launcher intent with package for $packageName")
            try {
                val launcherIntent = Intent().apply {
                    action = Intent.ACTION_MAIN
                    addCategory(Intent.CATEGORY_LAUNCHER)
                    setPackage(packageName)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                }
                
                val resolveInfos = packageManager.queryIntentActivities(launcherIntent, 0)
                Log.d(TAG, "📋 Found ${resolveInfos.size} launcher activities for $packageName")
                
                if (resolveInfos.isNotEmpty()) {
                    val resolveInfo = resolveInfos[0]
                    val componentIntent = Intent().apply {
                        action = Intent.ACTION_MAIN
                        addCategory(Intent.CATEGORY_LAUNCHER)
                        component = android.content.ComponentName(
                            resolveInfo.activityInfo.packageName,
                            resolveInfo.activityInfo.name
                        )
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    }
                    
                    startActivity(componentIntent)
                    Log.d(TAG, "✅ Successfully launched $packageName using launcher method")
                    addToGracePeriod(packageName)
                    return
                } else {
                    Log.w(TAG, "⚠️ No launcher activities found for $packageName")
                }
            } catch (e: Exception) {
                Log.w(TAG, "❌ Launcher method failed: ${e.message}")
            }
            
            // All methods failed
            Log.e(TAG, "❌ All launch methods failed for $packageName")
            Log.w(TAG, "Trying alternative launch approach...")
            tryAlternativeLaunch(packageName)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error launching app $packageName", e)
            tryAlternativeLaunch(packageName)
        }
    }
    
    private fun tryAlternativeLaunch(packageName: String) {
        try {
            Log.d(TAG, "Trying alternative launch for $packageName")
            
            val intent = Intent(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_LAUNCHER)
                setPackage(packageName)
                addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK or 
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP or
                    Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED
                )
            }
            
            val resolveInfo = packageManager.queryIntentActivities(intent, 0)
            if (resolveInfo.isNotEmpty()) {
                val activityInfo = resolveInfo[0].activityInfo
                intent.setClassName(activityInfo.packageName, activityInfo.name)
                startActivity(intent)
                Log.d(TAG, "Alternative launch successful for $packageName")
            } else {
                Log.e(TAG, "No activities found for $packageName")
                // Try one more method with specific Instagram handling
                if (packageName == "com.instagram.android") {
                    tryInstagramSpecificLaunch()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Alternative launch failed for $packageName", e)
        }
    }
    
    private fun tryInstagramSpecificLaunch() {
        try {
            Log.d(TAG, "Trying Instagram-specific launch")
            val intent = Intent().apply {
                action = Intent.ACTION_MAIN
                addCategory(Intent.CATEGORY_LAUNCHER)
                component = android.content.ComponentName(
                    "com.instagram.android",
                    "com.instagram.mainactivity.MainActivity"
                )
                addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK or 
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
                )
            }
            startActivity(intent)
            Log.d(TAG, "Instagram-specific launch successful")
        } catch (e: Exception) {
            Log.e(TAG, "Instagram-specific launch failed", e)
        }
    }
    
    private fun handleTimerComplete() {
        Log.d(TAG, "Timer completed for $appName")
        
        isTimerActive = false
        timerRunnable?.let { handler.removeCallbacks(it) }
        
        // Remove from active intention apps
        removeFromActiveIntentionApps(packageName)
        
        // Send event to React Native
        sendTimerCompleteEvent()
        
        // Show completion notification
        showCompletionNotification()
        
        // Stop the service
        stopSelf()
    }
    
    private fun cancelTimer() {
        Log.d(TAG, "Cancelling timer for $appName")
        
        isTimerActive = false
        timerRunnable?.let { handler.removeCallbacks(it) }
        
        // Remove from active intention apps
        removeFromActiveIntentionApps(packageName)
        
        // Stop the service
        stopSelf()
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Intention Timer",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows active intention timer"
            }
            
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }
    
    private fun createTimerNotification(): Notification {
        val formatTime = formatTime(timeRemaining)
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("⏰ Intention Timer: $appName")
            .setContentText("$formatTime remaining")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }
    
    private fun updateTimerNotification() {
        val notification = createTimerNotification()
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, notification)
    }
    
    private fun showCompletionNotification() {
        // Create full screen intent to ensure user sees the completion
        val completeIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or 
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or 
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("timer_complete", true)
            putExtra("app_name", appName)
            putExtra("intention", intention)
            putExtra("package_name", packageName)
        }
        
        val pendingIntent = PendingIntent.getActivity(
            this,
            2001,
            completeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        // Create high priority notification channel for timer completion
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val completionChannel = NotificationChannel(
                "TIMER_COMPLETION_CHANNEL",
                "Timer Completion",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Shows when intention timer completes"
                setBypassDnd(true)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                enableVibration(true)
                enableLights(true)
            }
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager?.createNotificationChannel(completionChannel)
        }
        
        val completionNotification = NotificationCompat.Builder(this, "TIMER_COMPLETION_CHANNEL")
            .setContentTitle("⏰ Time's Up!")
            .setContentText("Your intention session for $appName has ended. Tap to review.")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setFullScreenIntent(pendingIntent, true)
            .setContentIntent(pendingIntent)
            .setVibrate(longArrayOf(0, 500, 200, 500))
            .setDefaults(Notification.DEFAULT_SOUND)
            .build()
        
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(2001, completionNotification)
        
        // Also try to bring the wellbeing app to foreground immediately
        try {
            startActivity(completeIntent)
        } catch (e: Exception) {
            Log.e(TAG, "Error launching completion activity", e)
        }
    }
    
    private fun formatTime(seconds: Int): String {
        val mins = seconds / 60
        val secs = seconds % 60
        return String.format("%d:%02d", mins, secs)
    }
    
    private fun sendTimerCompleteEvent() {
        try {
            val reactContext = MainApplication.getReactApplicationContext()
            reactContext?.let { context ->
                context
                    .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onIntentionTimerComplete", 
                        "{\"packageName\":\"$packageName\",\"appName\":\"$appName\",\"intention\":\"$intention\"}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error sending timer complete event", e)
        }
    }
    
    private fun addToActiveIntentionApps(packageName: String) {
        try {
            // Send intent to AppDetectionService to add this app to active intention apps
            val intent = Intent(this, AppDetectionService::class.java).apply {
                action = "ADD_ACTIVE_INTENTION_APP"
                putExtra("package_name", packageName)
            }
            startService(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Error adding to active intention apps", e)
        }
    }
    
    private fun removeFromActiveIntentionApps(packageName: String) {
        try {
            // Send intent to AppDetectionService to remove this app from active intention apps
            val intent = Intent(this, AppDetectionService::class.java).apply {
                action = "REMOVE_ACTIVE_INTENTION_APP"
                putExtra("package_name", packageName)
            }
            startService(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Error removing from active intention apps", e)
        }
    }
    
    private fun addToGracePeriod(packageName: String) {
        try {
            val intent = Intent(this, AppDetectionService::class.java).apply {
                action = "ADD_GRACE_PERIOD_APP"
                putExtra("package_name", packageName)
            }
            startService(intent)
            Log.d(TAG, "🛡️ Added $packageName to grace period")
        } catch (e: Exception) {
            Log.w(TAG, "Failed to add $packageName to grace period: ${e.message}")
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "IntentionTimerService destroyed")
        
        if (isTimerActive) {
            timerRunnable?.let { handler.removeCallbacks(it) }
        }
    }
} 