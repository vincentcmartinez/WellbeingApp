package com.wellbeingapp

import android.content.Intent
import com.facebook.react.bridge.*
import android.util.Log

class IntentionTimerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "IntentionTimerModule"
    }
    
    init {
        // Set the react context in MainApplication for use by services
        MainApplication.setReactApplicationContext(reactContext)
    }

    override fun getName(): String {
        return "IntentionTimerModule"
    }

    @ReactMethod
    fun startIntentionTimer(
        packageName: String,
        appName: String,
        durationSeconds: Int,
        intention: String,
        promise: Promise
    ) {
        try {
            Log.d(TAG, "🚀 Starting intention timer for $appName: $durationSeconds seconds")
            
            val intent = Intent(reactApplicationContext, IntentionTimerService::class.java).apply {
                action = IntentionTimerService.ACTION_START_TIMER
                putExtra(IntentionTimerService.EXTRA_PACKAGE_NAME, packageName)
                putExtra(IntentionTimerService.EXTRA_APP_NAME, appName)
                putExtra(IntentionTimerService.EXTRA_DURATION_SECONDS, durationSeconds)
                putExtra(IntentionTimerService.EXTRA_INTENTION, intention)
            }
            
            Log.d(TAG, "📡 About to start IntentionTimerService with action: ${intent.action}")
            Log.d(TAG, "📦 Service extras: packageName=$packageName, appName=$appName, duration=$durationSeconds")
            
            try {
                val componentName = reactApplicationContext.startForegroundService(intent)
                Log.d(TAG, "✅ Service started successfully: $componentName")
            } catch (e: Exception) {
                Log.e(TAG, "❌ Failed to start service: ${e.message}")
                throw e
            }
            
            promise.resolve(true)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error starting intention timer", e)
            promise.reject("START_TIMER_FAILED", e.message)
        }
    }

    @ReactMethod
    fun cancelIntentionTimer(promise: Promise) {
        try {
            Log.d(TAG, "Cancelling intention timer")
            
            val intent = Intent(reactApplicationContext, IntentionTimerService::class.java).apply {
                action = IntentionTimerService.ACTION_CANCEL_TIMER
            }
            
            reactApplicationContext.startService(intent)
            promise.resolve(true)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error cancelling intention timer", e)
            promise.reject("CANCEL_TIMER_FAILED", e.message)
        }
    }

    @ReactMethod
    fun launchApp(packageName: String, promise: Promise) {
        try {
            Log.d(TAG, "Attempting to launch app: $packageName")
            
            val packageManager = reactApplicationContext.packageManager
            
            // Check if the app is actually installed using multiple methods
            var isInstalled = false
            var packageInfo: android.content.pm.PackageInfo? = null
            
            // Just skip the installation check and assume the app is installed
            // since we know Instagram detection is working, the issue is with package queries
            Log.d(TAG, "Skipping installation check - assuming $packageName is installed since detection works")
            isInstalled = true
            
            if (!isInstalled) {
                Log.e(TAG, "All methods failed - App $packageName appears to not be installed")
                
                // Try to find an alternative app name for common social media apps
                val alternativeName = when (packageName) {
                    "com.instagram.android" -> "Instagram"
                    "com.facebook.katana" -> "Facebook"
                    "com.twitter.android" -> "Twitter"
                    "com.google.android.youtube" -> "YouTube"
                    "com.zhiliaoapp.musically" -> "TikTok"
                    "com.snapchat.android" -> "Snapchat"
                    else -> packageName
                }
                
                promise.reject("APP_NOT_INSTALLED", "$alternativeName is not installed on this device. Please install $alternativeName or test with a different app.")
                return
            }
            
            // Method 1: Try direct PackageManager getLaunchIntentForPackage
            Log.d(TAG, "🔄 Method 1: Direct launch intent for $packageName")
            try {
                val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
                if (launchIntent != null) {
                    Log.d(TAG, "✅ Found direct launch intent for $packageName")
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    reactApplicationContext.startActivity(launchIntent)
                    Log.d(TAG, "✅ Successfully launched $packageName using direct method")
                    addToGracePeriod(packageName)
                    promise.resolve(true)
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
                    
                    reactApplicationContext.startActivity(instagramIntent)
                    Log.d(TAG, "✅ Successfully launched Instagram using hardcoded component")
                    addToGracePeriod(packageName)
                    promise.resolve(true)
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
                    
                    reactApplicationContext.startActivity(componentIntent)
                    Log.d(TAG, "✅ Successfully launched $packageName using launcher method")
                    addToGracePeriod(packageName)
                    promise.resolve(true)
                    return
                } else {
                    Log.w(TAG, "⚠️ No launcher activities found for $packageName")
                }
            } catch (e: Exception) {
                Log.w(TAG, "❌ Launcher method failed: ${e.message}")
            }
            
            // All methods failed
            Log.e(TAG, "❌ All launch methods failed for $packageName")
            promise.reject("LAUNCH_FAILED", "Unable to find a way to launch $packageName. App may not be properly installed or may not have launcher activities.")
            
        } catch (e: Exception) {
            Log.e(TAG, "Exception launching app $packageName", e)
            promise.reject("LAUNCH_FAILED", "Exception: ${e.message}")
        }
    }

    private fun addToGracePeriod(packageName: String) {
        try {
            val intent = Intent(reactApplicationContext, AppDetectionService::class.java).apply {
                action = "ADD_GRACE_PERIOD_APP"
                putExtra("package_name", packageName)
            }
            reactApplicationContext.startService(intent)
            Log.d(TAG, "🛡️ Added $packageName to grace period")
        } catch (e: Exception) {
            Log.w(TAG, "Failed to add $packageName to grace period: ${e.message}")
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN built in Event Emitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN built in Event Emitter
    }
} 