/*global require*/
/*global log*/
/*global process*/

/*C: POST
  R: GET
  U: PATCH
  D: DELETE*/

"use strict";

var db = require("./database.js"),
    log = require("./log.js"),
    MongoClient = require("mongodb"),
    url = "mongodb://localhost:27017/synthesound",
    express = require("express"),
    app = express(),
    staticContentPath = "../../synthesound/src/";

log.info("start server");

function errorJson(module, path, info) {
    return {
        error: {
            module: module,
            path: path,
            info: info
        }
    };
}

MongoClient.connect(url, function (err, database) {
    if (err !== null) {
        log.info("failed to connect to server: " + url);
        log.info(err);
        process.exit(1);
    } else {
        log.info("connected to: " + url);
    }
    db.setDb(database);
});

app.get("/users/", function (req, res) {
    db.getUsers(function (err, result) {
        if (err) {
            res.json(errorJson("get", "/users/", err));
        } else {
            res.json(result);
        }
    });
});

app.get("/users/:user", function (req, res) {
    db.getUser(req.params.user, function (err, result) {
        if (err) {
            res.json(errorJson("get", "/users/" + req.params.user, err));
        } else {
            res.json(result);
        }
    });
});

app.use(express.static(staticContentPath));

app.listen(80, function () {
    log.info("server up on port 80");
    log.info("static content:" + staticContentPath);
});

//FIXME: db.close() on exit
