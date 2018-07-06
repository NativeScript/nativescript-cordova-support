# nativescript-cordova-support
This is a NativeScript plugin, which enables you to use cordova plugins inside your NativeScript-based project.

## What is NativeScript?
NativeScript is an open-source framework to develop apps on the Apple iOS and Android platforms. You can find out more about it in [here](https://www.nativescript.org/).

## Installation
Add the cordova plugins you want to use as dependencies to you project and then add `nativescript-cordova-support`:
```
tns plugin add https://github.com/NativeScript/nativescript-cordova-support
```
During build `nativescript-cordova-support` will handle all cordova plugin dependencies and enable you to use them in your project's source code.

## Demo
You can find a demo application here [https://github.com/NativeScript/nativescript-cordova-support](https://github.com/NativeScript/nativescript-cordova-support). Enter the `demo` directory and execute `tns run android` or `tns run ios`. The demo application showcases some cordova plugins. Some of the plugins have been forked and fixed to work with NativeScript as for example the C++ standard used  is different and some warnings in Objective-C/C++ files are treated as errors and prevent the source code from being compiled.

## How does it work?
After installing this plugin, cordova version 8.0.0 will be added to your project's devDependencies.

The plugin uses NativeScript's hook mechanism to perform the following steps:

* Before CLI prepares the project it searches the project's `node_modules` directory for plugins containing a `plugin.xml` file. These plugins are marked as `cordova plugins`.
* It uses the cordova dev dependency to cordova-cli to create a Cordova project in a temporary directory.
* The current platform is added to the cordova project and all plugins previously marked as `cordova plugins` are added to said project.
* It executes `cordova prepare` in the temporary project to prepare the native components of the project.
* All prepared native components of interest (java files, .so libraries, objective-c .m files, etc.) are copied to `node_modules/nativescript-cordova-support` so that they can be used in the NativeScript project.
* After that {N} CLI's prepare step proceeds as normal.
* This plugin is considered by the CLI as a regular NativeScript plugin which has native components most of which are collected in the previous steps from all cordova plugins.
* The plugin includes some caching logic - every time the marked `cordova plugins` are added to the temporary Cordova project they are cached inside a JSON file in `node_modules/nativescript-cordova-support`. During subsequent builds the plugin analyzes the dependencies again and check whether the current `cordova plugins` differ from the previously handled ones. This enables rebuilding only when necessary.
* During each rebuild the plugin removes its `platforms` directory and replaces it with `platforms-cache`. This ensures a fresh start from a clean state whenever `cordova plugins` need to be processed.

## Limitations
* WebView-related or DOM-related functionality will *never* work inside NativeScript projects as they do not have a WebView or a DOM tree. This includes plugins like the [crosswalk-project](https://github.com/crosswalk-project/cordova-plugin-crosswalk-webview), [wkwebview-engine](https://github.com/apache/cordova-plugin-wkwebview-engine), etc.
* Currently passing compiler flags is unsupported (e.g. [this](https://github.com/heigeo/cordova-plugin-tensorflow/blob/9c8b74c81a642b1381be517de8f22e0caa649180/plugin.xml#L41) will not work)
* The .xcconfig variable `ADDITIONAL_CORDOVA_LDFLAGS` has to be manually set because NativeScript doesn't support auto linking frameworks. Some Cordova plugins rely on this feature of Cordova apps and may be missing some references from plugin.xml (respectively platforms/ios/HelloCordova.xcodeproj). For example `ADDITIONAL_CORDOVA_LDFLAGS = -framework AudioToolbox -lsqlite3`
* Android `.so` files are taken into account **only** if they are compatible with `cordova-android` version `7.0.0` and above. This means they should be referenced in such a way that they end up in the native project's `jniLibs` directory, instead of the `libs` directory. This is expected as `.so` files *should* be placed in `jniLibs` in the native project or else they will not be respected by the `gradle` build system during build and will not work in the cordova framework itself even. (e.g. [this](https://github.com/heigeo/cordova-plugin-tensorflow/blob/9c8b74c81a642b1381be517de8f22e0caa649180/plugin.xml#L27) will not work, whereas [this](https://github.com/Mitko-Kerezov/cordova-plugin-tensorflow/blob/212213257363df829de4b7b2d11434c033f5af0a/plugin.xml#L27) will)

## Troubleshooting
This plugin hasn't been extensively tested with many cordova plugins and you may encounter some issues along the way. Should you encounter anything extraordinary you can try the following rules of thumb:
* Remove `platforms` directory and try building again
* Remove `node_modules` directory and try building again
