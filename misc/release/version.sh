#!/bin/bash

SCRIPT_PATH=`realpath "$0"`
SCRIPT_DIR=`dirname $SCRIPT_PATH`
BASE_DIR=${SCRIPT_DIR}/../..

if [ "$#" -ne 2 ]; then
    echo "Illegal number of parameters"
    echo "Usage: version.sh VERSION RELEASE_NAME"
    exit 1
fi

echo "Incrementing version to $2 (v$1)"

for d in client server website; do
    sed -E -i "s/\"version\": \"[0-9]+\.[0-9]+\.[0-9]+\",$/\"version\": \"$1\",/" $BASE_DIR/$d/package.json
done

sed -E -i "s/const version = '[0-9]+\.[0-9]+\.[0-9]+';/const version = '$1';/" $BASE_DIR/server/src/shared/config/version.ts
sed -E -i "s/const releaseName = '[A-Z][a-z]+';/const releaseName = '$2';/" $BASE_DIR/server/src/shared/config/version.ts
