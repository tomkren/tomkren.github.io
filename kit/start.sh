#!/bin/bash
echo
echo Starting test.js server by script using nohup...
echo
cd /tom/js/node
nohup node test.js &
sleep 1
PID=`ps x | grep "node test.js$" | awk '{print $1}'`
echo $PID > pid.txt
echo 'pid' $PID
