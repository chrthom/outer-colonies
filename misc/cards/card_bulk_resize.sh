#!/bin/bash
rm -rf $1/resized 2> /dev/null
mkdir $1/resized
for f in `ls $1/*.png`; do
  convert -resize 411X561 $f $1/resized/$(basename ${f}) 
done