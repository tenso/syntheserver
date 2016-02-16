/*global exports*/

"use strict";

var db,
    userCollection,
    w = 1,
    userProjection = {
        "_id": 0,
        email: 1,
        info: 1,
        settings: 1,
        "files.name": 1
    };

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
            cb("userExists", result);
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
    userCollection.findOne({email: email}, userProjection, function (err, result) {
        if (err || !result) {
            cb("noUser");
        } else {
            cb(err, result);
        }
    });
}

function addUser(name, email, password, cb) {
    if (name === "" || email === "" || password === "") {
        cb("nullData");
    } else {
        userExist(email, function (err, result) {
            if (err) {
                cb(err);
            } else if (result) {
                cb("userExists", result);
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
            cb(err);
        } else if (result) {
            userCollection.remove({email: email}, {w: w}, cb);
        } else {
            cb("noUser");
        }
    });
}

function updateUser(email, newEmail, newName, newPassword, cb) {
    userExist(email, function (err, result) {
        if (err) {
            cb(err);
        } else if (result) {
            userCollection.update({email: email}, {
                "$set": {
                    email: newEmail,
                    info: {
                        name: newName,
                        password: newPassword,
                        admin: false
                    }
                }
            }, {w: w}, cb);
        } else {
            cb("noUser");
        }
    });
}

function setAdmin(email, admin, cb) {
    userExist(email, function (err, result) {
        if (err) {
            cb(err);
        } else if (result) {
            userCollection.update({email: email}, {
                "$set": {
                    "info.admin": admin
                }
            }, {w: w}, cb);
        } else {
            cb("noUser");
        }
    });
}

function getUsers(cb) {
    var stream = userCollection.find({}, userProjection).stream(),
        all = [];
    stream.on("data", function (item) {
        if (item.info.hasOwnProperty("password")) {
            delete item.info.password;
        }
        all.push(item);
    });
    stream.on("end", function (item) {
        cb(null, all);
    });
}

function getUserFile(email, name, cb) {
    userExist(email, function (err, result) {
        if (err) {
            cb(err);
        } else if (result) {
            userCollection.findOne({email: email}, {
                files: {
                    "$elemMatch": {
                        name: name
                    }
                }
            }, function (err, result) {
                if (err || !result.files) {
                    cb(err);
                } else if (result) {
                    return cb(null, result.files[0]);
                }
            });
        } else {
            cb("noUser");
        }
    });
}


function getUserFileNames(email, cb) {
    userCollection.findOne({email: email}, {
        "_id": 0,
        "files.name": 1
    }, function (err, result) {
        if (err || !result) {
            cb("noUser");
        } else {
            cb(err, result.files);
        }
    });
}

function addUserFile(email, name, dataObject, cb) {
    //FIXME: userFileExists() so err can be caught
    getUserFile(email, name, function (err, result) {
        if (result) {
            cb("fileExist", result);
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
    });
}

function removeUserFile(email, name, cb) {
    getUserFile(email, name, function (err, result) {
        if (err) {
            cb(err);
        } else if (!result) {
            cb("fileDoesNotExist");
        } else {
            userCollection.update({email: email}, {
                "$pull": {
                    files: {
                        name: name
                    }
                }
            }, {w: w}, cb);
        }
    });
}

function updateUserFile(email, name, dataObject, cb) {
    getUserFile(email, name, function (err, result) {
        if (err) {
            cb(err);
        } else if (!result) {
            cb("fileDoesNotExist");
        } else {
            userCollection.update({email: email, "files.name": name}, {
                "$set": {
                    "files.$.data": JSON.stringify(dataObject)
                }
            }, {w: w}, cb);
        }
    });
}

exports.setDb = setDb;
exports.close = close;

exports.userExist = userExist;
exports.addUser = addUser;
exports.getUser = getUser;
exports.getUsers = getUsers;
exports.removeUser = removeUser;
exports.updateUser = updateUser;
exports.setAdmin = setAdmin;

exports.addUserFile = addUserFile;
exports.getUserFile = getUserFile;
exports.getUserFileNames = getUserFileNames;
exports.removeUserFile = removeUserFile;
exports.updateUserFile = updateUserFile;
