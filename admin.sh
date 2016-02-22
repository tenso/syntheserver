#!/bin/sh

echo -n "new admin password:"
read password

if [ "${password}" = "" ];then
    echo "invalid password"
    exit 1
fi

mongo synthesound --eval 'db.users.update({"email": "admin"}, {"$set": {"info.password": '\""${password}"\"'}});'
