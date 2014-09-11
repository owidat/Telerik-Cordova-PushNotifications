var url = 'http://api.everlive.com/v1/';
//This is your Telerik BackEnd Services API key.
var baasApiKey = 'BAAS_API_KEY';
var Masterkey = "BAAS_MASTER_KEY";
//This is the scheme (http or https) to use for accessing Telerik BackEnd Services.
var baasScheme = 'http';

//This is your Android project number. It is required by Google in order to enable push notifications for your app. You do not need it for iPhone.
var androidProjectNumber = 'GOOGLE_PROJECT_NUMBER';

//Set this to true in order to test push notifications in the emulator. Note, that you will not be able to actually receive 
//push notifications because we will generate fake push tokens. But you will be able to test your other push-related functionality without getting errors.
var emulatorMode = false;

var app = (function () {
    'use strict';
    
    window.onerror = function myErrorHandler(errorMsg, url, lineNumber) {
        alert(url + ":" + lineNumber + ": " + errorMsg);
        return false;
    }
    
    var onDeviceReady = function() {
        if (!baasApiKey || baasApiKey == 'BAAS_API_KEY') {
            $("#messageParagraph").html("Missing API key!<br /><br />It appears that you have not filled in your Telerik BackEnd Services API key.<br/><br/>Please go to scripts/app/main.js and enter your Telerik BackEnd Services API key at the beginning of the file.");
            $("#initializeButton").data("kendoMobileButton").enable(false);
        } else if ((!androidProjectNumber || androidProjectNumber == 'GOOGLE_PROJECT_NUMBER') && device.platform.toLowerCase() == "android") {
            $("#messageParagraph").html("Missing Android Project Number!<br /><br />It appears that you have not filled in your Android project number. It is required for push notifications on Android.<br/><br/>Please go to scripts/app/main.js and enter your Android project number at the beginning of the file.");
            $("#initializeButton").data("kendoMobileButton").enable(false);
        }
    };

    document.addEventListener("deviceready", onDeviceReady, false);

    //Initialize the Telerik BackEnd Services SDK
    var el = new Everlive({
        apiKey: baasApiKey,
        scheme: baasScheme
    });

    
    $( "#sendPush" ).click(function() {
            var msg = $("#pushMesg").val();
            var title = $("#pushTitle").val();
        //alert(msg);
            var notification = {
                "Android": {
                    "data": {
                            "title": title,
                            "message": msg,
                            "customData": "Custom data for Android"
                        }
                },
                "IOS": {
                    "aps": {
                            "alert": title + ': ' + msg,
                            "badge": 1,
                            "sound": "default"
                        },
                    "customData": "Custom data for iOS"
                },
                "WindowsPhone": {
                    "Toast": {
                            "Title": title,
                            "Message": msg
                        }
                },
                "Windows": {
                    "Toast": {
                            "template": "ToastText01",
                            "text": [title + ': ' + msg]
                        }
                }
            }

            $.ajax({
                       type: "POST",
                       url: url + baasApiKey + '/Push/Notifications',
                       contentType: "application/json",
                       data: JSON.stringify(notification),
                       success: function (data) {
                           alert('Message Sent: ' + JSON.stringify(data));
                       },
                       error: function (error) {
                           alert('Error: ' + JSON.stringify(error));
                       }
                   });
        });
    
    $.ajax({
    type: "GET",
    url: url + baasApiKey + '/Push/Notifications',
    headers: {
        "Authorization": Masterkey
    },
    success: function (data) {
        console.log(JSON.stringify(data));
    },
    error: function (error) {
        console.log(JSON.stringify(error));
    }
});
    
    var mobileApp = new kendo.mobile.Application(document.body, { transition: 'slide', layout: 'mobile-tabstrip' });

    //Login view model
    var mainViewModel = (function () {
        
        var successText = "SUCCESS!<br /><br />The device has been initialized for push notifications.<br /><br />";
        
        var _onDeviceIsRegistered = function() {
            $("a#initializeButton").data("kendoMobileButton").enable(false);
            $("#registerButton").data("kendoMobileButton").enable(false);
            $("#unregisterButton").data("kendoMobileButton").enable(true);
            $("#messageParagraph").html(successText + "Device is registered in Telerik BackEnd Services and can receive push notifications.");
        };
        
        var _onDeviceIsNotRegistered = function() {
            $("#unregisterButton").data("kendoMobileButton").enable(false);
            $("#registerButton").data("kendoMobileButton").enable(true).removeAttr('href');
            $("#messageParagraph").html(successText + "Device is not registered in Telerik BackEnd Services. Tap the button below to register it.");
        };
        
        var _onDeviceIsNotInitialized = function() {
            $("#unregisterButton").data("kendoMobileButton").enable(false);
            $("#initializeButton").removeAttr('disabled');
            $("#messageParagraph").html("Device unregistered.<br /><br />Push token was invalidated and device was unregistered from Telerik BackEnd Services. No push notifications will be received.");
        };
        
        var _onDeviceRegistrationUpdated = function() {
            $("#messageParagraph").html("Device registration updated.");
        };
        
        var onAndroidPushReceived = function(args) {
            alert('Android notification received: ' + JSON.stringify(args)); 
        };
        
        var onIosPushReceived = function(args) {
            alert('iOS notification received: ' + JSON.stringify(args)); 
        };
        
        //Initializes the device for push notifications.
        var enablePushNotifications = function () {
            //Initialization settings
            var pushSettings = {
                android: {
                    senderID: androidProjectNumber
                },
                iOS: {
                    badge: "true",
                    sound: "true",
                    alert: "true"
                },
                notificationCallbackAndroid : onAndroidPushReceived,
                notificationCallbackIOS: onIosPushReceived
            }
            
            $("#initializeButton").data("kendoMobileButton").enable(false);
            $("#messageParagraph").text("Initializing push notifications...");
            
            var currentDevice = el.push.currentDevice(emulatorMode);
            
            currentDevice.enableNotifications(pushSettings)
                .then(
                    function(initResult) {
                        $("#tokenLink").attr('href', 'mailto:test@example.com?subject=Push Token&body=' + initResult.token);
                        $("#messageParagraph").html(successText + "Checking registration status...");
                        return currentDevice.getRegistration();
                    },
                    function(err) {
                        $("#messageParagraph").html("ERROR!<br /><br />An error occured while initializing the device for push notifications.<br/><br/>" + err.message);
                    }
                ).then(
                    function(registration) {  
                        _onDeviceIsRegistered();                      
                    },
                    function(err) {                        
                        if(err.code === 801) {
                            _onDeviceIsNotRegistered();      
                        }
                        else {                        
                            $("#messageParagraph").html("ERROR!<br /><br />An error occured while checking device registration status: <br/><br/>" + err.message);
                        }
                    }
                );  
                        
        
        };
        //enablePushNotifications();
        var registerInEverlive = function() {
            var currentDevice = el.push.currentDevice();
            
            if (!currentDevice.pushToken) currentDevice.pushToken = "some token";
            el.push.currentDevice()
                .register({ Age: 15 })
                .then(
                    _onDeviceIsRegistered,
                    function(err) {
                        alert('REGISTER ERROR: ' + JSON.stringify(err));
                    }
                );
        };
        
        var disablePushNotifications = function() {
            el.push.currentDevice()
                .disableNotifications()
                .then(
                    _onDeviceIsNotInitialized,
                    function(err) {
                        alert('UNREGISTER ERROR: ' + JSON.stringify(err));
                    }
                );
        };
        
        var updateRegistration = function() {
            el.push.currentDevice()
                .updateRegistration({ Age: 16 })
                .then(
                    _onDeviceRegistrationUpdated,
                    function(err) {
                        alert('UPDATE ERROR: ' + JSON.stringify(err));
                    }
                );
        };
        
        return {
            enablePushNotifications: enablePushNotifications,
            registerInEverlive: registerInEverlive,
            disablePushNotifications: disablePushNotifications,
            updateRegistration: updateRegistration,
        };
    }());
    

    return {
        viewModels: {
            main: mainViewModel
        }
    };
}());
