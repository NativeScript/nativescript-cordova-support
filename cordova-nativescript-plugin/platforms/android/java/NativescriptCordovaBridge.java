
package org.apache.cordova;

import org.apache.cordova.PluginResult;

public interface NativescriptCordovaBridge{
    void sendPluginResult(PluginResult pluginResult, String callbackId);
}
