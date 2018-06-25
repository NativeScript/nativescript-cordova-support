var Observable = require("data/observable").Observable;
var application = require("application");
const platformModule = require("tns-core-modules/platform");

function createViewModel(args) {
    // Initialize Cordova
    require("cordova-nativescript-plugin");
    const viewModel = new Observable();
    viewModel.message = "Choose an image to share";
    viewModel.sourceType = 0;
    viewModel.encodingType = 0

    viewModel.onTap = function () {
        const view = require("ui/core/view");
        const page = args.object;
        let img = view.getViewById(page, "img");

        const success = results => {
            if (results === "OK") {
                return;
            }

            for (var i = 0; i < results.length; i++) {
                console.log('Image URI: ' + results[i]);
                this.set("message", "You chose this image");
                img.src = results[i]
                this.set("path", img.src);
            }
        }

        const fail = error => {
            console.log('Error: ' + error);
        }

        window.imagePicker.getPictures(success, fail);
    }

    viewModel.onGetCameraPicture = function() {
        console.log("ViewModel's source type is: " + viewModel.sourceType);
        const sourceType = window.navigator.camera.PictureSourceType;
        console.log("Starting get picture. SourceType=" + sourceType);
        const destinationType = window.navigator.camera.DestinationType;

        window.navigator.camera.getPicture(
            (r) => {
                console.log(`success result: ${r}`);
                this.set("message", `Pic: ${r}`);
                this.set("path", r);
                console.log("set path to: ", this.path);
            },
            (err) => { console.log(`failure: ${err}`); },
            { quality : 50,
              destinationType : destinationType.FILE_URI,
              sourceType : parseInt(viewModel.sourceType),
              encodingType : parseInt(viewModel.encodingType) });
    };


    viewModel.onEmail = function() {
        cordova.plugins.email.open({
            to : 'test@test.com',
            cc : 'test2@test.com',
            bcc : [ 'secret1@test.com', 'secret2@test.com' ],
            subject : 'Greetings',
            body : 'How are you?'
        });
    };

    viewModel.onShare = function() {
        var options = {
            message : 'share this',
            //not supported on some apps(Facebook, Instagram)
            subject : 'the subject', // fi. for email
            files : [ this.path ], // an array of filenames either locally or remotely
            url : 'https://www.website.com/foo/#bar?a=b',
            chooserTitle : 'Pick an app' // Android only, you can override the default share sheet title
        };
        console.log("Options: ", options);
        var onSuccess
            = function(result) {
                  console.log("Share completed? " + result.completed); // On Android apps mostly return false even while it's true
                  console.log("Shared to app: " + result.app); // On Android result.app is currently empty. On iOS it's empty when sharing is cancelled (result.completed=false)
              };

        var onError
            = function(msg) {
                  console.log("Sharing failed with message: " + msg);
              };

        window.plugins.socialsharing.shareWithOptions(options, onSuccess, onError);
    };

    viewModel.onScan = function() {
        cordova.plugins.barcodeScanner.scan(
            function(result) {
                const msg = "We got a barcode\n" +
                            "Result: " + result.text + "\n" +
                            "Format: " + result.format + "\n" +
                            "Cancelled: " + result.cancelled;

                viewModel.set("message", `${msg}`);
                console.log(msg);
            },
            function(error) {
                console.log("Scanning failed: " + error);
            },
            {
                preferFrontCamera : false, // iOS and Android
                showFlipCameraButton : true, // iOS and Android
                showTorchButton : true, // iOS and Android
                torchOn : true, // Android, launch with the torch switched on (if available)
                saveHistory : true, // Android, save scan history (default false)
                prompt : "Place a barcode inside the scan area", // Android
                resultDisplayDuration : 500, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
                //                formats : "QR_CODE,PDF_417", // default: all but PDF_417 and RSS_EXPANDED
                orientation : "landscape", // Android only (portrait|landscape), default unset so it rotates with the device
                disableAnimations : false, // iOS
                disableSuccessBeep : true // iOS and Android
            });
    };

    viewModel.set("sqliteTestResult", `SQLite plugin test hasn't been run yet`);
    viewModel.onSqliteTest = function() {
        global.sqlitePlugin.selfTest((r) => {
            viewModel.set("sqliteTestResult", `SQLite plugin test PASSED, result: ${r}`);
        },
        (err) => {
            viewModel.set("sqliteTestResult", `SQLite plugin test FAILED, result: ${err}`);

        });
    };

    viewModel.onClassify = function() {
        const view = require("ui/core/view");
        const page = args.object;
        let img = view.getViewById(page, "img");

        const image = require("./image");
        img.src = image.url;

        var tf = new window.TensorFlowJS('inception-v1');
        tf.classify(image.base64, (r) => {
            viewModel.set("sqliteTestResult", `classify result: ${JSON.stringify(r, null, 0)}`);

        },
        (err) => {
            viewModel.set("sqliteTestResult", `classify error: ${err}`);

        });
    };
    return viewModel;
}

exports.createViewModel = createViewModel;
