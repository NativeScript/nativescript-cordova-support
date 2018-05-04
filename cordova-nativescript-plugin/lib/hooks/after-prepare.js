const path = require('path');
const fs = require('fs');

module.exports = function ($projectData, hookArgs) {
    const includeGradlePath = path.join(__dirname, "..", "..", "platforms", "android", "include.gradle");

    if (fs.existsSync(includeGradlePath)) {
        fs.unlinkSync(includeGradlePath);
    }
}