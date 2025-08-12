#!/bin/bash
rm -rf cards 2> /dev/null
mkdir cards
for e in 1 2 3 4; do
  for f in `ls ${e}/??_*.png`; do
    n=`echo $f | sed -r 's/(.)\/(..)_.*\.png/\1\2/'`
    cp $f cards/$n.png
  done
done
