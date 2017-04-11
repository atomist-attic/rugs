#!/bin/bash

set -o pipefail

declare Pkg=npm-publish
declare Version=0.2.0

function msg() {
    echo "$Pkg: $*"
}

function err() {
    msg "$*" 1>&2
}

function main() {
    msg "branch is ${TRAVIS_BRANCH}"
    local module_version=$1
    if [[ ! $module_version ]]; then
        err "first parameter must be the version number of the module to publish"
        return 10
    fi
    shift

    local package="package.json"
    local tmp_package="$package.tmp"
    if ! jq --arg tag "$TRAVIS_TAG" '.version = $tag' "$package" > "$tmp_package"; then
        err "failed to set version in $package"
        return 1
    fi
    if ! mv "$tmp_package" "$package"; then
        err "failed to overwrite $package"
        return 1
    fi

     # npm honors this
    rm -f "$target/.gitignore"

    local registry
    if [[ $module_version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        if [[ $NPM_TOKEN ]]; then
            msg "creating local .npmrc using NPM token from environment"
            if ! ( umask 077 && echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > "$HOME/.npmrc" ); then
                err "failed to create $HOME/.npmrc"
                return 1
            fi
        else
            msg "assuming your .npmrc is setup correctly for this project"
        fi
    elif [[ $TRAVIS_BRANCH == "master" ]]; then
        msg "creating local .npmrc from details generated in Artifactory..."
        if [[ $ATOMIST_REPO_TOKEN  && $ATOMIST_REPO_USER ]]; then
            if ! ( umask 077 && curl -u"${ATOMIST_REPO_USER}":"${ATOMIST_REPO_TOKEN}" "https://atomist.jfrog.io/atomist/api/npm/auth" >  "$HOME/.npmrc"); then
                err "failed to create $HOME/.npmrc"
                return 1
            fi
        else
            err "could not find credentials for publish to Artifactory"
            return 1
        fi
        registry=--registry=https://atomist.jfrog.io/atomist/api/npm/npm-dev-local
    fi

    if ! ( cd "$target" && npm publish --access=public $registry ); then
        err "failed to publish node module to artifactory"
        cat "$target/npm-debug.log"
        return 1
    fi
}

main "$@" || exit 1
exit 0
