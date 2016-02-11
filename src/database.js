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

function getUser(email, cb) {
    userCollection.findOne({email: email}, {}, function (err, result) {
        if (err || !result) {
            cb("getUser: no such user:" + email);
        } else {
            cb(err, result);
        }
    });
}

function insertUser(name, email, password, cb) {
    if (name === "" || email === "" || password === "") {
        cb("insertUser: field null");
    } else {
        getUser(email, function (err, result) {
            if (result) {
                cb("insertUser: user exist:" + email, result);
            } else {
                userCollection.insert({
                    name: name,
                    email: email,
                    password: password,
                    settings: {
                        debug: false
                    },
                    files: []
                }, {w: w}, cb);
            }
        });
    }
}

function getUserFile(email, name, cb) {
    getUser(email, function (err, result) {
        if (err) {
            cb("getUserFile:" + err);
        } else {
            userCollection.findOne({email: email}, {
                files: {
                    "$elemMatch": {
                        name: name
                    }
                }
            }, cb);
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

function removeUser(email, cb) {
    getUser(email, function (err, result) {
        if (err) {
            cb("removeUser:" + err);
        } else {
            userCollection.remove({email: email}, {w: w}, cb);
        }
    });
}

function updateUser(email, newEmail, newName, newPassword, cb) {
    getUser(email, function (err, result) {
        if (err) {
            cb("updateUser:" + err);
        } else {
            userCollection.update({email: email}, {
                "$set": {
                    email: newEmail,
                    name: newName,
                    password: newPassword
                }
            }, {w: w, multi: true}, cb);
        }
    });
}

function users() {
    return userCollection;
}

exports.setDb = setDb;
exports.close = close;
exports.insertUser = insertUser;
exports.removeUser = removeUser;
exports.updateUser = updateUser;
exports.users = users;
exports.addUserFile = addUserFile;
exports.getUserFile = getUserFile;
exports.getUser = getUser;
exports.removeUserFile = removeUserFile;
