#!/bin/bash

SCRIPT_PATH=`realpath "$0"`
SCRIPT_DIR=`dirname $SCRIPT_PATH`
BASE_DIR=${SCRIPT_DIR}/..

if [ "$#" -ne 2 ]; then
    echo "Illegal number of parameters"
    echo "Usage: version.sh VERSION RELEASE_NAME"
fi

#for d in client server website; do
#    sed -E -i "s/\"version\": \"[0-9]+\.[0-9]+\.[0-9]+\",$/\"version\": \"$1\",/" $BASE_DIR/$d/package.json
#done

sed -E -i "s/[A-Z][a-z]+ \([0-9]+\.[0-9]+\.[0-9]+\)/$2 ($1)/" $BASE_DIR/client/src/app/components/indicators/version_indicator.ts
