const path = require('path');
const fs = require('fs');
const fse = require('fs-extra')

const BUILD_GRADLE_FILE_NAME = "build.gradle";
const skipDirs = ["java", "res", "AndroidManifest.xml", BUILD_GRADLE_FILE_NAME];

module.exports = function (hookArgs) {
    debugger;
    const pluginRoot = path.join(__dirname, "..", "..");
    const currentPluginPlatformsDir = path.join(pluginRoot, "platforms", "android");

    const pluginDir = hookArgs.pluginBuildSettings.pluginDir;
    const pluginDirFiles = fs.readdirSync(pluginDir);
    const currentPluginPlatformFiles = fs.readdirSync(currentPluginPlatformsDir);
    for (const currentPluginPlatformFile of currentPluginPlatformFiles) {
        // Do not copy file if it is amongst the skipdirs or if it is already present in the destination
        if (skipDirs.indexOf(currentPluginPlatformFile) !== -1 || pluginDirFiles.indexOf(currentPluginPlatformFile) !== -1) {
            continue;
        }

        const fullSrcPath = path.join(currentPluginPlatformsDir, currentPluginPlatformFile);
        const fullDestPath = path.join(pluginDir, currentPluginPlatformFile);
        fse.copySync(fullSrcPath, fullDestPath);
    }

    fs.appendFileSync(path.join(pluginDir, BUILD_GRADLE_FILE_NAME), '\napply from: "./include.gradle"')
}
