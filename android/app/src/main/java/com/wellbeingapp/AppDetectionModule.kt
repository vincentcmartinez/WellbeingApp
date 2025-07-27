package com.wellbeingapp

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.os.Process
import android.provider.Settings
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.util.Log
import android.net.Uri
import android.os.Build
import android.os.PowerManager

class AppDetectionModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "AppDetectionModule"
    }

    override fun getName(): String {
        return "AppDetectionModule"
    }

    @ReactMethod
    fun startAppDetection(promise: Promise) {
        try {
            if (!hasUsageStatsPermission()) {
                promise.reject("PERMISSION_DENIED", "Usage stats permission not granted")
                return
            }

            val intent = Intent(reactApplicationContext, AppDetectionService::class.java)
            reactApplicationContext.startForegroundService(intent)
            
            // Set the React context for the service to use
            MainApplication.setReactApplicationContext(reactApplicationContext)
            
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error starting app detection", e)
            promise.reject("START_FAILED", e.message)
        }
    }

    @ReactMethod
    fun stopAppDetection(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, AppDetectionService::class.java)
            reactApplicationContext.stopService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping app detection", e)
            promise.reject("STOP_FAILED", e.message)
        }
    }

    @ReactMethod
    fun hasUsageStatsPermission(promise: Promise) {
        promise.resolve(hasUsageStatsPermission())
    }

    @ReactMethod
    fun requestUsageStatsPermission(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error requesting usage stats permission", e)
            promise.reject("REQUEST_FAILED", e.message)
        }
    }

    @ReactMethod
    fun hasOverlayPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(reactApplicationContext))
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun requestOverlayPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION).apply {
                    data = Uri.parse("package:${reactApplicationContext.packageName}")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                reactApplicationContext.startActivity(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error requesting overlay permission", e)
            promise.reject("REQUEST_FAILED", e.message)
        }
    }

    @ReactMethod
    fun isBatteryOptimizationDisabled(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val powerManager = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
            promise.resolve(powerManager.isIgnoringBatteryOptimizations(reactApplicationContext.packageName))
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun requestDisableBatteryOptimization(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:${reactApplicationContext.packageName}")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                reactApplicationContext.startActivity(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error requesting battery optimization disable", e)
            promise.reject("REQUEST_FAILED", e.message)
        }
    }

    private fun hasUsageStatsPermission(): Boolean {
        val appOps = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(),
            reactApplicationContext.packageName
        )
        return mode == AppOpsManager.MODE_ALLOWED
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN built in Event Emitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN built in Event Emitter
    }

    override fun getConstants(): Map<String, Any>? {
        return mapOf(
            "SOCIAL_MEDIA_APPS" to listOf(
                "com.instagram.android",
                "com.twitter.android",
                "com.facebook.katana",
                "com.zhiliaoapp.musically",
                "com.snapchat.android"
            )
        )
    }
} 