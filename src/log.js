/*jslint node: true */

/*global console*/
/*global exports*/
/*global Date*/
"use strict";

var logCb;
function setup(loggerCb) {
    logCb = loggerCb;
}

function pad(value) {
    if (value <= 9) {
        return "0" + value;
    }
    return value;
}

function ts() {
    var date = new Date(),
        y = date.getFullYear(),
        M = pad(date.getMonth() + 1),
        d = pad(date.getDate()),
        h = pad(date.getHours()),
        m = pad(date.getMinutes()),
        s = pad(date.getSeconds());

    return y + "-" + M + "-" + d + " " + h + ":" + m + ":" + s + " ";
}

function log(str, type) {
    var info = ts() + type + ": " + str;
    if (typeof logCb === "function") {
        logCb(str, type);
    }
    return console.log(info);
}

function info(str) {
    return log(str, "INFO");
}

function error(str) {
    return log(str, "ERROR");
}

function warn(str) {
    return log(str, "WARN");
}

exports.setup = setup;
exports.info = info;
exports.error = error;
exports.warn = warn;
