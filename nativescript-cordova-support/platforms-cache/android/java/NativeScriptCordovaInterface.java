package org.apache.cordova;

import java.util.ArrayList;

import org.json.JSONException;
import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import org.apache.cordova.NativescriptCordovaBridge;

public class NativeScriptCordovaInterface {
    private static String TAG = "NativeScriptCordovaInterface";

    private final CordovaInterfaceImpl cordovaInterface;
    private final CordovaWebView cordovaWebView;
    private final PluginManager pluginManager;
    private boolean keepRunning = true;

    public NativeScriptCordovaInterface(Activity activity, NativescriptCordovaBridge nativescriptCordovaBridge) {
        this.cordovaInterface = new CordovaInterfaceImpl(activity);
        this.cordovaWebView = new CordovaWebViewImpl(activity, nativescriptCordovaBridge);
        ConfigXmlParser configParser = new ConfigXmlParser();
        configParser.parse(activity);
        ArrayList<PluginEntry> pluginEntries = configParser.getPluginEntries();
        CordovaPreferences preferences = configParser.getPreferences();
        this.cordovaWebView.init(cordovaInterface, pluginEntries, preferences);
        this.pluginManager = this.cordovaWebView.getPluginManager();
        this.cordovaInterface.onCordovaInit(pluginManager);
        this.keepRunning = preferences.getBoolean("KeepRunning", true);
    }

    // PluginManager
    public void exec(final String service, final String action, final String callbackId, final String rawArgs) {
        this.pluginManager.exec(service, action, callbackId, rawArgs);
    }

    // CordovaWebView
    /**
     * Called when the system is about to start resuming a previous activity.
     */
    public void onPause() {
        LOG.d(TAG, "Paused the activity.");
        // CB-9382 If there is an activity that started for result and main activity is waiting for callback
        // result, we shoudn't stop WebView Javascript timers, as activity for result might be using them
        boolean keepRunning = this.keepRunning || this.cordovaInterface.activityResultCallback != null;
        this.cordovaWebView.handlePause(keepRunning);

    }

    /**
     * Called when the activity receives a new intent
     */
    public void onNewIntent(Intent intent) {
            this.cordovaWebView.onNewIntent(intent);
    }

    /**
     * Called when the activity will start interacting with the user.
     */
    public void onResume() {
        LOG.d(TAG, "Resumed the activity.");
        this.cordovaWebView.handleResume(this.keepRunning);
    }

    /**
     * Called when the activity is no longer visible to the user.
     */
    public void onStop() {
        LOG.d(TAG, "Stopped the activity.");
        this.cordovaWebView.handleStop();
    }

    /**
     * Called when the activity is becoming visible to the user.
     */
    public void onStart() {
        LOG.d(TAG, "Started the activity.");
        this.cordovaWebView.handleStart();
    }

    /**
     * The final call you receive before your activity is destroyed.
     */
    public void onDestroy() {
        LOG.d(TAG, "CordovaActivity.onDestroy()");
        this.cordovaWebView.handleDestroy();
    }

    // CordovaInterface
    public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
        try {
            cordovaInterface.onRequestPermissionResult(requestCode, permissions, grantResults);
        } catch (JSONException e) {
            LOG.d(TAG, "JSONException: Parameters fed into the method are not valid");
            e.printStackTrace();
        }
    }

    public void onSaveInstanceState(Bundle outState) {
        cordovaInterface.onSaveInstanceState(outState);
    }

    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        LOG.d(TAG, "Incoming Result. Request code = " + requestCode);
        cordovaInterface.onActivityResult(requestCode, resultCode, intent);
    }

    public void startActivityForResult(Intent intent, int requestCode, Bundle options) {
        // Capture requestCode here so that it is captured in the setActivityResultCallback() case.
        cordovaInterface.setActivityResultRequestCode(requestCode);
    }
}
