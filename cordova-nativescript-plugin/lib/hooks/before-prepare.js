const path = require('path');
const fs = require('fs');
const convert = require('xml-js');
const mkdirp = require('mkdirp');
const fse = require('fs-extra')
const temp = require("temp");
const childProcess = require("child_process");

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
const CORDOVA_PROJECT_NAME = "myProject";
const CORDOVA_PROJECT_INFO_PLIST_RELATIVE_PATH = "HelloCordova/HelloCordova-Info.plist";

module.exports = function ($projectData, hookArgs) {
    const platform = hookArgs.platform.toLowerCase();
    const projectDir = $projectData.projectDir;
    const pluginVersionsCacheLocation = path.join(getNsCordovaPluginDir(), PLATFORMS_STRING);
    mkdirp.sync(pluginVersionsCacheLocation);
    const pluginVersionsCacheFilePath = path.join(pluginVersionsCacheLocation, addPlatformSuffixBeforeExtension("pluginsCache.json", platform));

    const getPluginXml = dir => path.join(dir, "plugin.xml")
    const getPackageJson = dir => path.join(dir, PACKAGE_JSON_FILE_NAME)
    const modulesFolder = path.join(projectDir, "node_modules");
    const isCordovaPlugin = source => fs.lstatSync(source).isDirectory() && path.basename(source) !== PLUGIN_NAME && fs.existsSync(getPluginXml(source));
    const cordovaPluginsDirectories = fs.readdirSync(modulesFolder).map(moduleName => path.join(modulesFolder, moduleName)).filter(isCordovaPlugin);

    const pluginDataObjects = getPluginDataObjects(projectDir);

    if (fs.existsSync(pluginVersionsCacheFilePath) && fs.readFileSync(pluginVersionsCacheFilePath).toString() === JSON.stringify(pluginDataObjects) || !pluginDataObjects.length) {
        console.log("No new cordova plugins to prepare.");
        return;
    }

    temp.track();
    const tempCordovaProject = temp.mkdirSync("cordova-project");
    const cordovaPath = path.join(modulesFolder, CORDOVA_NAME, "bin", CORDOVA_NAME);
    const cordovaProjectDir = path.join(tempCordovaProject, CORDOVA_PROJECT_NAME);
    const idStringComponent = "zzz123zzz";
    const pluginPackageName = `${idStringComponent}.${idStringComponent}.${idStringComponent}`;
    // Create the project
    childProcess.spawnSync(NODE_NAME, [cordovaPath, "create", CORDOVA_PROJECT_NAME, "--appid", pluginPackageName], { cwd: tempCordovaProject });

    // Add the platform
    childProcess.spawnSync(NODE_NAME, [cordovaPath, "platform", "add", platform], { cwd: cordovaProjectDir });

    const platformDirectory = path.join(cordovaProjectDir, PLATFORMS_STRING, platform);

    prepareForAddingCordovaPlugins(platform, pluginPackageName, platformDirectory);

    const tempPluginsFolder = path.join(tempCordovaProject, "cordova-plugins");
    mkdirp.sync(tempPluginsFolder);
    // Add all plugins from the original project
    pluginDataObjects.forEach(pluginData => {
        const pluginFolderName = path.basename(pluginData.absolutePath);
        const pluginDest = path.join(tempPluginsFolder, pluginFolderName);
        // The plugins should be copied to the temp project and then we need to remove the
        // metadata from the package.json or npm will fetch them from the cache.
        fetchPlugin(pluginData, pluginDest);

        let varsArgs = [];
        if (pluginData.pluginVars) {
            Object.keys(pluginData.pluginVars).forEach(key => {
                const value = pluginData.pluginVars[key];
                varsArgs.push("--variable");
                varsArgs.push(`${key}="${value}"`);
            });
        }

        childProcess.spawnSync(NODE_NAME, [cordovaPath, "plugin", "add", pluginDest].concat(varsArgs), { cwd: cordovaProjectDir });
    });

    childProcess.spawnSync(NODE_NAME, [cordovaPath, "prepare", platform], { cwd: cordovaProjectDir });

    processCordovaProject(cordovaProjectDir, platform, pluginDataObjects, idStringComponent, platformDirectory);

    // TODO: This should probably happen on after-prepare
    fs.writeFileSync(pluginVersionsCacheFilePath, JSON.stringify(pluginDataObjects));
}

function fetchPlugin(pluginData, pluginDest) {
    fse.copySync(pluginData.absolutePath, pluginDest);
    const pluginPackageJson = path.join(pluginDest, "package.json");
    const pkgJsonContent = fs.readFileSync(pluginPackageJson);
    const pkgJson = JSON.parse(pkgJsonContent);
    for (let key in pkgJson) {
        if (pkgJson.hasOwnProperty(key) && key.startsWith("_")) {
            delete pkgJson[key];
        }
    }

    fs.writeFileSync(pluginPackageJson, JSON.stringify(pkgJson));
}

function walkSync(dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {

        filelist = fs.statSync(path.join(dir, file)).isDirectory()
            ? walkSync(path.join(dir, file), filelist)
            : filelist.concat(path.join(dir, file));

    });
    return filelist;
}

function getPluginDataObjects(projectDir) {
    const getPluginXml = dir => path.join(dir, "plugin.xml")
    const getPackageJson = dir => path.join(dir, PACKAGE_JSON_FILE_NAME)
    const modulesFolder = path.join(projectDir, "node_modules");
    const isCordovaPlugin = source => fs.lstatSync(source).isDirectory() && path.basename(source) !== PLUGIN_NAME && fs.existsSync(getPluginXml(source));
    const cordovaPluginsDirectories = fs.readdirSync(modulesFolder).map(moduleName => path.join(modulesFolder, moduleName)).filter(isCordovaPlugin);
    const mainPackageJson = require(getPackageJson(projectDir));

    const pluginDataObjects = cordovaPluginsDirectories.map(dir => {
        const pluginXml = fs.readFileSync(getPluginXml(dir), 'utf8');
        const options = { ignoreComment: true, alwaysChildren: true, trim: true };
        const result = convert.xml2js(pluginXml, options);
        const plugin = result.elements[0];
        const pluginId = plugin.attributes.id;
        const pluginName = path.basename(dir);
        const pluginVars = mainPackageJson.nativescript &&
            mainPackageJson.nativescript.cordova &&
            mainPackageJson.nativescript.cordova["plugin-variables"] &&
            mainPackageJson.nativescript.cordova["plugin-variables"][pluginName];

        return {
            absolutePath: dir,
            pluginName,
            pluginVars,
            version: require(getPackageJson(dir)).version,
            id: pluginId
        };
    });

    return pluginDataObjects;
}

function prepareForAddingCordovaPlugins(platform, pluginPackageName, platformDirectory) {
    if (platform === "android") {
        const mainDirectory = getAndroidMainDir(platformDirectory);
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
`);
    } else if (platform === "ios") {
        const infoPlistContents =
            `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
  </dict>
</plist>`; //Truncate Info.plist in order to track plugin keys and add only them
        fs.writeFileSync(path.join(platformDirectory, CORDOVA_PROJECT_INFO_PLIST_RELATIVE_PATH), infoPlistContents);
    }
}

function processCordovaProject(cordovaProjectDir, platform, pluginDataObjects, idStringComponent, platformDirectory) {
    const android = platform === "android";
    const nsCordovaPluginDir = getNsCordovaPluginDir();
    const nsCordovaPlatformDir = path.join(nsCordovaPluginDir, "platforms", platform);

    if (android) {
        const mainDirectory = getAndroidMainDir(platformDirectory);
        fs.readdirSync(mainDirectory).forEach(mainDirFile => {
            const fullSrcPath = path.join(mainDirectory, mainDirFile);
            const fullDestPath = path.join(nsCordovaPlatformDir, mainDirFile);
            switch (mainDirFile) {
                case "assets":
                    const cordovaPluginsDestPath = path.join(nsCordovaPluginDir, CORDOVA_PLUGINS_FILE_NAME);
                    const wwwwDir = path.join(fullSrcPath, "www");
                    fse.copySync(path.join(wwwwDir, CORDOVA_PLUGINS_FILE_NAME), cordovaPluginsDestPath);
                    const wwwPluginsDir = path.join(wwwwDir, PLUGINS_DIR_NAME);
                    const wwwJsFiles = walkSync(wwwPluginsDir);
                    wwwJsFiles.forEach(pluginFile => {
                        const relativePluginFileLocation = path.relative(wwwPluginsDir, pluginFile);
                        const destinationPluginFileFullPath = path.join(nsCordovaPluginDir, PLUGINS_DIR_NAME, relativePluginFileLocation);
                        mkdirp.sync(path.dirname(destinationPluginFileFullPath));
                        fse.copySync(pluginFile, destinationPluginFileFullPath);
                    });
                    break;
                case "java":
                    fse.copySync(fullSrcPath, fullDestPath, { filter: (src, dest) => src.indexOf(idStringComponent) === -1 });
                    break;
                default:
                    fse.copySync(fullSrcPath, fullDestPath);
            }
        });

        handleGradleFiles(pluginDataObjects, platformDirectory, nsCordovaPlatformDir);
    } else {
        const nsCordovaPlatformSrcDir = path.join(nsCordovaPlatformDir, "src");
        const iosPluginsJsDir = path.join(nsCordovaPluginDir, PLUGINS_DIR_NAME);
        const filesToCopy = [
            { src: path.join(platformDirectory, "www", CORDOVA_PLUGINS_FILE_NAME), dest: path.join(nsCordovaPluginDir, addPlatformSuffixBeforeExtension(CORDOVA_PLUGINS_FILE_NAME, platform)) },
            { src: path.join(platformDirectory, "www", PLUGINS_DIR_NAME), dest: iosPluginsJsDir },
            { src: path.join(platformDirectory, "HelloCordova", "Plugins"), dest: path.join(nsCordovaPlatformSrcDir, "Plugins") },
            { src: path.join(platformDirectory, "HelloCordova", "config.xml"), dest: addPlatformSuffixBeforeExtension(path.join(nsCordovaPluginDir, "config.xml"), platform) },
            { src: path.join(platformDirectory, CORDOVA_PROJECT_INFO_PLIST_RELATIVE_PATH), dest: path.join(nsCordovaPlatformDir, "Info.plist") },
        ];

        filesToCopy.forEach(item => {
            fse.copySync(item.src, item.dest);
        });

        addPlatformSuffixToAllFiles(iosPluginsJsDir, platform);

        let frameworks = require(path.join(platformDirectory, "frameworks.json"));

        let xcconfigContents = "OTHER_LDFLAGS = $(inherited)";
        Object.keys(frameworks).forEach((framework) => {
            const endsOnFrameworkRegEx = /.framework$/;
            if (framework.match(endsOnFrameworkRegEx)) {
                xcconfigContents += ` -framework "${framework.replace(endsOnFrameworkRegEx, "")}"`;
            }
        });
        xcconfigContents += `\n`;
        xcconfigContents += `SYSTEM_HEADER_SEARCH_PATHS = $(inherited) ${path.join(nsCordovaPlatformDir, "src/Cordova")}\n`;

        fs.writeFileSync(path.join(nsCordovaPlatformDir, "build.xcconfig"), xcconfigContents + "\n");
    }

}

function handleGradleFiles(pluginDataObjects, platformDirectory, nsCordovaPlatformDir) {

    // Handle gradle-specifics
    const destIncludeGradle = path.join(nsCordovaPlatformDir, "include.gradle");
    const cdvBuildGradleFilePath = path.join(platformDirectory, APP_DIRECTORY_NAME, "build.gradle");
    const cdvBuildGradleFileContents = fs.readFileSync(cdvBuildGradleFilePath, "utf8");

    let subProjectDependenciesSection = getStringBetween(cdvBuildGradleFileContents, CORDOVA_SUBPROJECT_DEPENDENCIES_START_STRING, CORDOVA_SUBPROJECT_DEPENDENCIES_END_STRING);
    // Remove cordova-specific implementation
    subProjectDependenciesSection = subProjectDependenciesSection.replace('implementation(project(path: ":CordovaLib"))', '');

    // Unify appcompat and support versions accross all plugins
    subProjectDependenciesSection = getUnifiedAppCompatSupportContent(subProjectDependenciesSection);

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
        const pluginGradleDir = path.join(platformDirectory, pluginData.id);
        if (fs.existsSync(pluginGradleDir)) {
            fse.copySync(pluginGradleDir, path.join(nsCordovaPlatformDir, pluginData.id));
        }
    });

    // Unify appcompat and support versions accross all plugin's .gradle files
    const cordovaPluginsGradleFilesLocations = pluginGradleExtensionsSection.replace(/apply from: "(.*?)"/g, "$1")
        .split("\n")
        .filter(location => !!location);
    cordovaPluginsGradleFilesLocations.forEach(cordovaPluginsGradleFileLocation => {
        const fullPath = path.join(nsCordovaPlatformDir, cordovaPluginsGradleFileLocation);
        const gradleContents = fs.readFileSync(fullPath, "utf8");
        const unifiedGradleContents = getUnifiedAppCompatSupportContent(gradleContents);
        fs.writeFileSync(fullPath, unifiedGradleContents);
    });
}

function getStringBetween(str, start, end) {
    return str.substring(str.indexOf(start) + start.length, str.indexOf(end));
}

function getUnifiedAppCompatSupportContent(originalContent) {
    return originalContent
        .replace(/(com.android.support:appcompat-v7:).*?(['"])/g, "$1$supportVersion$2")
        .replace(/(com.android.support:support-v4:).*?(['"])/g, "$1$supportVersion$2");
}

function getAndroidMainDir(platformsDirectory) {
    return path.join(platformsDirectory, APP_DIRECTORY_NAME, "src", "main");
}

function addPlatformSuffixBeforeExtension(filename, platform) {
    if (!filename || !platform) {
        throw new Error("Required parameter is missing!");
    }
    const extStartIndex = filename.length - path.extname(filename).length;
    return `${filename.slice(0, extStartIndex)}.${platform}${filename.slice(extStartIndex)}`;
}

function addPlatformSuffixToAllFiles(dir, platform) {
    walkSync(dir).forEach(file => {
        fs.renameSync(file, addPlatformSuffixBeforeExtension(file, platform));
    })
}

function getNsCordovaPluginDir() {
    return path.join(__dirname, "..", "..")
}
