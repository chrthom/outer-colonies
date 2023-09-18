#!/bin/bash

echo_header() {
    echo
    echo +++++++++++++++++++++++++++++++++++++++++++++++++
    echo $1
    echo +++++++++++++++++++++++++++++++++++++++++++++++++
    echo
}

INIT_DIR=`pwd`
SCRIPT_PATH=`realpath "$0"`
SCRIPT_DIR=`dirname $SCRIPT_PATH`
BASE_DIR=${SCRIPT_DIR}/..

if [ "$1" = "-p" ]; then
    BUILD_FLAG=bp
    echo_header "PRODUCTION RELEASE"
else
    BUILD_FLAG=bs
    echo_header "STAGING RELEASE"
fi

echo_header "Building server package"
cd $BASE_DIR/server && \
    zip -r ../server.zip config src *.json

echo_header "Building client package"
cd $BASE_DIR/client && \
    npm run $BUILD_FLAG && \
    cd dist/outercolonies-client && \
    zip -r $INIT_DIR/client.zip *

echo_header "Building website package"
cd $BASE_DIR/website && \
    npm run $BUILD_FLAG && \
    cd dist/outercolonies-website && \
    zip -r $INIT_DIR/website.zip *

cd $INIT_DIR
