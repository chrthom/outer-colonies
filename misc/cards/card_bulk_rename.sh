#!/bin/bash
if [ -z "$1" ] || [ ! -d "$1" ]; then
  echo "Usage: $0 <image-folder>" >&2
  exit 1
fi
rm -rf "$1/cards"
mkdir "$1/cards"
for e in 1 2 3 4 5; do
  for f in "$1/$e"/??_*.png; do
    [ -e "$f" ] || continue
    n="$e$(basename "$f" | cut -c1-2)"
    cp "$f" "$1/cards/$n.png"
  done
done
