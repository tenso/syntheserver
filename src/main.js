/*global require*/
/*global log*/
/*global process*/

"use strict";
var db = require("./database.js"),
    log = require("./log.js"),
    MongoClient = require("mongodb"),
    url = "mongodb://localhost:27017/synthesound",
    express = require("express");

log.info("start server");

MongoClient.connect(url, function (err, database) {
    if (err !== null) {
        log.info("failed to connect to server: " + url);
        log.info(err);
    } else {
        log.info("connected to: " + url);
    }
    db.setDb(database);

    /*db.getUser("test.perso@mail.com", function (err, reslut) {
        console.log(err);
        console.log(reslut);
        db.close();
    });*/

    db.insertUser("Test Person", "test.person@mail.com", "abc123", function (err, result) {
        if (err) {
            log.info(err);
        }
        db.updateUser("test.person@mail.com", "test.person@mail.com", "Fest Person", "code123", function (err, result) {
            if (err) {
                log.info(err);
            }
            db.removeUser("tests.person@mail.com", function (err, results) {
                if (err) {
                    log.info(err);
                }
                db.addUserFile("test.person@mail.com", "file1.json", {data: "yes", dota: "no"}, function (err, result) {
                    if (err) {
                        console.log(err);
                    }
                    db.addUserFile("test.person@mail.com", "file2.json", {data: "no", dota: "2"}, function (err, result) {
                        if (err) {
                            console.log(err);
                        }
                        /*var stream = db.users().find().stream();
                        stream.on("data", function (item) {
                            log.info(item);
                        });
                        stream.on("end", function (item) {
                            log.info("<---done");
                        });*/
                        db.getUserFile("test.person@mail.com", "file1.json", function (err, result) {
                            if (err) {
                                log.info(err);
                            } else {
                                log.info(result);
                            }
                            db.removeUserFile("test.person@mail.com", "file1.json", function (err, result) {
                                if (err) {
                                    log.info(err);
                                }
                                db.close();
                            });
                        });
                    });
                });
            });
        });
    });
});


