#!/bin/bash

rsync -r  * --exclude=*.sh --exclude=*.tmproj --exclude=*.db --exclude=settings.py  --exclude=.svn  lenniboy@quasar.webhostserver.biz:/home/lenniboy/public_html/tools/overdrive/
