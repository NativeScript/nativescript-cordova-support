const path = require("path");
const fs = require("fs");
const hook = require("nativescript-hook")(__dirname);
hook.postinstall();

const projectDir = hook.findProjectDir();
if (projectDir) {
	installCordova();
}

function getProjectCordovaVersion() {
    try {
        const packageJsonPath = path.join(projectDir, "package.json");
        const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");
        const jsonContent = JSON.parse(packageJsonContent);

        return (jsonContent.dependencies && jsonContent.dependencies.cordova) ||
            (jsonContent.devDependencies && jsonContent.devDependencies.cordova);
    } catch (err) {
        console.error(err);
        return null;
    }
}

function installCordova() {
    const installedTypeScriptVersion = getProjectCordovaVersion();

    if (!installedTypeScriptVersion) {
        const command = "npm install -D cordova@8.0.0";

        console.log("Installing cordova...");

        require("child_process").exec(command, { cwd: projectDir }, (err, stdout, stderr) => {
            if (err) {
                console.warn(`npm: ${err.toString()}`);
            }

            process.stdout.write(stdout);
            process.stderr.write(stderr);
        });
    }
}