package com.wellbeingapp

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.view.WindowManager
import android.util.Log

class OverlayActivity : Activity() {
    companion object {
        private const val TAG = "OverlayActivity"
        const val EXTRA_APP_NAME = "app_name"
        const val EXTRA_PACKAGE_NAME = "package_name"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        Log.d(TAG, "OverlayActivity created")
        
        // Set window flags to display over other apps
        window.setFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        )

        // Get the app info from intent
        val appName = intent.getStringExtra(EXTRA_APP_NAME) ?: "Social Media App"
        val packageName = intent.getStringExtra(EXTRA_PACKAGE_NAME) ?: ""
        
        Log.d(TAG, "Overlay for app: $appName ($packageName)")
        
        // Immediately launch the main activity
        val mainIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or 
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or 
                    Intent.FLAG_ACTIVITY_SINGLE_TOP or
                    Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED
            putExtra(EXTRA_APP_NAME, appName)
            putExtra(EXTRA_PACKAGE_NAME, packageName)
        }
        
        startActivity(mainIntent)
        finish()
    }
} 