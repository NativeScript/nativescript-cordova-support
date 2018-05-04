
package org.apache.cordova;

import org.apache.cordova.PluginResult;

public interface PluginResultCalllback{
    void sendPluginResult(PluginResult pluginResult, String callbackId);
}
