Changelog
=========

## 1.2.0 (2019-04-04)

### Breaking Changes

* All public methods now use Promises (callbacks have been removed from the public API) [[@valeriansaliou](https://github.com/valeriansaliou)].

## 1.1.0 (2019-03-22)

### Bug Fixes

* Various fixes related to TCP buffer overflow issues and back-pressure management [[@valeriansaliou](https://github.com/valeriansaliou)].

### Changes

* When a command text is too long, split in multiple sub-commands that are commited to Sonic one-by-one (do not truncate text anymore) [[@valeriansaliou](https://github.com/valeriansaliou)].

## 1.0.0 (2019-02-25)

### New Features

* Initial `node-sonic-channel` release [[@valeriansaliou](https://github.com/valeriansaliou)].
