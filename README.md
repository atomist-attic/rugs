# Atomist 'rugs'

[![Build Status](https://travis-ci.org/atomist/rugs.svg?branch=master)](https://travis-ci.org/atomist/rugs)
[![Slack Status](https://join.atomist.com/badge.svg)](https://join.atomist.com/)

[Node][node] module [`@atomist/rugs`][rugs] that brings in all the
dependencies and helpers you need to write Rugs
using [TypeScript][ts].  See the [Atomist Documentation][docs] for
more information.

[node]: https://nodejs.org/en/
[rugs]: https://www.npmjs.com/package/@atomist/rugs
[ts]: https://www.typescriptlang.org/
[docs]: http://docs.atomist.com/

This module brings in all needed Rug dependencies and contains some
helper classes and interfaces for writing Rugs and , serving as single
place for us to deliver all Rug-related TypeScript/JavaScript tooling
on a distinct life cycle from Rug, Cortex, etc.  Any time the
interfaces for the [`@atomist/rug`][rug]
and [`@atomist/cortex`][cortex] modules change, this project should be
updated to bring in those new versions.  Then a new release of this
module should be made, incrementing the version appropriately.

[rug]: https://github.com/atomist/rug
[cortex]: https://github.com/atomist/cortex

## Support

General support questions should be discussed in the `#support`
channel on our community Slack team
at [atomist-community.slack.com][slack].

If you find a problem, please create an [issue][].

[issue]: https://github.com/atomist/rugs/issues

## Development

This is a standard TypeScript module.  You will need [Node.js][node],
which installs `npm`, and [TypeScript][ts] installed.

```
$ npm install -g yarn typescript tslint
$ yarn install
```

Development versions of the `@atomist/rugs` npm module are published to
`https://atomist.jfrog.io/atomist/api/npm/npm-dev`. The most
straightforward way to get these versions without making changes to
your configuration is:

```bash
$ npm install @atomist/rugs --registry https://atomist.jfrog.io/atomist/api/npm/npm-dev
```

Alternatively, if you always want the latest snapshot, you can change
your config for the @atomist scope:

```
npm config set @atomist:registry https://atomist.jfrog.io/atomist/api/npm/npm-dev
```

### Test

Test using the standard approach for Node modules.

```
$ yarn test
```

### Release

To create a new release of the project, simply push a tag of the form
`M.N.P` where `M`, `N`, and `P` are integers that form the next
appropriate [semantic version][semver] for release.  The version in
the package.json is replaced by the build and is totally ignored!  For
example:

[semver]: http://semver.org

```
$ git tag -a 1.2.3
```

The Travis CI build (see badge at the top of this page) will publish
the NPM module and automatically create a GitHub release using the tag
name for the release and the comment provided on the annotated tag as
the contents of the release notes.

---
Created by [Atomist][atomist].
Need Help?  [Join our Slack team][slack].

[atomist]: https://www.atomist.com/
[slack]: https://join.atomist.com/
