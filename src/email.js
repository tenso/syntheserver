/*jslint node: true */

/*global exports*/
/*global require*/

"use strict";

var nodemailer = require("nodemailer"),
    fs = require("fs"),
    config,
    transport,
    log = require("./log.js");

function sendInvite(to, link) {
    var mail = {
        to: to,
        from: "syntesounds",
        subject: "Welcome to synthesounds!",
        text: "Please use the link to complete the account:" + link,
        html: "Please follow the link to complete the account: <a href=\"" + link + "\">" + link + "</a>"
    },
        confData;

    if (!config) {
        try {
            confData = fs.readFileSync("../cfg_user/mail_config.json", "utf8");
            config = JSON.parse(confData);
        } catch (err) {
            log.error("read mail config:" + err);
        }
        transport = nodemailer.createTransport(config);
    }
    log.info("sending invite to:" + to + " link:" + link);
    transport.sendMail(mail, function (err, info) {
        if (err) {
            log.error(err);
        } else {
            log.info("sent mail ok");
        }
    });
}

exports.sendInvite = sendInvite;
