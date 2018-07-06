/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
*/
package org.apache.cordova;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.app.Activity;
import android.net.Uri;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebChromeClient;
import android.widget.FrameLayout;

import org.apache.cordova.NativescriptCordovaBridge;
import org.apache.cordova.engine.SystemWebViewEngine;
import org.json.JSONException;
import org.json.JSONObject;
import java.lang.reflect.Constructor;
import java.lang.UnsupportedOperationException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Main class for interacting with a Cordova webview. Manages plugins, events, and a CordovaWebViewEngine.
 * Class uses two-phase initialization. You must call init() before calling any other methods.
 */
public class CordovaWebViewImpl implements CordovaWebView {

    public static final String TAG = "CordovaWebViewImpl";

    private PluginManager pluginManager;
    private Context context;
    private NativescriptCordovaBridge nativescriptCordovaBridge;
    private CordovaInterface cordova;
    private CordovaResourceApi resourceApi;
    private CordovaPreferences preferences;

    public static CordovaWebViewEngine createEngine(Context context, CordovaPreferences preferences) {
        throw new UnsupportedOperationException();
    }

    public CordovaWebViewImpl(Context context, NativescriptCordovaBridge nativescriptCordovaBridge) {
        this.context = context;
        this.nativescriptCordovaBridge = nativescriptCordovaBridge;
    }

    // Convenience method for when creating programmatically (not from Config.xml).
    public void init(CordovaInterface cordova) {
        init(cordova, new ArrayList<PluginEntry>(), new CordovaPreferences());
    }


    @Override
    public void init(CordovaInterface cordova, List<PluginEntry> pluginEntries, CordovaPreferences preferences) {
        if (this.cordova != null) {
            throw new IllegalStateException();
        }

        this.cordova = cordova;
        this.preferences = preferences;
        this.pluginManager = new PluginManager(this, this.cordova, pluginEntries);
        this.resourceApi = new CordovaResourceApi(this.context, pluginManager);

        this.pluginManager.init();
    }

    @Override
    public boolean isInitialized() {
        return cordova != null;
    }

    @Override
    public void loadUrlIntoView(final String url, boolean recreatePlugins) {
        throw new UnsupportedOperationException();
    }


    @Override
    public void loadUrl(String url) {
        loadUrlIntoView(url, true);
    }

    @Override
    public void showWebPage(String url, boolean openExternal, boolean clearHistory, Map<String, Object> params) {
        throw new UnsupportedOperationException();
    }

    @Override
    @Deprecated
    public void showCustomView(View view, WebChromeClient.CustomViewCallback callback) {
        throw new UnsupportedOperationException();
    }

    @Override
    @Deprecated
    public void hideCustomView() {
        throw new UnsupportedOperationException();
    }

    @Override
    @Deprecated
    public boolean isCustomViewShowing() {
        throw new UnsupportedOperationException();
    }

    @Override
    @Deprecated
    public void sendJavascript(String statement) {
        throw new UnsupportedOperationException();
    }

    @Override
    public void sendPluginResult(PluginResult cr, String callbackId) {
        nativescriptCordovaBridge.sendPluginResult(cr, callbackId);
    }

    @Override
    public PluginManager getPluginManager() {
        return pluginManager;
    }
    @Override
    public CordovaPreferences getPreferences() {
        return preferences;
    }
    @Override
    public ICordovaCookieManager getCookieManager() {
        throw new UnsupportedOperationException();
    }
    @Override
    public CordovaResourceApi getResourceApi() {
        return resourceApi;
    }
    @Override
    public CordovaWebViewEngine getEngine() {
        throw new UnsupportedOperationException();
    }
    @Override
    public View getView() {
        throw new UnsupportedOperationException();
    }
    @Override
    public Context getContext() {
       return this.context;
    }

    private void sendJavascriptEvent(String event) {
        throw new UnsupportedOperationException();
    }

    @Override
    public void setButtonPlumbedToJs(int keyCode, boolean override) {
        throw new UnsupportedOperationException();
    }

    @Override
    public boolean isButtonPlumbedToJs(int keyCode) {
        throw new UnsupportedOperationException();
    }

    @Override
    public Object postMessage(String id, Object data) {
        return pluginManager.postMessage(id, data);
    }

    // Engine method proxies:
    @Override
    public String getUrl() {
        throw new UnsupportedOperationException();
    }

    @Override
    public void stopLoading() {
        throw new UnsupportedOperationException();
    }

    @Override
    public boolean canGoBack() {
        throw new UnsupportedOperationException();
    }

    @Override
    public void clearCache() {
        throw new UnsupportedOperationException();
    }

    @Override
    @Deprecated
    public void clearCache(boolean b) {
        throw new UnsupportedOperationException();
    }

    @Override
    public void clearHistory() {
        throw new UnsupportedOperationException();
    }

    @Override
    public boolean backHistory() {
        throw new UnsupportedOperationException();
    }

    /////// LifeCycle methods ///////
    @Override
    public void onNewIntent(Intent intent) {
        if (this.pluginManager != null) {
            this.pluginManager.onNewIntent(intent);
        }
    }
    @Override
    public void handlePause(boolean keepRunning) {
        if (!isInitialized()) {
            return;
        }

        pluginManager.onPause(keepRunning);
    }
    @Override
    public void handleResume(boolean keepRunning) {
        if (!isInitialized()) {
            return;
        }

        this.pluginManager.onResume(keepRunning);
    }
    @Override
    public void handleStart() {
        if (!isInitialized()) {
            return;
        }
        pluginManager.onStart();
    }
    @Override
    public void handleStop() {
        if (!isInitialized()) {
            return;
        }
        pluginManager.onStop();
    }
    @Override
    public void handleDestroy() {
        if (!isInitialized()) {
            return;
        }

       // Forward to plugins
       this.pluginManager.onDestroy();
    }
}
