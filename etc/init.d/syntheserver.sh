#!/bin/sh

#TODO: make proper start/stop pid+log

if [ ! `whoami` = "root" ];then
    echo "need to be root"
    exit 1
fi

cd /opt/synthesounds/syntheserver/
npm start &> /dev/null&
