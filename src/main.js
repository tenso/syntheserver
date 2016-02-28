/*jslint nomen: true*/
/*jslint es5: true*/
/*jslint node: true */

/*global require*/
/*global log*/
/*global process*/
/*global __dirname*/

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
    email = require("./email.js"),
    bodyParser = require("body-parser"),
    app = express(),
    staticContentPath = "../../synthesound/src/",
    debug = {
        noLogin: false,
        noEmail: false
    };

log.info("start");

function errorJson(module, path, info) {
    return {
        ok: 0,
        error: {
            module: module,
            path: path,
            info: info
        }
    };
}
//FIXME: req.session.admin should probably not be in session cookie!
function validUser(req, res, next) {
    if (debug.noLogin) {
        next();
    } else if (req.session.email === req.params.email || req.session.admin) {
        next();
    } else {
        log.warn(req.session.email + " not valid for:" + req.params.email);
        res.sendStatus(401);
    }
}

function validAdminUser(req, res, next) {
    if (debug.noLogin) {
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
                if (result.info.validated) {
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
                    log.warn("failed login, user not validated:" + req.query.email);
                    res.sendStatus(401);
                }
            } else {
                log.warn("failed login, no user:" + req.query.email);
                res.sendStatus(401);
            }
        });
    });

    app.get("/register", function (req, res) {
        var validationLink;
        db.addUser("", req.query.email, req.query.password, function (err, result) {
            if (err) {
                log.error("failed to register:" + err);
                res.json(errorJson("get", "/register", err));
            } else {
                db.getUser(req.query.email, function (err, result) {
                    if (err) {
                        res.json(errorJson("get", "/register", err));
                    } else {
                        res.json({
                            ok: 1,
                            registerd: 1,
                            validated: 0
                        });
                    }
                    validationLink = req.protocol + "://" + req.hostname +
                        "/register/validate?email=" + req.query.email + "&" + "uuid=" + result.info.uuid;

                    if (debug.noEmail) {
                        log.info("would have sent link:" + validationLink);
                    } else {
                        email.sendInvite(req.query.email, validationLink);
                    }
                });
            }
        });
    });

    app.get("/register/validate", function (req, res) {
        var validationLink;
        db.getUser(req.query.email, function (err, result) {
            if (err) {
                log.error("failed to validate, get user failed:" + err);
                res.sendFile("validation_error.html", {root: __dirname + "/html/"}, function (err) {
                    if (err) {
                        log.error(err);
                    }
                });
            } else {
                if (result.info.uuid === req.query.uuid) {
                    db.validateUser(req.query.email, function (err, result) {
                        if (err) {
                            log.error("failed to validate user:" + err);
                            res.sendFile("validation_error.html", {root: __dirname + "/html/"}, function (err) {
                                if (err) {
                                    log.error(err);
                                }
                            });
                        } else {
                            log.info("validated:" + req.query.email);
                            res.sendFile("validation_success.html", {root: __dirname + "/html/"}, function (err) {
                                if (err) {
                                    log.error(err);
                                }
                            });
                        }
                    });
                } else {
                    log.error("failed to validate user: wrong uuid");
                    res.sendFile("validation_error.html", {root: __dirname + "/html/"}, function (err) {
                        if (err) {
                            log.error(err);
                        }
                    });
                }
            }
        });
    });

    app.get("/logout", function (req, res) {
        log.info("logout:" + req.session.email);
        req.session.destroy();
        res.json({
            ok: 1,
            login: false
        });
    });

    app.get("/users/", validAdminUser, function (req, res) {
        db.getUsers(function (err, result) {
            if (err) {
                res.json(errorJson("get", "*", err));
            } else {
                res.json(result);
            }
        });
    });

    app.get("/logs", validAdminUser, function (req, res) {
        db.getLogs(function (err, result) {
            if (err) {
                res.json(errorJson("get", "*", err));
            } else {
                res.json(result);
            }
        });
    });

    app.get("/self", function (req, res) {
        log.info("request self:" + req.connection.remoteAddress);
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
                res.json(errorJson("get", "*", err));
            } else {
                res.json(result);
            }
        });
    });

    app.get("/users/:email/files/:file", validUser, function (req, res) {
        db.getUserFile(req.params.email, req.params.file, function (err, result) {
            if (err) {
                res.json(errorJson("get", req.params.file, err));
            } else {
                res.json(result);
            }
        });
    });

    app.post("/users/:email/files/:file", validUser, function (req, res) {
        log.info(req.params.email + " add file:" + req.params.file);
        db.addUserFile(req.params.email, req.params.file, req.body.data, function (err, result) {
            if (err) {
                res.json(errorJson("post", req.params.file, err));
            } else {
                res.json(result);
            }
        });
    });

    app.patch("/users/:email/files/:file", validUser, function (req, res) {
        log.info(req.params.email + " update file:" + req.params.file);
        db.updateUserFile(req.params.email, req.params.file, req.body.data, function (err, result) {
            if (err) {
                res.json(errorJson("patch", req.params.file, err));
            } else {
                res.json(result);
            }
        });
    });

    app.delete("/users/:email/files/:file", validUser, function (req, res) {
        log.info(req.params.email + " delete file:" + req.params.file);
        db.removeUserFile(req.params.email, req.params.file, function (err, result) {
            if (err) {
                res.json(errorJson("delete", req.params.file, err));
            } else {
                res.json(result);
            }
        });
    });

    return app;
}

function dbLog(str, type) {
    db.addLog(str, type, function (err, result) {
        if (err) {
            console.log("ERROR:" + err);
        }
    });
}

function dbConnected() {
    var cleanDbTimer;
    app.use(bodyParser.json());
    addOpenRoutes(app);
    addSession(app);
    addSessionRoutes(app);

    log.info("start server on port 80");
    app.listen(80, function () {
        log.info("server up");
    });

    db.setRemoveAllUnvalidated(3600, function (err, result) {
        if (err) {
            log.error(err);
        } else {
            log.info("remove unvalidated on: " + result + " after 3600s");
        }
    });

    //FIXME: db.close() on exit
}

MongoClient.connect(url, function (err, database) {
    if (err !== null) {
        log.info("failed to connect to server: " + url);
        log.info(err);
        process.exit(1);
    }
    db.setDb(database);
    log.setup(dbLog);

    db.setLogRotation(2419200, function (err, result) {
        if (err) {
            log.error(err);
        } else {
            log.info("rotate log on: " + result + " after " + 2419200 / (60 * 60 * 24) + " days");
        }
    });

    log.info("connected to: " + url);

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
                            db.validateUser("admin", function (err, result) {
                                if (err) {
                                    log.error("failed to validate admin:" + err);
                                } else {
                                    log.info("admin OK");
                                    log.warn("----------------------------------------------------");
                                    log.warn("You must change admin password through ./admin.sh !!");
                                    log.warn("----------------------------------------------------");
                                    dbConnected();
                                }
                            });
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



