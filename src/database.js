/*global exports*/

"use strict";

var db,
    userCollection,
    w = 1;

function setDb(database) {
    db = database;
    userCollection = db.collection("users");
}

function close() {
    db.close();
}

function userExist(email, cb) {
    userCollection.findOne({email: email}, {
        "_id": 1
    }, function (err, result) {
        if (err) {
            cb("userExist:" + err, result);
        } else {
            if (!result) {
                cb(null, false);
            } else {
                cb(null, true);
            }
        }
    });
}

function getUser(email, cb) {
    userCollection.findOne({email: email}, {
        email: 1,
        info: 1,
        settings: 1,
        "files.name": 1
    }, function (err, result) {
        if (err || !result) {
            cb("getUser: no such user:" + email);
        } else {
            cb(err, result);
        }
    });
}

function addUser(name, email, password, cb) {
    if (name === "" || email === "" || password === "") {
        cb("addUser: field null");
    } else {
        userExist(email, function (err, result) {
            if (err) {
                cb("addUser:" + err);
            } else if (result) {
                cb("addUser: user exist:" + email, result);
            } else {
                userCollection.insert({
                    email: email,
                    info: {
                        name: name,
                        password: password
                    },
                    settings: {
                        debug: false
                    },
                    files: []
                }, {w: w}, cb);
            }
        });
    }
}

function removeUser(email, cb) {
    userExist(email, function (err, result) {
        if (err) {
            cb("removeUser:" + err);
        } else if (result) {
            userCollection.remove({email: email}, {w: w}, cb);
        } else {
            cb("removeUser: no such user:" + email);
        }
    });
}

function updateUser(email, newEmail, newName, newPassword, cb) {
    userExist(email, function (err, result) {
        if (err) {
            cb("updateUser:" + err);
        } else if (result) {
            userCollection.update({email: email}, {
                "$set": {
                    email: newEmail,
                    info: {
                        name: newName,
                        password: newPassword
                    }
                }
            }, {w: w, multi: true}, cb);
        } else {
            cb("updateUser: no such user:" + email);
        }
    });
}

function users() {
    return userCollection;
}

function getUserFile(email, name, cb) {
    userExist(email, function (err, result) {
        if (err) {
            cb("getUserFile:" + err);
        } else if (result) {
            userCollection.findOne({email: email}, {
                files: {
                    "$elemMatch": {
                        name: name
                    }
                }
            }, cb);
        } else {
            cb("getUserFile: no such user:" + email);
        }
    });
}


function getUserFileNames(email, cb) {
    userCollection.findOne({email: email}, {
        email: 1,
        "files.name": 1
    }, function (err, result) {
        if (err || !result) {
            cb("getUser: no such user:" + email);
        } else {
            cb(err, result);
        }
    });
}

function addUserFile(email, name, dataObject, cb) {
    getUserFile(email, name, function (err, result) {
        if (err) {
            cb("addUserFile:" + err);
        } else if (result) {
            if (result.files) {
                cb("addUserFile: fileExist:" + name);
            } else {
                userCollection.update({email: email}, {
                    "$push": {
                        files: {
                            name: name,
                            data: JSON.stringify(dataObject)
                        }
                    }
                }, {w: w}, cb);
            }
        }
    });
}

function removeUserFile(email, name, cb) {
    getUserFile(email, name, function (err, result) {
        if (err) {
            cb("removeUserFile:" + err);
        } else if (result) {
            if (!result.files) {
                cb("removeUserFile: fileDoesNotExist:" + name);
            } else {
                userCollection.update({email: email}, {
                    "$pull": {
                        files: {
                            name: name
                        }
                    }
                }, {w: w}, cb);
            }
        }
    });
}

function updateUserFile(email, name, dataObject, cb) {
    getUserFile(email, name, function (err, result) {
        if (err) {
            cb("updateUserFile:" + err);
        } else if (result) {
            if (!result.files) {
                cb("updateUserFile: fileDoesNotExist:" + name);
            } else {
                userCollection.update({email: email, "files.name": name}, {
                    "$set": {
                        "files.$.data": JSON.stringify(dataObject)
                    }
                }, {w: w}, cb);
            }
        }
    });
}

/*EXAMPLE:
var stream = db.users().find().stream();
stream.on("data", function (item) {
    log.info(item);
});
stream.on("end", function (item) {
    log.info("<---done");
});*/

exports.setDb = setDb;
exports.close = close;

exports.userExist = userExist;
exports.addUser = addUser;
exports.getUser = getUser;
exports.removeUser = removeUser;
exports.updateUser = updateUser;

exports.addUserFile = addUserFile;
exports.getUserFile = getUserFile;
exports.getUserFileNames = getUserFileNames;
exports.removeUserFile = removeUserFile;
exports.updateUserFile = updateUserFile;

exports.users = users;
