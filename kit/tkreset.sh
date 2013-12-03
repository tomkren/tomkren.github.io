#!/bin/bash
echo
echo Reseting contents of the tomkren.cz WWW folder..
echo
cd /tkwww
rm -R *
cp -R /tom/* /tkwww
