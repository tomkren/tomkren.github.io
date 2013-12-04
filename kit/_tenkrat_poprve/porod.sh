#!/bin/bash
echo TODO : BACHA JE TO rozdelany
echo
echo Rodim server ...
echo
ln -s /home/domeny/tomkren.cz/web/subdomeny/git/ /git-repos
cd /git-repos
git clone https://github.com/tomkren/tomkren/tomkren.github.io.git
git clone https://github.com/tomkren/kutil.git
ln -s /git-repos/tomkren.github.io/ /tom
ln -s /home/domeny/tomkren.cz/web/subdomeny/www/ /tkwww
ln -s /home/domeny/fishtron.net/web/subdomeny/www/ /ftwww
echo 'Zdravicko sefe!' > /etc/motd
