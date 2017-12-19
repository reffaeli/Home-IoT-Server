var logger = require('./logs');

var request = require('request');
var fs = require('fs')

var weather = {};
var hebrewCal = {};

var downloadFile = function (uri, filename, callback) {
    request.head(uri, function (err, res, body) {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

var ReadHebrewCal = (callback) => {
    var d = new Date();
    var hebrewCalReq = {
        url: 'http://www.hebcal.com/converter/?cfg=json&gy=' +
            d.getFullYear() + '&gm=' + (d.getMonth() + 1) + '&gd=' + d.getDate() + (weather.sys.sunset * 1000 > d ? '' : '&gs=1') + '&g2h=1',
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
        if (callback)
            callback();
        // TODO image icon also
    });
};

logger.write.info("Start reading screensaver info...");
ReadWeather(ReadHebrewCal);

setInterval(ReadWeather, 60000);
setInterval(ReadHebrewCal, 300000);



var GetScreensaverInfo = (next) => {

    weather['hebrew'] = hebrewCal.hebrew;

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

module.exports = {
    GetScreensaverInfo: GetScreensaverInfo,
    CreateWeatherImageCach: CreateWeatherImageCach
}
