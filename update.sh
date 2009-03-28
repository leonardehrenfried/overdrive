#!/bin/bash

rsync -vr  * --exclude=*.sh --exclude=*.tmproj --exclude=.hg  lenniboy@quasar.webhostserver.biz:/home/lenniboy/public_html/tools/overdrive/
