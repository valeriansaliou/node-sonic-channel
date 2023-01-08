# node-sonic-channel

[![Test and Build](https://github.com/valeriansaliou/node-sonic-channel/workflows/Test%20and%20Build/badge.svg?branch=master)](https://github.com/valeriansaliou/node-sonic-channel/actions?query=workflow%3A%22Test+and+Build%22) [![Build and Release](https://github.com/valeriansaliou/node-sonic-channel/workflows/Build%20and%20Release/badge.svg)](https://github.com/valeriansaliou/node-sonic-channel/actions?query=workflow%3A%22Build+and+Release%22) [![NPM](https://img.shields.io/npm/v/sonic-channel.svg)](https://www.npmjs.com/package/sonic-channel) [![Downloads](https://img.shields.io/npm/dt/sonic-channel.svg)](https://www.npmjs.com/package/sonic-channel) [![Buy Me A Coffee](https://img.shields.io/badge/buy%20me%20a%20coffee-donate-yellow.svg)](https://www.buymeacoffee.com/valeriansaliou)

**Sonic Channel integration for Node. Used in pair with Sonic, the fast, lightweight and schema-less search backend.**

Sonic Channel lets you manage your Sonic search index, from your NodeJS code. Query your index and get search results, push entries to your index and pop them programmatically.

**🇫🇷 Crafted in Nantes, France.**

## Who uses it?

<table>
<tr>
<td align="center"><a href="https://crisp.chat/"><img src="https://valeriansaliou.github.io/node-sonic-channel/images/crisp.png" width="64" /></a></td>
</tr>
<tr>
<td align="center">Crisp</td>
</tr>
</table>

_👋 You use sonic-channel and you want to be listed there? [Contact me](https://valeriansaliou.name/)._

## How to install?

Include `sonic-channel` in your `package.json` dependencies.

Alternatively, you can run `npm install sonic-channel --save`.

## How to use?

### 1️⃣ Search channel

#### 1. Create the connection

`node-sonic-channel` can be instanciated in search mode as such:

```javascript
var SonicChannelSearch = require("sonic-channel").Search;

var sonicChannelSearch = new SonicChannelSearch({
  host : "::1",            // Or '127.0.0.1' if you are still using IPv4
  port : 1491,             // Default port is '1491'
  auth : "SecretPassword"  // Authentication password (if any)
}).connect({
  connected : function() {
    // Connected handler
    console.info("Sonic Channel succeeded to connect to host (search).");
  },

  disconnected : function() {
    // Disconnected handler
    console.error("Sonic Channel is now disconnected (search).");
  },

  timeout : function() {
    // Timeout handler
    console.error("Sonic Channel connection timed out (search).");
  },

  retrying : function() {
    // Retry handler
    console.error("Trying to reconnect to Sonic Channel (search)...");
  },

  error : function(error) {
    // Failure handler
    console.error("Sonic Channel failed to connect to host (search).", error);
  }
});
```

#### 2. Query the search index

Use the same `sonicChannelSearch` instance to query the search index:

```javascript
sonicChannelSearch.query("messages", "default", "valerian saliou")
  .then(function(results) {
    // Query results come there
  })
  .catch(function(error) {
    // Query errors come there
  });
```

#### 3. Teardown connection

If you need to teardown an ongoing connection to Sonic, use:

```javascript
sonicChannelSearch.close()
  .then(function() {
    // Close success handler
  })
  .catch(function(error) {
    // Close errors come there
  });
```

---

### 2️⃣ Ingest channel

#### 1. Create the connection

`node-sonic-channel` can be instanciated in ingest mode as such:

```javascript
var SonicChannelIngest = require("sonic-channel").Ingest;

var sonicChannelIngest = new SonicChannelIngest({
  host : "::1",            // Or '127.0.0.1' if you are still using IPv4
  port : 1491,             // Default port is '1491'
  auth : "SecretPassword"  // Authentication password (if any)
}).connect({
  connected : function() {
    // Connected handler
    console.info("Sonic Channel succeeded to connect to host (ingest).");
  },

  disconnected : function() {
    // Disconnected handler
    console.error("Sonic Channel is now disconnected (ingest).");
  },

  timeout : function() {
    // Timeout handler
    console.error("Sonic Channel connection timed out (ingest).");
  },

  retrying : function() {
    // Retry handler
    console.error("Trying to reconnect to Sonic Channel (ingest)...");
  },

  error : function(error) {
    // Failure handler
    console.error("Sonic Channel failed to connect to host (ingest).", error);
  }
});
```

#### 2. Manage the search index

Use the same `sonicChannelIngest` instance to push text to the search index:

```javascript
sonicChannelIngest.push("messages", "default", "conversation:1", "I met Valerian Saliou yesterday. Great fun!")
  .then(function() {
    // Push success handler
  })
  .catch(function(error) {
    // Push errors come there
  });
```

#### 3. Teardown connection

If you need to teardown an ongoing connection to Sonic, use:

```javascript
sonicChannelIngest.close()
  .then(function() {
    // Close success handler
  })
  .catch(function(error) {
    // Close errors come there
  });
```

---

### 3️⃣ Control channel

#### 1. Create the connection

`node-sonic-channel` can be instanciated in control mode as such:

```javascript
var SonicChannelControl = require("sonic-channel").Control;

var sonicChannelControl = new SonicChannelControl({
  host : "::1",            // Or '127.0.0.1' if you are still using IPv4
  port : 1491,             // Default port is '1491'
  auth : "SecretPassword"  // Authentication password (if any)
}).connect({
  connected : function() {
    // Connected handler
    console.info("Sonic Channel succeeded to connect to host (control).");
  },

  disconnected : function() {
    // Disconnected handler
    console.error("Sonic Channel is now disconnected (control).");
  },

  timeout : function() {
    // Timeout handler
    console.error("Sonic Channel connection timed out (control).");
  },

  retrying : function() {
    // Retry handler
    console.error("Trying to reconnect to Sonic Channel (control)...");
  },

  error : function(error) {
    // Failure handler
    console.error("Sonic Channel failed to connect to host (control).", error);
  }
});
```

#### 2. Administrate your Sonic server

_You may use the same `sonicChannelControl` instance to administrate your Sonic server._

#### 3. Teardown connection

If you need to teardown an ongoing connection to Sonic, use:

```javascript
sonicChannelControl.close()
  .then(function() {
    // Close success handler
  })
  .catch(function(error) {
    // Close errors come there
  });
```

## List of channel methods

_For details on argument values, see the [Sonic Channel Protocol specification](https://github.com/valeriansaliou/sonic/blob/master/PROTOCOL.md)._

### Search channel

* `sonicChannelSearch.query(collection_id<string>, bucket_id<string>, terms_text<string>, [options{limit<number>, offset<number>, lang<string>}<object>]?)` ➡️ `Promise(results<object>, error<object>)`
* `sonicChannelSearch.suggest(collection_id<string>, bucket_id<string>, word_text<string>, [options{limit<number>}<object>]?)` ➡️ `Promise(results<object>, error<object>)`
* `sonicChannelSearch.list(collection_id<string>, bucket_id<string>, [options{limit<number>, offset<number>}<object>]?)` ➡️ `Promise(results<object>, error<object>)`

### Ingest channel

* `sonicChannelIngest.push(collection_id<string>, bucket_id<string>, object_id<string>, text<string>, [options{lang<string>}<object>]?)` ➡️ `Promise(_, error<object>)`
* `sonicChannelIngest.pop(collection_id<string>, bucket_id<string>, object_id<string>, text<string>)` ➡️ `Promise(count<number>, error<object>)`
* `sonicChannelIngest.count<number>(collection_id<string>, [bucket_id<string>]?, [object_id<string>]?)` ➡️ `Promise(count<number>, error<object>)`
* `sonicChannelIngest.flushc(collection_id<string>)` ➡️ `Promise(count<number>, error<object>)`
* `sonicChannelIngest.flushb(collection_id<string>, bucket_id<string>)` ➡️ `Promise(count<number>, error<object>)`
* `sonicChannelIngest.flusho(collection_id<string>, bucket_id<string>, object_id<string>)` ➡️ `Promise(count<number>, error<object>)`

### Control channel

* `sonicChannelControl.trigger(action<string>, [data<string>]?)` ➡️ `Promise(_, error<object>)`
* `sonicChannelControl.info()` ➡️ `Promise(results<object>, error<object>)`

## What is Sonic?

ℹ️ **Wondering what Sonic is?** Check out **[valeriansaliou/sonic](https://github.com/valeriansaliou/sonic)**.

## How is it linked to Sonic?

`node-sonic-channel` maintains persistent TCP connections to the Sonic network interfaces that are listening on your running Sonic instance. In case `node-sonic-channel` gets disconnected from Sonic, it will retry to connect once the connection is established again.

You can configure the connection details of your Sonic instance when initializing `node-sonic-channel` from your code; via the Sonic host and port.
