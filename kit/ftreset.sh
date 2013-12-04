#!/bin/bash
echo
echo Reseting contents of the fishtron.net WWW folder..
echo
cd /ftwww
rm -R *
cp -R /tom/* /ftwww
mv fishtron.html index.html
