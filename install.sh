#!/bin/sh

echo "run as:"
echo "'sudo ./install.sh &>/dev/null'"
echo ""
echo "otherwise output will bring node down on logout"
echo ""

sudo killall nodejs
sudo cp -a etc/* /etc/
npm install
sudo /etc/init.d/syntheserver.sh start
