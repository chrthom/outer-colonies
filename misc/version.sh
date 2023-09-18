#!/bin/bash

INIT_DIR=`pwd`
SCRIPT_PATH=`realpath "$0"`
SCRIPT_DIR=`dirname $SCRIPT_PATH`
BASE_DIR=${SCRIPT_DIR}/..

if [ "$#" -ne 2 ]; then
    echo "Illegal number of parameters"
    echo "Usage: version.sh RELEASE_NAME VERSION"
fi

for d in client server website; do
    sed -E -i "s/\"version\": \"[0-9]+\.[0-9]+\.[0-9]+\",$/\"version\": \"$2\",/g" $BASE_DIR/$d/package.json
done

cd $INIT_DIR
