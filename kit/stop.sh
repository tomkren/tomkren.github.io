#!/bin/bash
echo
echo Stoping test.js server by script...
echo
cd /tom/js/node
PID=`cat pid.txt`
rm pid.txt
kill -15 $PID
