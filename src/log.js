/*global console*/
/*global exports*/
/*global Date*/
"use strict";

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

function info(str) {
    return console.log(ts() + "INFO: " + str);
}

function error(str) {
    return console.log(ts() + "ERROR:" + str);
}

function warn(str) {
    return console.log(ts() + "WARN: " + str);
}

exports.info = info;
exports.error = error;
exports.warn = warn;
