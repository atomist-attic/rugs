#!/bin/bash

set -o pipefail

declare Pkg=update-deps
declare Version=0.1.0

function msg() {
    echo "$Pkg: $*"
}

function err() {
    msg "$*" 1>&2
}

function main() {
    msg "branch is ${TRAVIS_BRANCH}"

    if [[ $TRAVIS_TAG =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        msg "Updating @atomist modules to latest released versions..."
        if ! npm install @atomist/rug@latest -S; then
            err "failed to install latest @atomist/rug module"
            return 1
        fi
        if ! npm install @atomist/cortex@latest -S; then
            err "failed to install latest @atomist/cortex module"
            return 1
        fi
    elif [[ $TRAVIS_BRANCH == "master" ]]; then
        msg "Updating @atomist modules to latest development versions..."
        if ! npm install @atomist/rug@latest -S --registry https://atomist.jfrog.io/atomist/api/npm/npm-dev; then
            err "Failed to install latest @atomist/rug from https://atomist.jfrog.io/atomist/api/npm/npm-dev"
            return 1
        fi
        if ! npm install @atomist/cortex@latest -S --registry https://atomist.jfrog.io/atomist/api/npm/npm-dev; then
            err "Failed to install latest @atomist/cortex from https://atomist.jfrog.io/atomist/api/npm/npm-dev"
            return 1
        fi
    else
        msg "Not a release or master build => doing nothing to package.json"
    fi
}

main "$@" || exit 1
exit 0
