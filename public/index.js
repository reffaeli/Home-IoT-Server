
// Init angular app 
var IoTApp = angular.module("IoTApp", ['rzModule', 'ui.bootstrap', 'ngRoute']);

// Services
IoTApp.service('updatesService', ['$http', function (http) {

    // Switch update
    this.eventsArray = [];
    var methods = this.eventsArray;
    this.GivCallbackToListen = (method) => {
        methods.push(method);
    }

    // Listen to event of 
    var es = new EventSource('/devices-feed');

    es.onmessage = function (event) {
        var data = JSON.parse(event.data);
        if (data == 'init')
            return;
        console.log('Device: ' + data.deviceID + ' update');

        methods.forEach(function (item, index) {
            item(data);
        });

    };

    var timinges = new EventSource('/timing-triggered-feed');

    timinges.onmessage = function (event) {
        var data = JSON.parse(event.data);
        if (data == 'init')
            return;
        // alert('timing activeted , row message data: '  + event.data);
        console.log('timing activeted , row message data: ' + event.data)
        swal({
            title: "Timing Activated!",
            timer: 60000
        });
    };
}]);

// Controller defnition
IoTApp.controller('indexCtrl', function ($scope) {
    // For next use
});

var isMobile;

IoTApp.controller('screensaverCtrl', function ($scope, $http) {
    $scope.clock;
    $scope.date;
    $scope.day;
    $scope.hebrewDate;
    $scope.sunrise;
    $scope.sunset;
    $scope.candles;
    $scope.havdalah;
    $scope.parashat;
    $scope.sunsetDate;
    $scope.weatherTemp;
    $scope.waetherIconPath;
    $scope.waetherDesc;

    $scope.SetWallpaper = () => {
        $http({
            url: '/screensaver_wallpaper/' + (!isMobile.matches ? '1' : '0'),
            method: 'GET'
        })
            .then(function (response) {
                $("#fsModal").css("background-image", "url('" + response.data + "')");

            },
            function (response) { // optional
                console.error(response.data);
            });
    }
    $scope.SetWallpaper();
    setInterval($scope.SetWallpaper, 300000);// loading data every 5 minuts

    $scope.SetWallpaper();

    $scope.daysInWeek = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת קודש', 'מוצאי שבת קודש'];

    $scope.GetWeather = function (device) {
        $http({
            url: 'screensaver',
            method: 'GET'
        })
            .then(function (response) {
                $scope.hebrewDate = response.data.hebrew;
                var sunrise = new Date(response.data.sys.sunrise);
                $scope.sunsetDate = new Date(response.data.sys.sunset);
                $scope.sunrise = sunrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                $scope.sunset = $scope.sunsetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                $scope.weatherTemp = response.data.main.temp;// + '°';
                $scope.waetherDesc = response.data.weather[0].description;
                $scope.waetherIconPath = "/weatherimage/" + response.data.weather[0].icon + ".png";

                $scope.candles = new Date(response.data.shabat.candles).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                $scope.havdalah = new Date(response.data.shabat.havdalah).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });;
                $scope.parashat = response.data.shabat.parashat;

                $scope.isSabbat = false;

                var date = new Date();
                var dayinweek = date.getDay() + 1;
                $scope.isWeekend = dayinweek >= 6;
                if ($scope.isWeekend) {
                    var sunsetDate = new Date(response.data.sys.sunset);

                    if (dayinweek == 6) {
                        var shabatEntiring = new Date(sunsetDate.getTime() - 1.8e+6);
                        if (date > shabatEntiring) {
                            $scope.day = 'שבת קודש';
                            $scope.isSabbat = true;
                            return;
                        }
                    } else {
                        var shabatExsiting = new Date(sunsetDate.getTime() + 2.4e+6);
                        if (date > shabatExsiting) {
                            $scope.day = 'מוצאי שבת קודש';
                            return;
                        } else {
                            $scope.isSabbat = true;
                        }
                    }
                }

                $scope.day = $scope.daysInWeek[date.getDay()];
            },
            function (response) { // optional
                console.error(response.data);
            });
    };

    setInterval($scope.GetWeather, 120000);// loading data every 2 minuts
    $scope.GetWeather();

    $scope.clockInterval = () => {
        var d = new Date();
        min = d.getMinutes();
        sec = d.getSeconds();
        hr = d.getHours();
        if (hr < 10)
            hr = "0" + hr;
        if (d.getMinutes() < 10)
            min = "0" + d.getMinutes();
        if (d.getSeconds() < 10)
            sec = "0" + d.getSeconds();
        $scope.clock = "" + hr + ":" + min + ":" + sec;
        $scope.date = d.toLocaleDateString();

        $scope.$apply();
    }
    setInterval($scope.clockInterval, 1000);
});

IoTApp.controller('mainCtrl', function ($scope, $http, updatesService) {
    $scope.noActionInc = 0

    $scope.onMouseUpCallbacks = [];

    $scope.isScreeensaverOn = false;
    $scope.useScreensaver = false;

    $(document).ready(function () {

        isMobile = window.matchMedia("only screen and (max-width: 760px)");

        if (isMobile.matches) {
            $scope.useScreensaver = true;
            $("#screensaver-tuggel").addClass("active");
        }

        document.body.ontouchend = function () {
            $scope.onMouseUpCallbacks.forEach((method) => {
                method();
            });
        }

        document.body.onmouseup = function () {
            $scope.onMouseUpCallbacks.forEach((method) => {
                method();
            });
        }

        document.body.ontouchstart = function () {
            if (!$scope.useScreensaver)
                return;
            $scope.noActionInc = 0;
            if ($scope.isScreeensaverOn) {
                $scope.isScreeensaverOn = false;
                $('#fsModal').modal('hide');
            }
        }

        document.body.onmousedown = function () {
            if (!$scope.useScreensaver)
                return;
            $scope.noActionInc = 0;
            if ($scope.isScreeensaverOn) {
                $scope.isScreeensaverOn = false;
                $('#fsModal').modal('hide');
            }
        }
        setInterval(() => {
            if (!$scope.useScreensaver)
                return;
            $scope.noActionInc++;
            if ($scope.isScreeensaverOn == false && $scope.noActionInc > 90) {// after 30 seconds of not tuching screnn
                $('#fsModal').modal('show');
                $scope.isScreeensaverOn = true;
            }
        }, 1000)
    });

    $scope.ShowScreensaver = () => {
        if (!$scope.useScreensaver)
            return;

        $('#fsModal').modal('show');
        $scope.isScreeensaverOn = true;
    };

    $scope.CreateAcTempSlider = (device) => {
        device.acTempSlider = {
            value: device.ac.temp,
            options: {
                floor: 16,
                ceil: 30,
                showSelectionBar: true,
                translate: function (value) {
                    return value + '°';
                },
                id: device.deviceID + 'acTemp',
                onChange: function (id) {
                    device.ac.temp = device.acTempSlider.value;

                    device.acTempSlider.hasChanged = true;
                },
                getPointerColor: function (value) {
                    return '#121540';
                },
                getSelectionBarColor: function (value) {
                    return '#121571';
                }
            }
        }
        $scope.onMouseUpCallbacks.push(() => {
            if (!(device.acTempSlider.hasChanged))
                return;
            device.acTempSlider.hasChanged = false;
            // TODO send to API
            $scope.SetAC(device);
        })
    }

    $scope.CreateBrightnessSlider = (device) => {
        device.brightnessSlider = {
            value: device.bright,
            options: {
                floor: 1,
                ceil: 100,
                showSelectionBar: true,
                translate: function (value) {
                    return value + '%';
                },
                id: device.deviceID + 'brightness',
                onChange: function (id) {
                    device.bright = device.brightnessSlider.value;
                    device.brightnessSlider.hasChanged = true;
                },
                getPointerColor: function (value) {
                    return '#ffcc00';
                },
                getSelectionBarColor: function (value) {
                    if (value <= 30)
                        return '#fff0b3';
                    if (value <= 60)
                        return '#ffe680';
                    if (value <= 90)
                        return '#ffdb4d';
                    return '#ffd11a';
                }
            }
        }
        $scope.onMouseUpCallbacks.push(() => {
            if (!(device.brightnessSlider.hasChanged))
                return;
            device.brightnessSlider.hasChanged = false;
            // send to API
            $scope.SetLight(device, 'light');
        })
    }

    $scope.CreateWhiteTempSlider = (device) => {
        device.whiteTempSlider = {
            value: device.white_temp,
            options: {
                floor: 1,
                ceil: 100,
                showSelectionBar: true,
                translate: function (value) {
                    return '-' + value + '%';
                },
                id: device.deviceID + 'whitetemp',
                onChange: function (id) {
                    device.white_temp = device.whiteTempSlider.value;
                    device.whiteTempSlider.hasChanged = true;
                },
                getPointerColor: function (value) {
                    return '#ff9900';
                },
                getSelectionBarColor: function (value) {
                    if (value <= 30)
                        return '#ffebcc';
                    if (value <= 60)
                        return '#ffd699';
                    if (value <= 90)
                        return '#ffc266';
                    return '#ffad33';
                }
            }
        }
        $scope.onMouseUpCallbacks.push(() => {
            if (!(device.whiteTempSlider.hasChanged))
                return;
            device.whiteTempSlider.hasChanged = false;
            // TODO send to API
            $scope.SetLight(device, 'white_temp');
        })
    }

    $scope.CreateColorSlider = (device) => {
        device.colorSlider = {};

        device.redSlider = {
            value: device.light_color.red,
            options: {
                floor: 1,
                ceil: 255,
                vertical: true,
                showSelectionBar: true,
                translate: function (value) {
                    return '';
                },
                id: device.deviceID + 'red',
                onChange: function (id) {
                    device.colorSlider.hasChanged = true;
                    device.light_color.red = device.redSlider.value;
                },
                getPointerColor: function (value) {
                    return 'red';
                },
                getSelectionBarColor: function (value) {
                    return 'red';
                }
            }
        }

        device.greenSlider = {
            value: device.light_color.green,
            options: {
                floor: 1,
                ceil: 255,
                vertical: true,
                showSelectionBar: true,
                translate: function (value) {
                    return '';
                },
                id: device.deviceID + 'green',
                onChange: function (id) {
                    device.colorSlider.hasChanged = true;
                    device.light_color.green = device.greenSlider.value;
                },
                getPointerColor: function (value) {
                    return 'green';
                },
                getSelectionBarColor: function (value) {
                    return 'green';
                }
            }
        }

        device.blueSlider = {
            value: device.light_color.blue,
            options: {
                floor: 1,
                ceil: 255,
                vertical: true,
                showSelectionBar: true,
                translate: function (value) {
                    return '';
                },
                id: device.deviceID + 'blue',
                onChange: function (id) {
                    device.colorSlider.hasChanged = true;
                    device.light_color.blue = device.blueSlider.value;
                },
                getPointerColor: function (value) {
                    return 'blue';
                },
                getSelectionBarColor: function (value) {
                    return 'blue';
                }
            }
        }
        $scope.onMouseUpCallbacks.push(() => {
            if (!(device.colorSlider.hasChanged))
                return;
            device.colorSlider.hasChanged = false;
            // TODO send to API
            $scope.SetLight(device, 'light_color');
        })
    }


    $scope.GetDeviceClass = (device) => {
        if (device.isSwitch)
            return '';
        else if (device.isAC)
            return 'card-ac';

        var lightClass = '';
        if (device.isBrightness)
            lightClass += ' card card-brightness ';
        if (device.isWhiteTemp)
            lightClass += ' card-white-color ';
        if (device.isColor)
            lightClass += ' card-color ';
        return lightClass;
    }
    /// END


    $scope.devices = [];

    $scope.updateDeviceProps = (device, deviceProps) => {
        device.state = deviceProps.state;

        if (device.isBrightness) {
            device.bright = deviceProps.bright;
            device.brightnessSlider.value = device.bright;
        }

        if (device.isWhiteTemp) {
            device.white_temp = deviceProps.white_temp;
            device.whiteTempSlider.value = device.white_temp;
        }

        if (device.isColor) {
            device.light_color = deviceProps.light_color;
            device.redSlider.value = device.light_color.red;
            device.greenSlider.value = device.light_color.green;
            device.blueSlider.value = device.light_color.blue;
        }

        if (device.isAC) {
            device.ac = deviceProps.ac;
            device.acTempSlider.value = device.ac.temp;
        }

    };
    // updates
    updatesService.GivCallbackToListen((data) => {
        $scope.devices.forEach((item, index) => {
            if (item.deviceID == data.deviceID) {
                $scope.updateDeviceProps(item, data.data);
                $scope.$apply();
            }
        })
    });

    $scope.GetDevices = function () {
        $scope.devices = [];
        $scope.loading = true;
        $http({
            url: 'devices',
            method: 'GET'
        })
            .then(function (response) {
                $scope.loading = false;
                console.log("get devices successfully");
                Object.keys(response.data).forEach((key) => {
                    var device = response.data[key];
                    device.deviceID = key;

                    if (device.types.indexOf('ac') != -1) {
                        device.typeName = 'ac';
                        device.isAC = true;
                        $scope.CreateAcTempSlider(device);
                    }
                    else if (device.types.indexOf('light') != -1) {
                        device.typeName = 'light';
                        device.isBrightness = true;
                        $scope.CreateBrightnessSlider(device);
                        if (device.types.indexOf('white_temp') != -1) {
                            device.typeName = 'white_temp';
                            device.isWhiteTemp = true;
                            $scope.CreateWhiteTempSlider(device);
                        }
                        if (device.types.indexOf('light_color') != -1) {
                            device.typeName = 'light_color';
                            device.isColor = true;
                            $scope.CreateColorSlider(device);
                        }
                    } else {
                        device.isSwitch = true;
                    }
                    $scope.devices.push(device);
                });
            },
            function (response) { // optional
                $scope.loading = false;
                $scope.ErrorResponse(response);
            });
    };

    $scope.GetDevices();

    $scope.GetDevice = function (device) {
        device.sending = true;
        $http({
            url: 'devices/' + device.deviceID,
            method: 'GET'
        })
            .then(function (response) {
                device.sending = false;
                $scope.updateDeviceProps(device, response.data);
            },
            function (response) { // optional
                device.sending = false;
                $scope.ErrorResponse(response);
            });
    };

    $scope.SetState = function (device) {

        device.state = device.state == 'on' ? 'off' : 'on';
        device.sending = true;
        $http({
            url: 'devices/' + device.deviceID,
            method: "PUT",
            data: { 'type': 'switch', 'value': device.state }
        })
            .then(function (response) {
                console.log("change device successfully");
                device.sending = false;
            },
            function (response) { // optional
                device.sending = false;
                $scope.ErrorResponse(response, device);
            });
    };

    $scope.SetLight = (device, PropToChange) => {
        device.sending = true;
        $http({
            url: 'devices/' + device.deviceID,
            method: "PUT",
            data: { 'type': PropToChange, 'value': PropToChange == 'light' ? device['bright'] : device[PropToChange] }
        })
            .then(function (response) {
                device.sending = false;
                console.log("change device light successfully");
            },
            function (response) {
                device.sending = false;
                $scope.ErrorResponse(response, device);
            });
    }

    $scope.ErrorResponse = (response, device) => {

        if (response.status && response.status != 403 && device)
            $scope.GetDevice(device);
        var message = response.data;
        if ((typeof response.data) != 'string')
            message = JSON.stringify(response.data);
        swal({
            title: "Error with requst action",
            text: response.status == 0 ? 'NO LAN CONNECTION' : message,
            icon: "warning",
            timer: 60000
        });
    }


    $scope.SetAC = (device) => {
        device.sending = true;
        $http({
            url: 'devices/' + device.deviceID,
            method: "PUT",
            data: { 'type': 'ac', 'value': device.ac }
        })
            .then(function (response) {
                device.sending = false;
                console.log("change device ac successfully");
            },
            function (response) { // optional
                device.sending = false;
                $scope.ErrorResponse(response, device);
            });

    }

    $scope.RefreshData = () => {

        $scope.devices = [];
        $scope.loading = true;
        $http({
            url: 'refresh',
            method: "POST"
        })
            .then(function (response) {
                console.log("devices refreshd successfully");
                $scope.GetDevices();
            },
            function (response) { // optional
                $scope.ErrorResponse(response);
            });
    }

    $scope.ShowDetails = (device) => {
        swal(device.name, 'ID: ' + device.deviceID + '\nBRAND: ' + device.brand + '\nMODEL: ' + device.model + '\nMAC: ' + device.mac + '\nIP: ' + device.ip + '\nVENDOR: ' + device.vendor);
    }

    $scope.FullScreen = () => {
        document.documentElement.webkitRequestFullScreen();
    }

});

IoTApp.controller('loginCtrl', function ($scope, $http) {
    $scope.Login = function () {
        $scope.error = "";
        var data = { "userName": $scope.userName, "password": $scope.password }
        $http({
            url: 'login',
            method: "POST",
            data: data
        })
            .then(function (response) {
                console.log("login successfully");
                swal({
                    title: "Login successfully",
                    icon: "success",
                    timer: 60000
                });
            },
            function (response) { // optional
                console.error("error in login");
                swal({
                    title: "Error in login",
                    text: "usename or password incorrect",
                    icon: "warning",
                    timer: 60000
                });
            });
    };

    $scope.Logout = function (all) {
        $scope.error = "";
        $http({
            url: 'logout/' + (all ? 'all' : ''),
            method: "POST"
        })
            .then(function (response) {
                console.log("logout successfully");
                swal({
                    title: "Requst done",
                    icon: "success",
                    timer: 60000
                });
            },
            function (response) { // optional
                console.error("error in logout");

                swal({
                    title: "Error in requst",
                    text: response.data,
                    icon: "warning",
                    timer: 60000
                });
            });
    };
});

IoTApp.controller('timingsCtrl', function ($scope, $http) {
    $scope.SetTimingsAsLists = (timingsStruct) => {
        $scope.dailyTimings = [];
        $scope.onceTimings = [];
        $scope.timerTimings = [];
        $scope.GetActions((actions, err) => {
            Object.keys(timingsStruct).forEach((key) => {
                var currTiming = timingsStruct[key];
                currTiming.id = key;
                currTiming.triggerName = actions[currTiming.trigger].name;

                switch (currTiming.timingType) {
                    case "daily":
                        $scope.dailyTimings.push(currTiming);
                        break;
                    case "once":
                        $scope.onceTimings.push(currTiming);
                        break;
                    case "timer":
                        var startTime = new Date(currTiming.startTime);
                        currTiming.startTime = startTime.toLocaleTimeString();
                        startTime.setTime(startTime.getTime() + (currTiming.durationInMinuts * 60000)); // add the minuts to get operat time
                        currTiming.operateTime = startTime.toLocaleTimeString();
                        $scope.timerTimings.push(currTiming);
                        break;
                    default:
                        break;
                }
            });

        })
    };

    $scope.GetActions = function (callback) {

        $http({
            url: 'events',
            method: 'GET'
        })
            .then(function (response) {
                console.log("get actions successfully");
                callback(response.data);
            },
            function (response) {
                callback({}, response);
            });
    };

    $scope.GetTimings = function () {

        $http({
            url: 'timings',
            method: 'GET'
        })
            .then(function (response) {
                console.log("get timings successfully");
                $scope.SetTimingsAsLists(response.data);
            },
            function (response) {

            });
    };

    $scope.GetTimings();

    $scope.events = [];
    $scope.GetActions((events, err) => {
        if (err)
            return;

        Object.keys(events).forEach((id) => {
            var event = events[id];
            event.id = id;
            $scope.events.push(event);
        });
    });

    $scope.newDailyDays = {};
    $scope.CreateDaly = (selectedEventToTimer, selectedTimeToDaily) => {
        var daysArray = [];
        Object.keys($scope.newDailyDays).forEach((day) => {
            if ($scope.newDailyDays[day] == true)
                daysArray.push(day);
        })
        $http({
            url: 'timings',
            method: 'POST',
            data: {
                timingType: "daily",
                days: daysArray,
                time: selectedTimeToDaily.getHours() + ":" + selectedTimeToDaily.getMinutes(),
                trigger: selectedEventToTimer,
                active: "on"
            }
        })
            .then(function (response) {
                console.log("carete daily timing successfully");
                $scope.GetTimings();
                swal({
                    title: "Carete daily timing successfully",
                    icon: "success",
                    timer: 60000
                });
            },
            function (response) {
                swal({
                    title: "Carete daily fail",
                    text: response.data,
                    icon: "warning",
                    timer: 60000
                });
            });
    };

    $scope.CreateTimer = (selectedEventToTimer, selectedMinutsToTimer) => {
        $http({
            url: 'timings',
            method: 'POST',
            data: {
                timingType: "timer",
                durationInMinuts: selectedMinutsToTimer,
                trigger: selectedEventToTimer,
                active: "on"
            }
        })
            .then(function (response) {
                console.log("carete timer successfully");
                $scope.GetTimings();
                swal({
                    title: "Carete timer successfully",
                    icon: "success",
                    timer: 60000
                });
            },
            function (response) {
                swal({
                    title: "Carete timer fail",
                    text: response.data,
                    icon: "warning",
                    timer: 60000
                });
            });
    };

    $scope.CreateOnceTiming = (selectedEventToOnce, selectedTimeToOnce) => {
        var t = selectedTimeToOnce; //new Date();
        $http({
            url: 'timings',
            method: 'POST',
            data: {
                timingType: "once",
                date: t.getDate() + '-' + (t.getMonth() + 1) + '-' + (t.getFullYear() % 100),
                time: t.getHours() + ':' + t.getMinutes(),
                trigger: selectedEventToOnce,
                active: "on"
            }
        })
            .then(function (response) {
                console.log("carete once timing successfully");
                $scope.GetTimings();
                swal({
                    title: "Carete once timing successfully",
                    icon: "success",
                    timer: 60000
                });
            },
            function (response) {
                swal({
                    title: "Carete once timing fail",
                    text: response.data,
                    icon: "warning",
                    timer: 60000
                });
            });
    };


    $scope.TuggelTimingActive = function (timing) {

        var newTiming = JSON.parse(JSON.stringify(timing));
        delete newTiming['id'];
        delete newTiming['triggerName'];
        newTiming['active'] = timing.active == 'on' ? 'off' : 'on';
        $http({
            url: 'timings/' + timing.id,
            method: 'PUT',
            data: newTiming
        })
            .then(function (response) {
                console.log("chnage timings active successfully");
                timing.active = newTiming['active'];

            },
            function (response) {

            });
    };

    $scope.RemoveTiming = (id) => {
        $http({
            url: 'timings/' + id,
            method: 'DELETE'
        })
            .then(function (response) {
                console.log("DELETE timing successfully");
                $scope.GetTimings();
                swal({
                    title: "Removed timing successfully",
                    icon: "success",
                    timer: 60000
                });
            },
            function (response) {
                swal({
                    title: "Removed timing fail",
                    text: response.data,
                    icon: "warning",
                    timer: 60000
                });
            });
    }
});

IoTApp.controller('actionsCtrl', function ($scope, $http) {
    $scope.GetActions = function () {
        $http({
            url: 'events',
            method: 'GET'
        })
            .then(function (response) {
                console.log("get actions successfully");

                var temp = response.data;
                $scope.GetDevices((devices) => {

                    $scope.events = [];
                    Object.keys(temp).forEach((key) => {
                        var item = temp[key];
                        item.id = key;
                        item.actions.forEach((i) => {
                            if (i.deviceID in devices)
                                i.deviceName = devices[i.deviceID].name;
                            else
                                i.deviceName = i.deviceID + " - id not exist in devices";
                        })

                        $scope.events.push(item);
                    });

                });

            },
            function (response) {
            });
    };
    $scope.GetActions();

    $scope.GetDevices = function (callback) {

        $http({
            url: 'devices',
            method: 'GET'
        })
            .then(function (response) {
                console.log("get devices successfully");
                callback(response.data);
            },
            function (response) {
                callback({}, response);
            });
    };

    $scope.RunEvent = function (event) {

        $http({
            url: 'events/invoke/' + event.id,
            method: 'POST'
        })
            .then(function (response) {
                console.log("event invoked successfully");
                swal({
                    title: "Event invoked successfully",
                    icon: "success",
                    timer: 60000
                });
            },
            function (response) {
                console.log("error while event invoked");
                swal({
                    title: "Error while event invoked",
                    text: response.data,
                    icon: "warning",
                    timer: 60000
                });
            });
    };

});

IoTApp.controller('logsCtrl', function ($scope, $http) {
    $scope.logRoes = 2000;
    $scope.showSecutity = false;
    $scope.GetLogs = function () {
        $scope.message = "Getting logs from server...";
        $http({
            url: 'logs/' + ($scope.showSecutity ? '1/' : '0/') + $scope.logRoes,
            method: 'GET'
        })
            .then(function (response) {
                console.log("get logs successfully");

                $scope.logs = response.data;

                $scope.logs.forEach((log) => {
                    log.time = new Date(log.time).toLocaleString();
                });
                $scope.message = "";
            },
            function (response) {
                $scope.message = response.data;
            });
    };

    $scope.GetLogs();
});

IoTApp.controller('networkCtrl', function ($scope, $http) {
    $scope.GetNetWork = function () {
        $http({
            url: 'network',
            method: 'GET'
        })
            .then(function (response) {
                console.log("get network successfully");
                var devicesMap = response.data;

                $scope.lanDevices = [];
                Object.keys(devicesMap).forEach((mac) => {
                    $scope.lanDevices.push(devicesMap[mac]);
                });
            },
            function (response) {

            });
    };

    // for class, to set color for convoy row
    $scope.getColor = function (device) {
        if ($scope.selectedDevice && $scope.selectedDevice.mac == device.mac) {
            return "info";
        }
        return "";
    };

    $scope.selectDevice = function (device) {
        $scope.selectedDevice = device;
    };

    $scope.ScanLanDevices = () => {
        $scope.message = "Scaning LAN network...";
        $scope.lanDevices = [];
        $http({
            url: 'network/refresh',
            method: 'POST'
        })
            .then(function (response) {
                var devicesMap = response.data;

                $scope.lanDevices = [];
                Object.keys(devicesMap).forEach((mac) => {
                    $scope.lanDevices.push(devicesMap[mac]);
                });
                $scope.message = "";
            },
            function (response) {
                $scope.message = "";
                swal({
                    title: 'Error in requst',
                    text: response.data,
                    icon: "warning",
                    timer: 60000
                });
            });
    }

    $scope.UpdateLanName = (mac, name) => {
        $http({
            url: 'network/' + mac + '/' + name,
            method: 'POST'
        })
            .then(function (response) {
                console.log("SET NAME successfully");
                swal({
                    text: 'Name changed successfuly',
                    icon: "success",
                    timer: 60000
                });

                $scope.GetNetWork();

            },
            function (response) {
                swal({
                    title: 'Error in requst',
                    text: response.data,
                    icon: "warning",
                    timer: 60000
                });
            });

    };

    $scope.SetName = (device) => {

        swal({
            title: 'Edit name',
            text: 'Deviec mac: ' + device.mac + '\nVendor: ' + device.vendor,
            content: "input",
            buttons: [true, "Update name"],
        })
            .then((value) => {
                if (value == "")
                    swal({
                        text: 'Enter valid name',
                        icon: "warning",
                        timer: 60000
                    });
                else if (value)
                    $scope.UpdateLanName(device.mac, value);
            });
    }

    $scope.GetNetWork();
});

// // angular SPA routing definition
IoTApp.config(function ($routeProvider) {
    $routeProvider
        .when('/main', {
            templateUrl: '/static/view/main.html',
            controller: 'mainCtrl'
        }).when('/timings', {
            templateUrl: '/static/view/timings.html',
            controller: 'timingsCtrl'
        }).when('/actions', {
            templateUrl: '/static/view/actions.html',
            controller: 'actionsCtrl'
        }).when('/login', {
            templateUrl: '/static/view/login.html',
            controller: 'loginCtrl'
        }).when('/logs', {
            templateUrl: '/static/view/logs.html',
            controller: 'logsCtrl'
        }).when('/network', {
            templateUrl: '/static/view/network.html',
            controller: 'networkCtrl'
        }).when('/about', {
            templateUrl: '/static/view/about.html',
            controller: 'aboutCtrl'
        }).otherwise({
            redirectTo: '/main'
        });
});
