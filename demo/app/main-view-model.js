var Observable = require("data/observable").Observable;
var application = require("application");

// This enables the cordova variable
require("cordova-nativescript-plugin");

function createViewModel(args) {
    const viewModel = new Observable();
    viewModel.message = "Choose an image";

    viewModel.onTap = function () {
        const view = require("ui/core/view");
        const page = args.object;
        let img = view.getViewById(page, "img");

        const success = results => {
            if (results === "OK") {
                return
            }

            for (var i = 0; i < results.length; i++) {
                console.log('Image URI: ' + results[i]);
                this.set("message", "You chose this image");
                img.src = results[i]
            }
        }

        const fail = error => {
            console.log('Error: ' + error);
        }

        // Require the imagePicker plugin
        const imagePicker = cordova.require("com.synconset.imagepicker.ImagePicker").imagePicker;
        imagePicker.getPictures(success, fail);
    }

    return viewModel;
}

exports.createViewModel = createViewModel;
