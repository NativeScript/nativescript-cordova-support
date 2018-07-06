const path = require('path');
const rimraf = require("rimraf");
const fs = require('fs');

module.exports = function ($projectData, hookArgs) {
    const pluginPlatformsAndroid = path.join(__dirname, "..", "..", "platforms", "android");
    const libsPath = path.join(pluginPlatformsAndroid, "libs");
    const includeGradlePath = path.join(pluginPlatformsAndroid, "include.gradle");

    rimraf.sync(includeGradlePath);
    // Remove all jar dependencies as they are already included in this plugin's built .aar
    rimraf.sync(path.join(libsPath, "*.jar"));
}