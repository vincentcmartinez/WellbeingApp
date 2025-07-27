package com.wellbeingapp

import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.core.content.ContextCompat

class PersistentOverlayService : Service() {
    companion object {
        private const val TAG = "PersistentOverlayService"
        const val EXTRA_APP_NAME = "app_name"
        const val EXTRA_PACKAGE_NAME = "package_name"
        private const val OVERLAY_DURATION = 10000L // 10 seconds minimum display
    }

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var params: WindowManager.LayoutParams? = null
    private var overlayHandler: Handler? = null
    private var focusCheckRunnable: Runnable? = null
    private var detectedAppName: String = ""
    private var detectedPackageName: String = ""
    private var overlayStartTime: Long = 0

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "PersistentOverlayService created")
        overlayHandler = Handler(Looper.getMainLooper())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        detectedAppName = intent?.getStringExtra(EXTRA_APP_NAME) ?: "Social Media App"
        detectedPackageName = intent?.getStringExtra(EXTRA_PACKAGE_NAME) ?: ""
        
        Log.d(TAG, "Starting persistent overlay for: $detectedAppName")
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && Settings.canDrawOverlays(this)) {
            showPersistentOverlay()
            startFocusMonitoring()
        } else {
            Log.w(TAG, "Overlay permission not granted")
            stopSelf()
        }
        
        return START_NOT_STICKY
    }

    private fun showPersistentOverlay() {
        try {
            windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
            overlayStartTime = System.currentTimeMillis()

            // Create overlay view programmatically
            overlayView = createOverlayView()

            // Set up window parameters for maximum persistence
            val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE
            }

            params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                layoutFlag,
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.CENTER
                title = "Wellbeing Overlay"
            }

            windowManager?.addView(overlayView, params)
            Log.d(TAG, "Persistent overlay displayed")

        } catch (e: Exception) {
            Log.e(TAG, "Error showing persistent overlay", e)
            stopSelf()
        }
    }

    private fun createOverlayView(): View {
        // Create the overlay layout programmatically
        val context = this
        val density = resources.displayMetrics.density
        
        // Main container
        val mainLayout = android.widget.LinearLayout(context).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setBackgroundColor(ContextCompat.getColor(context, android.R.color.white))
            gravity = Gravity.CENTER
            setPadding((20 * density).toInt(), (40 * density).toInt(), (20 * density).toInt(), (40 * density).toInt())
        }

        // Title
        val titleText = TextView(context).apply {
            text = "Wellbeing Break"
            textSize = 24f
            setTextColor(ContextCompat.getColor(context, android.R.color.black))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, (20 * density).toInt())
        }

        // Message
        val messageText = TextView(context).apply {
            text = "Take a moment before opening $detectedAppName\n\nThis screen will stay visible for at least 10 seconds to help you make a mindful choice about your app usage."
            textSize = 16f
            setTextColor(ContextCompat.getColor(context, android.R.color.black))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, (30 * density).toInt())
        }

        // Continue button
        val continueButton = Button(context).apply {
            text = "Continue to $detectedAppName"
            textSize = 16f
            setPadding((20 * density).toInt(), (15 * density).toInt(), (20 * density).toInt(), (15 * density).toInt())
            setOnClickListener {
                Log.d(TAG, "User chose to continue to $detectedAppName")
                dismissOverlay()
            }
        }

        // Take break button
        val breakButton = Button(context).apply {
            text = "Take a Wellbeing Break"
            textSize = 16f
            setPadding((20 * density).toInt(), (15 * density).toInt(), (20 * density).toInt(), (15 * density).toInt())
            setBackgroundColor(ContextCompat.getColor(context, android.R.color.darker_gray))
            setOnClickListener {
                Log.d(TAG, "User chose to take a wellbeing break")
                openWellbeingApp()
            }
        }

        // Timer text
        val timerText = TextView(context).apply {
            text = "Minimum display time: 10 seconds"
            textSize = 12f
            setTextColor(ContextCompat.getColor(context, android.R.color.darker_gray))
            gravity = Gravity.CENTER
            setPadding(0, (20 * density).toInt(), 0, 0)
        }

        // Add views to layout
        mainLayout.addView(titleText)
        mainLayout.addView(messageText)
        mainLayout.addView(continueButton)
        mainLayout.addView(breakButton)
        mainLayout.addView(timerText)

        return mainLayout
    }

    private fun startFocusMonitoring() {
        focusCheckRunnable = object : Runnable {
            override fun run() {
                try {
                    val currentTime = System.currentTimeMillis()
                    
                    // Check if minimum display time has passed
                    if (currentTime - overlayStartTime >= OVERLAY_DURATION) {
                        Log.d(TAG, "Minimum display time reached - allowing normal dismissal")
                        return
                    }

                    // Check if overlay is still visible
                    if (overlayView != null && overlayView?.isShown == false) {
                        Log.d(TAG, "Overlay was dismissed prematurely, re-showing...")
                        try {
                            // Re-show the overlay if it was dismissed
                            overlayView?.let { view ->
                                if (view.parent == null) {
                                    windowManager?.addView(view, params)
                                }
                            }
                        } catch (e: Exception) {
                            Log.e(TAG, "Error re-showing overlay", e)
                        }
                    }

                    // Continue monitoring
                    overlayHandler?.postDelayed(this, 1000) // Check every second
                } catch (e: Exception) {
                    Log.e(TAG, "Error in focus monitoring", e)
                }
            }
        }
        overlayHandler?.post(focusCheckRunnable!!)
    }

    private fun openWellbeingApp() {
        try {
            val intent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or 
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or 
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("from_overlay", true)
                putExtra("detected_app_name", detectedAppName)
                putExtra("detected_package_name", detectedPackageName)
            }
            startActivity(intent)
            dismissOverlay()
        } catch (e: Exception) {
            Log.e(TAG, "Error opening wellbeing app", e)
        }
    }

    private fun dismissOverlay() {
        try {
            overlayView?.let { view ->
                windowManager?.removeView(view)
                overlayView = null
            }
            stopSelf()
            Log.d(TAG, "Overlay dismissed")
        } catch (e: Exception) {
            Log.e(TAG, "Error dismissing overlay", e)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "PersistentOverlayService destroyed")
        
        focusCheckRunnable?.let { runnable ->
            overlayHandler?.removeCallbacks(runnable)
        }
        
        dismissOverlay()
    }

    override fun onBind(intent: Intent?): IBinder? = null
} 