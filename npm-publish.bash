#!/bin/bash

set -o pipefail

declare Pkg=npm-publish
declare Version=0.1.0

function msg() {
    echo "$Pkg: $*"
}

function err() {
    msg "$*" 1>&2
}

function main() {
    msg "branch is ${TRAVIS_BRANCH}"
    local module_version=$1
    local package="package.json"
    local tmp_package="$package.tmp"
    if [[ ! $module_version ]]; then
        err "first parameter must be the version number of the module to publish"
        return 10
    fi

    if ! jq --arg tag "$TRAVIS_TAG" '.version = $tag' "$package" > "$tmp_package"; then
        err "failed to set version in $package"
        return 1
    fi
    cp "$tmp_package" "$package"

     # npm honors this
    rm -f "$target/.gitignore"

    if [[ $TRAVIS_TAG =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        msg "Creating local .npmrc using API key from environment"
        if ! ( umask 077 && echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > "$HOME/.npmrc" ); then
            err "failed to create $HOME/.npmrc"
            return 1
        fi
        if ! ( cd "$target" && npm publish --access=public ); then
            err "failed to publish node module"
            cat "$target/npm-debug.log"
            return 1
        fi
    else [[ $TRAVIS_BRANCH == "master" ]]; then
        msg "Creating local .npmrc from details generated in Artifactory..."
        if [[ $ATOMIST_REPO_TOKEN  && $ATOMIST_REPO_USER ]]; then
            if ! ( curl -u"${ATOMIST_REPO_USER}":"${ATOMIST_REPO_TOKEN}" "https://atomist.jfrog.io/atomist/api/npm/auth" >  "$HOME/.npmrc"); then
                err "failed to create $HOME/.npmrc"
                return 1
            fi
        else
            err "Could not find credentials for publish to Artifactory"
            return 1
        fi

        if ! ( cd "$target" && npm publish --registry https://atomist.jfrog.io/atomist/api/npm/npm-dev-local --access=public ); then
            err "failed to publish node module to artifactory"
            cat "$target/npm-debug.log"
            return 1
        fi
    fi
}

main "$@" || exit 1
exit 0
