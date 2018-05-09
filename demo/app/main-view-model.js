var Observable = require("data/observable").Observable;
var application = require("application");

// This enables the cordova variable
// require("cordova-nativescript-plugin");

/**
 * Start cordova
 */
/*global cordova,window,console*/
/**
 * An Image Picker plugin for Cordova
 *
 * Developed by Wymsee for Sync OnSet
 */

// Platform: android
// 4450a4cea50616e080a82e8ede9e3d6a1fe3c3ec
/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
*/

function createViewModel(args) {
    require("cordova-nativescript-plugin");
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
