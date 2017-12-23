var logger = require('./logs');

var request = require('request');
var fs = require('fs')

var weather = {};
var hebrewCal = {};
var hebrewShabat = {};

var downloadFile = function (uri, filename, callback) {
    request.head(uri, function (err, res, body) {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

var ReadHebrewShabbat = (callback) => {
    var hebrewCalShabbat = {
        url: 'http://www.hebcal.com/shabbat/?cfg=json&geonameid=294801&m=40&a=on&b=30',
        method: 'GET'
    }
    request(hebrewCalShabbat, function (error, response, hebrewShabbatBody) {
        if (error) {
            logger.write.warn("Error while getting hebrewCalShabbat from www.hebcal.com :" + error);
            return;
        }
        var fullShabatInfo = JSON.parse(hebrewShabbatBody);

        fullShabatInfo.items.forEach(element => {
            switch (element.category) {
                case 'candles':
                    hebrewShabat.candles = element.date;
                    break;
                case 'parashat':
                    hebrewShabat.parashat = element.hebrew;
                    break;
                case 'havdalah':
                    hebrewShabat.havdalah = element.date;
                    break;

                default:
                    break;
            }
        });

        if (callback)
            callback();
    });
}

var ReadHebrewCal = (callback) => {
    var d = new Date();
    var hebrewCalReq = {
        url: 'http://www.hebcal.com/converter/?cfg=json&gy=' +
            d.getFullYear() + '&gm=' + (d.getMonth() + 1) + '&gd=' + d.getDate() + (weather.sys.sunset > d ? '' : '&gs=1') + '&g2h=1',
        method: 'GET'
    }
    request(hebrewCalReq, function (error, response, hebrewCalBody) {
        if (error) {
            logger.write.warn("Error while getting hebrew cal data from www.hebcal.com :" + error);
            return;
        }
        hebrewCal = JSON.parse(hebrewCalBody);
        if (callback)
            callback();
    });
}

var ReadWeather = (callback) => {
    // Configure the request
    var weatherReq = {
        url: 'http://api.openweathermap.org/data/2.5/weather?id=293845&units=metric&appid=b4307327514f6f9aa8e28ab0e65a930b',
        method: 'GET'
    }

    // Start the request
    request(weatherReq, function (error, response, weatherBody) {
        if (error) {
            logger.write.warn("Error while getting weather data from openweathermap.org :" + error);
            return;
        }

        weather = JSON.parse(weatherBody)
        var date = new Date(); 
        var sunrise = new Date(weather.sys.sunrise * 1000);
        var sunset = new Date(weather.sys.sunset * 1000);
        // weather not update allways so use yesterday times... saad
        sunrise.setFullYear(date.getFullYear());
        sunrise.setMonth(date.getMonth());
        sunrise.setDate(date.getDate());
        sunset.setFullYear(date.getFullYear());
        sunset.setMonth(date.getMonth());
        sunset.setDate(date.getDate());
        
        weather.sys.sunrise = sunrise;
        weather.sys.sunset = sunset;

        if (callback)
            callback();
    });
};

logger.write.info("Start reading screensaver info...");
ReadWeather(ReadHebrewCal);
ReadHebrewShabbat();

setInterval(ReadWeather, 60000); // every minus
setInterval(ReadHebrewCal, 600000); // every 10 minuts
setInterval(ReadHebrewShabbat, 3.6e+6); // every hour



var GetScreensaverInfo = (next) => {

    weather['hebrew'] = hebrewCal.hebrew;
    weather['shabat'] = hebrewShabat;

    next(weather);
}

var CreateWeatherImageCach = (filename, callback) => {
    var filePath = __dirname + '/../cache/' + filename;
    if (fs.existsSync(filePath))
        callback();
    else {
        downloadFile('http://openweathermap.org/img/w/' + filename, filePath, () => {
            logger.write.info('Finish download ' + filename + ' file to cache');
            callback();
        })
    }
}

var GetCurrentWallpaper = (is_desktop, callback) => {
    var date = new Date();
    var isDesktop = is_desktop == '1';
    var path = '';
    var dayinweek = date.getDay() + 1;

    if (dayinweek >= 6) { // 6
        try {

            if (dayinweek == 6) { // ==
                var shabatEntiring = new Date(weather.sys.sunset - 1.8e+6); // 30 minus
                isSabbat = date > shabatEntiring;
            } else {
                var shabatExsiting = new Date(weather.sys.sunset + 2.4e+6); // 40 minuts
                isSabbat = date < shabatExsiting;
            }

            if (isSabbat) {
                callback("/shabat/" + (isDesktop ? "desktop" : "mobile") + ".jpg");
                return;
            }
        } catch (error) { }
    }

    if (isDesktop)// desktop
        path = "desktop/" + (date.getMilliseconds() % 37);
    else
        path = "mobile/" + (date.getMilliseconds() % 79);

    path +=  ".jpg";
    callback(path);
}

module.exports = {
    GetScreensaverInfo: GetScreensaverInfo,
    CreateWeatherImageCach: CreateWeatherImageCach,
    GetCurrentWallpaper: GetCurrentWallpaper
}
