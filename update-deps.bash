#!/bin/bash

set -o pipefail

declare Pkg=update-deps
declare Version=0.2.0

function msg() {
    echo "$Pkg: $*"
}

function err() {
    msg "$*" 1>&2
}

function main() {
    msg "branch is ${TRAVIS_BRANCH}"

    if ! [[ $TRAVIS_TAG =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        msg "updating @atomist modules to latest development versions"
        local registry=https://atomist.jfrog.io/atomist/api/npm/npm-dev
        local module
        for module in rug cortex; do
            if ! npm install "@atomist/$module@latest" --save --registry="$registry"; then
                err "Failed to install latest @atomist/$module from $registry"
                return 1
            fi
        done
    fi
}

main "$@" || exit 1
exit 0
