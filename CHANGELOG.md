Changelog
=========

## 1.3.1 (2023-01-09)

### New Features

* Automate the package release process via GitHub Actions (ie. `npm publish`) [[@valeriansaliou](https://github.com/valeriansaliou)].

## 1.3.0 (2022-10-20)

### Changes

* Add the `LIST` search channel command [[@valeriansaliou](https://github.com/valeriansaliou)].

## 1.2.14 (2022-06-21)

### Changes

* Process wire protocol lines as soon as they are received on the buffer, this avoids deferring the processing of responses until we reach a line feed character [[@valeriansaliou](https://github.com/valeriansaliou)].

## 1.2.13 (2022-06-21)

### Changes

* Remove performance-killer try/catch block [[@valeriansaliou](https://github.com/valeriansaliou)].
* Improve the performance and traceability of connection event handlers [[@valeriansaliou](https://github.com/valeriansaliou)].
* Improve the performance of data buffer splitter, by skipping pre-trimming [[@valeriansaliou](https://github.com/valeriansaliou)].
* Improve the performance of the wire protocol handler, by moving away from regex-based parsing [[@valeriansaliou](https://github.com/valeriansaliou)].

## 1.2.12 (2022-06-16)

### Changes

* Improve performance when the Sonic Channel client is disconnected, by throwing string objects intead of stack-capturing errors [[@valeriansaliou](https://github.com/valeriansaliou)].

## 1.2.11 (2022-06-16)

### Changes

* Add the ability to disable emit queue and offline stack by setting their options to zero [[@valeriansaliou](https://github.com/valeriansaliou)].

## 1.2.10 (2022-06-14)

### Bug Fixes

* Harden reconnection flow by making sure that all registered timeouts and intervals are bailed out [[@valeriansaliou](https://github.com/valeriansaliou)].

## 1.2.9 (2022-06-13)

### Changes

* Declare TypeScript definitions in `package.json` [[@anbraten](https://github.com/anbraten)].

## 1.2.8 (2022-06-10)

### Bug Fixes

* Adjust emit queue and offline queue maximum size defaults [[@valeriansaliou](https://github.com/valeriansaliou)].
* Disallow an offline queue maximum greater than the emit queue maximum, as this can cause connect/disconnect loops [[@valeriansaliou](https://github.com/valeriansaliou)].

## 1.2.7 (2022-03-22)

### Bug Fixes

* Prevent the bubbling-up of a custom handler error in the disconnection handler, which was breaking internal reconnection mechanism [[@valeriansaliou](https://github.com/valeriansaliou)].

## 1.2.6 (2020-02-27)

### Changes

* Add TypeScript definitions [[@spacemeowx2](https://github.com/spacemeowx2)].

## 1.2.5 (2019-04-26)

### Changes

* Validate passed language for the `PUSH` (ingest mode) and `QUERY` (search mode) commands [[@valeriansaliou](https://github.com/valeriansaliou)].

## 1.2.4 (2019-04-16)

### Changes

* Add the ability to pass optional data to the `TRIGGER` command [[@valeriansaliou](https://github.com/valeriansaliou)].

## 1.2.3 (2019-04-16)

### Changes

* Throw an error when `PING` is called but channel is disconnected [[@valeriansaliou](https://github.com/valeriansaliou)].

## 1.2.2 (2019-04-15)

### Changes

* Add the `INFO` control channel command [[@valeriansaliou](https://github.com/valeriansaliou)].

## 1.2.1 (2019-04-15)

### Changes

* Improve results parsing from the network [[@valeriansaliou](https://github.com/valeriansaliou)].

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
