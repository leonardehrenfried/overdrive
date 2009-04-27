#!/bin/bash
# read the current revision from mercurial
export rev=`hg log -l1|grep changeset|grep -o  "\([0-9]\+\):"|grep -o "\([0-9]\+\)"`
mkdir build
cp * build
cd build
echo "Replacing all in $1 occurences of {REV} with the current hg revision "$rev
perl -pi -e 's/{REV}/'$rev'/g' index.html
# uploading the shizzel to the server
rsync -vr  * --exclude=*.sh --exclude=*.tmproj --exclude=.hg  lenniboy@quasar.webhostserver.biz:/home/lenniboy/public_html/tools/overdrive/
cd ..
rm -rf build