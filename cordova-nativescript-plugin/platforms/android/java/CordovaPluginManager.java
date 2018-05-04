package org.apache.cordova;

import android.util.Log;
import android.content.Intent;
import java.lang.reflect.Method;
import org.json.JSONArray;

import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.content.pm.PackageManager;
import java.lang.reflect.Field;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.HashMap;
import java.lang.IllegalArgumentException;
import java.io.File;

public class CordovaPluginManager {
	private final String TAG = "CordovaPluginManager";
	private CordovaInterfaceImpl cordovaInterfaceImpl;
	private Map<String, PluginEntry> pluginsMap;

	public CordovaPluginManager() {
		

		Log.w(TAG, "Instantiated CordovaPluginManager");
	}

	public void exec(String serviceName, String actionName, JSONArray actionArgs, CallbackContext callbackContext) throws Exception {
		if (!this.getPluginsMap().containsKey(serviceName)) {
			throw new IllegalArgumentException("Key " + serviceName + " not found in plugins map. Make sure to declare it as a feature in plugin.xml");
		}
		Class<?> c = Class.forName(this.getPluginsMap().get(serviceName).pluginClass);
		Object instance = c.newInstance();
		Method privateInitializeMethod = instance.getClass().getMethod("privateInitialize", String.class, CordovaInterface.class, CordovaWebView.class, CordovaPreferences.class);
		privateInitializeMethod.invoke(instance, serviceName, this.getCordovaInterfaceImpl(), null, null);
		Method method = instance.getClass().getMethod("execute", String.class, JSONArray.class, CallbackContext.class);
		method.invoke(instance, actionName, actionArgs, callbackContext);
	}

	public void onActivityResult(int requestCode, int resultCode, Intent data) throws Exception {
		this.getCordovaInterfaceImpl().onActivityResult(requestCode, resultCode, data);
	}

	public CordovaInterfaceImpl getCordovaInterfaceImpl() {
		if (this.cordovaInterfaceImpl == null) {
			this.cordovaInterfaceImpl = new CordovaInterfaceImpl(this.getActivity());
		}

		return this.cordovaInterfaceImpl;
	}

	public Activity getActivity() {
		try {
			Class activityThreadClass = Class.forName("android.app.ActivityThread");
			Object activityThread = activityThreadClass.getMethod("currentActivityThread").invoke(null);
			Field activitiesField = activityThreadClass.getDeclaredField("mActivities");
			activitiesField.setAccessible(true);

			Map<Object, Object> activities = (Map<Object, Object>) activitiesField.get(activityThread);
			if (activities == null)
				return null;

			for (Object activityRecord : activities.values()) {
				Class activityRecordClass = activityRecord.getClass();
				Field pausedField = activityRecordClass.getDeclaredField("paused");
				pausedField.setAccessible(true);
				if (!pausedField.getBoolean(activityRecord)) {
					Field activityField = activityRecordClass.getDeclaredField("activity");
					activityField.setAccessible(true);
					Activity activity = (Activity) activityField.get(activityRecord);
					return activity;
				}
			}
		} catch (Exception e) {

		}

		return null;
	}

	private Map<String, PluginEntry> getPluginsMap() {
		if (this.pluginsMap == null) {
			ConfigXmlParser configParser = new ConfigXmlParser();
			configParser.parse(this.getActivity());
			this.pluginsMap = new HashMap();
			for (PluginEntry pluginEntry : configParser.getPluginEntries()) {
				this.pluginsMap.put(pluginEntry.service, pluginEntry);
			}
		}

		return this.pluginsMap;
	}
}
