const path = require('path');
const fs = require('fs');
const convert = require('xml-js');
const mkdirp = require('mkdirp');
const fse = require('fs-extra')
const temp = require("temp");
const childProcess = require("child_process");

const CORDOVA_PLUGINS_FILE = "cordova_plugins.js";
const CORDOVA_FEATURES_FILE = "cordova_features.json";
const PLUGIN_NAME = "cordova-nativescript-plugin"
const ANDROID_MANIFEST_FILE_NAME = "AndroidManifest.xml";
const PACKAGE_JSON_FILE_NAME = "package.json";
const CORDOVA_NAME = "cordova";
const PLUGINS_DIR_NAME = "plugins";
const PLATFORMS_STRING = "platforms";
const CORDOVA_PLUGINS_FILE_NAME = "cordova_plugins.js";
const NODE_NAME = "node";
const APP_DIRECTORY_NAME = "app";
const CORDOVA_SUBPROJECT_DEPENDENCIES_START_STRING = "// SUB-PROJECT DEPENDENCIES START";
const CORDOVA_SUBPROJECT_DEPENDENCIES_END_STRING = "// SUB-PROJECT DEPENDENCIES END";
const PLUGIN_GRADLE_EXTENSIONS_START_STRING = "// PLUGIN GRADLE EXTENSIONS START";
const PLUGIN_GRADLE_EXTENSIONS_END_STRING = "// PLUGIN GRADLE EXTENSIONS END";

module.exports = function ($projectData, hookArgs) {
    const platform = hookArgs.platform.toLowerCase();
    const pluginVersionsCacheLocation = path.join($projectData.projectDir, PLATFORMS_STRING, CORDOVA_NAME, platform);
    mkdirp.sync(pluginVersionsCacheLocation);
    const pluginVersionsCacheFilePath = path.join(pluginVersionsCacheLocation, "pluginsCache.json");

    const getPluginXml = dir => path.join(dir, "plugin.xml")
    const getPackageJson = dir => path.join(dir, PACKAGE_JSON_FILE_NAME)
    const modulesFolder = path.join($projectData.projectDir, "node_modules");
    const isCordovaPlugin = source => fs.lstatSync(source).isDirectory() && path.basename(source) !== PLUGIN_NAME && fs.existsSync(getPluginXml(source));
    const cordovaPluginsDirectories = fs.readdirSync(modulesFolder).map(moduleName => path.join(modulesFolder, moduleName)).filter(isCordovaPlugin);

    const jsModules = [];
    const features = {};
    const jsMetadata = {};
    const pluginDataObjects = cordovaPluginsDirectories.map(dir => {
        const pluginXml = fs.readFileSync(getPluginXml(dir), 'utf8');
        const options = { ignoreComment: true, alwaysChildren: true, trim: true };
        const result = convert.xml2js(pluginXml, options);
        const plugin = result.elements[0];
        const pluginId = plugin.attributes.id;

        return {
            absolutePath: dir,
            pluginName: path.basename(dir),
            version: require(getPackageJson(dir)).version,
            id: pluginId
        };
    });

    if (fs.existsSync(pluginVersionsCacheFilePath) && fs.readFileSync(pluginVersionsCacheFilePath).toString() === JSON.stringify(pluginDataObjects) || !pluginDataObjects.length) {
        console.log("No new cordova plugins to prepare.");
        return;
    }
    temp.track();
    const tempCordovaProject = temp.mkdirSync("cordova-project");
    const cordovaPath = path.join(modulesFolder, CORDOVA_NAME, "bin", CORDOVA_NAME);
    const projectName = "myProject";
    const cordovaProjectDir = path.join(tempCordovaProject, projectName);
    const idStringComponent = "zzz123zzz";
    const pluginPackageName = `${idStringComponent}.${idStringComponent}.${idStringComponent}`;
    // Create the project
    childProcess.spawnSync(NODE_NAME, [cordovaPath, "create", projectName, "--appid", pluginPackageName], { cwd: tempCordovaProject });

    // Add the platform
    childProcess.spawnSync(NODE_NAME, [cordovaPath, "platform", "add", platform], { cwd: cordovaProjectDir });

    const platformsAppDirectory = path.join(cordovaProjectDir, PLATFORMS_STRING, platform, APP_DIRECTORY_NAME);
    const mainDirectory = path.join(platformsAppDirectory, "src", "main");
    // Delete all icons/splashscreens - if a {N} plugin has icons and splash screens the build will fail
    walkSync(path.join(mainDirectory, "res")).forEach(resFile => {
        if (path.extname(resFile) === ".png") {
            fse.removeSync(resFile);
        }
    });

    fs.writeFileSync(path.join(mainDirectory, ANDROID_MANIFEST_FILE_NAME), `<?xml version='1.0' encoding='utf-8'?>
<manifest android:hardwareAccelerated="true" android:versionCode="10000" android:versionName="1.0.0" package="${pluginPackageName}" xmlns:android="http://schemas.android.com/apk/res/android">
    <application>
    </application>

</manifest>
`)

    // Add all plugins from the original projects
    pluginDataObjects.forEach(pluginData => {
        childProcess.spawnSync(NODE_NAME, [cordovaPath, "plugin", "add", pluginData.absolutePath], { cwd: cordovaProjectDir });
    });

    childProcess.spawnSync(NODE_NAME, [cordovaPath, "prepare", platform], { cwd: cordovaProjectDir });

    processCordovaProject(cordovaProjectDir, platform, pluginDataObjects, idStringComponent, mainDirectory, platformsAppDirectory);

    // TODO: This should probably happen on after-prepare
    fs.writeFileSync(pluginVersionsCacheFilePath, JSON.stringify(pluginDataObjects));
}

function walkSync(dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {

        filelist = fs.statSync(path.join(dir, file)).isDirectory()
            ? walkSync(path.join(dir, file), filelist)
            : filelist.concat(path.join(dir, file));

    });
    return filelist;
}

function getPluginGeneratedCodeSnippet(platform) {
    return `
// GENERATED CODE
const window = module.exports;
const navigator = {
    appCodeName: "NativeScript",
    appName: "NativeScript",
    appVersion: "1.0.0",
    cookieEnabled: false,
    geolocation: {},
    language: "en-US",
    onLine: true,
    platform: "${platform}",
    product: "NativeScript",
    userAgent: "NativeScript for ${platform}"
};
window.navigator = navigator;
// ~GENERATED CODE
`;
}

function processCordovaProject(cordovaProjectDir, platform, pluginDataObjects, idStringComponent, mainDirectory, platformsAppDirectory) {
    const pluginRoot = path.join(__dirname, "..", "..");
    const currentPluginPlatformsDir = path.join(pluginRoot, "platforms", platform);
    fs.readdirSync(mainDirectory).forEach(mainDirFile => {
        const fullSrcPath = path.join(mainDirectory, mainDirFile);
        const fullDestPath = path.join(currentPluginPlatformsDir, mainDirFile);
        switch (mainDirFile) {
            case "assets":
                const cordovaPluginsDestPath = path.join(pluginRoot, CORDOVA_PLUGINS_FILE_NAME);
                const wwwwDir = path.join(fullSrcPath, "www");

                // Modify cordova_plugins.js file contents so that it complies with {N} require function
                let cordovaPluginsFileWWWContents = fs.readFileSync(path.join(wwwwDir, CORDOVA_PLUGINS_FILE_NAME), 'utf8');
                cordovaPluginsFileWWWContents = cordovaPluginsFileWWWContents.replace(/"file": "plugins/g, `"file": "${PLUGIN_NAME}/${PLUGINS_DIR_NAME}`);
                fs.writeFileSync(cordovaPluginsDestPath, cordovaPluginsFileWWWContents);

                // We need to modify each plugin's javascript in order to add window and other relative objects
                const wwwPluginsDir = path.join(wwwwDir, PLUGINS_DIR_NAME);
                const wwwJsFiles = walkSync(wwwPluginsDir);
                wwwJsFiles.forEach(pluginFile => {
                    let pluginFileContents = fs.readFileSync(pluginFile, "utf8");
                    pluginFileContents = pluginFileContents.replace(/(cordova[.]define[\s\S]*?{)/gm, `$1${getPluginGeneratedCodeSnippet(platform)}`)
                    const relativePluginFileLocation = path.relative(wwwPluginsDir, pluginFile);
                    const destinationPluginFileFullPath = path.join(pluginRoot, PLUGINS_DIR_NAME, relativePluginFileLocation);
                    mkdirp.sync(path.dirname(destinationPluginFileFullPath));
                    fs.writeFileSync(destinationPluginFileFullPath, pluginFileContents);
                });
                break;
            case "java":
                fse.copySync(fullSrcPath, fullDestPath, { filter: (src, dest) => src.indexOf(idStringComponent) === -1 });
                break;
            default:
                fse.copySync(fullSrcPath, fullDestPath);
        }
    });

    // Handle gradle-speficics
    const destIncludeGradle = path.join(currentPluginPlatformsDir, "include.gradle");
    const cdvBuildGradleFilePath = path.join(platformsAppDirectory, "build.gradle");
    const cdvBuildGradleFileContents = fs.readFileSync(cdvBuildGradleFilePath, "utf8");

    let subProjectDependenciesSection = getStringBetween(cdvBuildGradleFileContents, CORDOVA_SUBPROJECT_DEPENDENCIES_START_STRING, CORDOVA_SUBPROJECT_DEPENDENCIES_END_STRING);
    subProjectDependenciesSection = subProjectDependenciesSection.replace('implementation(project(path: ":CordovaLib"))', '');
    let pluginGradleExtensionsSection = getStringBetween(cdvBuildGradleFileContents, PLUGIN_GRADLE_EXTENSIONS_START_STRING, PLUGIN_GRADLE_EXTENSIONS_END_STRING);
    pluginGradleExtensionsSection = pluginGradleExtensionsSection.replace(/\.\.\//g, './');
    fs.appendFileSync(destIncludeGradle, `
ext.cdvMinSdkVersion = null

${pluginGradleExtensionsSection}

dependencies {
    ${subProjectDependenciesSection}
}`);

    // Copy plugin gradle directories
    pluginDataObjects.forEach(pluginData => {
        const pluginGradleDir = path.join(platformsAppDirectory, "..", pluginData.id);
        if (fs.existsSync(pluginGradleDir)) {
            fse.copySync(pluginGradleDir, path.join(currentPluginPlatformsDir, pluginData.id));
        }
    });
}

function getStringBetween(str, start, end) {
    return str.substring(str.indexOf(start) + start.length, str.indexOf(end));
}
