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
    session = require("express-session"),
    bodyParser = require("body-parser"),
    app = express(),
    staticContentPath = "../../synthesound/src/",
    noLogin = false;

log.info("start");

function errorJson(module, path, info) {
    return {
        error: {
            module: module,
            path: path,
            info: info
        }
    };
}
//FIXME: req.session.admin should probably not be in session cookie!
function validUser(req, res, next) {
    if (noLogin) {
        next();
    } else if (req.session.email === req.params.email || req.session.admin) {
        next();
    } else {
        log.warn(req.session.email + " not valid for:" + req.params.email);
        res.sendStatus(401);
    }
}

function validAdminUser(req, res, next) {
    if (noLogin) {
        next();
    } else if (req.session.email && req.session.admin) {
        next();
    } else {
        log.warn("user not valid admin:" + req.query.email);
        res.sendStatus(401);
    }
}

function addSession(app) {
    log.info("add session mangagment");
    app.use(session({
        secret: "change me!",
        resave: false,
        saveUninitialized: false,
        name: "sound.connect.sid"
        /*store: ADD ME!*/
    }));

    return app;
}

function addOpenRoutes(app) {
    log.info("add static content:" + staticContentPath);
    app.use(express.static(staticContentPath));
}

function getUser(email, res) {
    db.getUser(email, function (err, result) {
        if (err) {
            res.json(errorJson("get", "/users/" + email, err));
        } else {
            if (result.info.hasOwnProperty("password")) {
                delete result.info.password;
            }
            res.json(result);
        }
    });
}

function addSessionRoutes(app) {
    log.info("add session routes");

    app.get("/login", function (req, res) {
        db.getUser(req.query.email, function (err, result) {
            if (err) {
                log.error("failed to login:" + err);
                res.sendStatus(401);
            } else if (result) {
                if (result.info.password === req.query.password) {
                    req.session.email = result.email; //FIXME: better: _id
                    req.session.admin = result.info.admin;
                    log.info("login:" + result.email + " admin:" + result.info.admin);
                    getUser(req.session.email, res);
                } else {
                    log.warn("failed login, wrong password:" + req.query.email);
                    res.sendStatus(401);
                }
            } else {
                log.warn("failed login, no user:" + req.query.email);
                res.sendStatus(401);
            }
        });
    });

    app.get("/logout", function (req, res) {
        req.session.destroy();
        res.json({
            ok: 1,
            login: false
        });
    });

    app.get("/users/", validAdminUser, function (req, res) {
        db.getUsers(function (err, result) {
            if (err) {
                res.json(errorJson("get", "/users/", err));
            } else {
                res.json(result);
            }
        });
    });

    app.get("/self", function (req, res) {
        if (req.session.email) {
            getUser(req.session.email, res);
        } else {
            res.json({
                ok: 1,
                login: false
            });
        }
    });

    app.get("/users/:email", validUser, function (req, res) {
        getUser(req.params.email, res);
    });

    app.get("/users/:email/files", validUser, function (req, res) {
        db.getUserFileNames(req.params.email, function (err, result) {
            if (err) {
                res.json(errorJson("get", "/users/:email/files/:file", err));
            } else {
                res.json(result);
            }
        });
    });

    app.get("/users/:email/files/:file", validUser, function (req, res) {
        db.getUserFile(req.params.email, req.params.file, function (err, result) {
            if (err) {
                res.json(errorJson("get", "/users/:email/files/:file", err));
            } else {
                res.json(result);
            }
        });
    });

    app.post("/users/:email/files/:file", validUser, function (req, res) {
        log.info(req.params.email + " add file:" + req.params.file + " with body " + JSON.stringify(req.body));
        db.addUserFile(req.params.email, req.params.file, req.body.data, function (err, result) {
            if (err) {
                res.json(errorJson("post", "/users/:email/files/:file", err));
            } else {
                res.json(result);
            }
        });
    });

    return app;
}

function dbConnected() {
    app.use(bodyParser.json());
    addOpenRoutes(app);
    addSession(app);
    addSessionRoutes(app);

    log.info("start server on port 80");
    app.listen(80, function () {
        log.info("server up");
    });
    //FIXME: db.close() on exit
}

MongoClient.connect(url, function (err, database) {
    if (err !== null) {
        log.info("failed to connect to server: " + url);
        log.info(err);
        process.exit(1);
    }
    log.info("connected to: " + url);
    db.setDb(database);

    db.userExist("admin", function (err, result) {
        if (err) {
            log.error("admin failed:" + err);
        } else if (!result) {
            log.warn("admin user missing, adding admin:admin");
            db.addUser("admin", "admin", "admin", function (err, result) {
                if (err) {
                    log.error("failed to add admin:" + err);
                } else {
                    db.setAdmin("admin", true, function (err, result) {
                        if (err) {
                            log.error("failed to set admin:" + err);
                        } else {
                            log.info("admin OK");
                            dbConnected();
                        }
                    });
                }
            });
        } else {
            log.info("admin OK");
            dbConnected();
        }
    });
});



