#!/bin/bash
# read the current revision from mercurial
export rev=`hg log -l1|grep changeset|grep -o  "\([0-9]\+\):"|grep -o "\([0-9]\+\)"`

export build_dir=/tmp/overdrive
mkdir $build_dir
cp -R * $build_dir
cd $build_dir
echo "Replacing all occurences of {REV} with the current hg changeset "$rev
perl -pi -e 's/{REV}/'$rev'/g' index.html
# uploading the shizzle to the server
for i in `ls *.css`
do
  echo "Compressing $i ..."
  yuic $i
done


for i in `ls *.js`
do
  echo "Compressing $i ..."
  yuic $i
done


rsync -vr  * --exclude=*.sh --exclude=*.tmproj --exclude=.hg  lenniboy@quasar.webhostserver.biz:/home/lenniboy/public_html/tools/overdrive/
cd ..
rm -rf $build_dir