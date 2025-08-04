package com.wellbeingapp

import android.content.Intent
import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule

class MainActivity : ReactActivity() {

  companion object {
    private const val TAG = "MainActivity"
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "wellbeingapp"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    handleIntent(intent)
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    if (intent != null) {
      setIntent(intent)
      handleIntent(intent)
    }
  }

  private fun handleIntent(intent: Intent?) {
    try {
      Log.d(TAG, "HandleIntent called with intent: $intent")
      intent?.let {
        Log.d(TAG, "Intent extras: ${it.extras?.keySet()}")
        
        when {
          // Handle timer completion
          it.getBooleanExtra("timer_complete", false) -> {
            val appName = it.getStringExtra("app_name") ?: ""
            val intention = it.getStringExtra("intention") ?: ""
            val packageName = it.getStringExtra("package_name") ?: ""
            
            Log.d(TAG, "Timer completion detected for $appName")
            
            // Send event to React Native to trigger the completion flow
            val reactContext = MainApplication.getReactApplicationContext()
            if (reactContext != null) {
              Log.d(TAG, "React context available, sending timer complete event")
              reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                  .emit("onIntentionTimerComplete", 
                      "{\"packageName\":\"$packageName\",\"appName\":\"$appName\",\"intention\":\"$intention\"}")
            } else {
              Log.w(TAG, "React context is null, cannot send timer complete event")
            }
          }
          
          // Handle app detection (existing functionality)
          it.hasExtra("detected_app_name") -> {
            val appName = it.getStringExtra("detected_app_name") ?: ""
            val packageName = it.getStringExtra("detected_package_name") ?: ""
            
            Log.d(TAG, "App detection from intent: $appName ($packageName)")
            
            // Send event to React Native
            val reactContext = MainApplication.getReactApplicationContext()
            if (reactContext != null) {
              Log.d(TAG, "React context available, sending app detection event")
              reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                  .emit("onSocialMediaAppDetected", 
                      "{\"packageName\":\"$packageName\",\"appName\":\"$appName\"}")
              Log.d(TAG, "App detection event sent successfully")
            } else {
              Log.w(TAG, "React context is null, cannot send app detection event")
            }
          }
          
          else -> {
            Log.d(TAG, "Intent does not match any known patterns")
          }
        }
      } ?: Log.d(TAG, "Intent is null")
    } catch (e: Exception) {
      Log.e(TAG, "Error handling intent", e)
    }
  }
}
