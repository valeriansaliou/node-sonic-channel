/*
 * node-sonic-channel
 *
 * Copyright 2019, Valerian Saliou
 * Author: Valerian Saliou <valerian@valeriansaliou.name>
 */


"use strict";


var net  = require("net");


/**
 * SonicChannelGeneric
 * @class
 * @classdesc  Instanciates a new Sonic Channel connector.
 * @param      {string} mode
 * @param      {object} options
 */
var SonicChannelGeneric = function(mode, options) {
  // Sanitize external options
  if (typeof options !== "object") {
    throw new Error("Invalid or missing options");
  }
  if (typeof options.host !== "string" || !options.host) {
    throw new Error("Invalid or missing options.host");
  }
  if (typeof options.port !== "number" || options.port < 0 ||
        options.port > 65535) {
    throw new Error(
      "Invalid or missing options.port (because options.host is set)"
    );
  }
  if (options.auth !== undefined && typeof options.auth !== "string") {
    throw new Error("Invalid options.auth");
  }
  if (typeof options.offlineStackMaxSize !== "undefined"  &&
        (typeof options.offlineStackMaxSize !== "number" ||
          options.offlineStackMaxSize < 0)) {
    throw new Error("Invalid options.offlineStackMaxSize");
  }
  if (typeof options.emitQueueMaxSize !== "undefined"  &&
        (typeof options.emitQueueMaxSize !== "number" ||
          options.emitQueueMaxSize < 0)) {
    throw new Error("Invalid options.emitQueueMaxSize");
  }

  // Environment
  var offlineStackMaxSizeDefault = 500;
  var emitQueueMaxSizeDefault    = 1000;

  // Patterns
  this.__resultItemPattern  = /^([a-z_]+)\(([^\)\()]*)\)$/;
  this.__errorReasonPattern = /^([^\(\)]+)\((.*)\)$/;

  this.__textEscapePatterns = [
    [/\\/g, '\\\\'],
    [/\n/g, '\\n'],
    [/"/g,  '\\"']
  ];

  // Storage space
  this.__mode                  = mode;

  this.__options               = {
    host : (options.host || null),
    port : (options.port || null),
    auth : (options.auth || null),

    offlineStackMaxSize : (
      typeof options.offlineStackMaxSize === "number" ?
        options.offlineStackMaxSize : offlineStackMaxSizeDefault
    ),

    emitQueueMaxSize : (
      typeof options.emitQueueMaxSize === "number" ?
        options.emitQueueMaxSize : emitQueueMaxSizeDefault
    )
  };

  // Sanitize internal options
  if (this.__options.offlineStackMaxSize > this.__options.emitQueueMaxSize) {
    throw new Error(
      "Illegal options.offlineStackMaxSize greater than " +
        "options.emitQueueMaxSize"
    );
  }

  this.__client                = null;
  this.__environment           = {};

  this.__isClosing             = false;
  this.__lastError             = null;
  this.__retryTimeout          = null;
  this.__pingInterval          = null;
  this.__pingDeadTimeout       = null;
  this.__unstackOfflineTimeout = null;

  this.__connectHandlers       = {};

  this.__pendingEmit           = {};
  this.__emitQueue             = [];
  this.__eventCallbacks        = {};

  this.__offlineStack          = [];
};


/**
 * SonicChannelGeneric.prototype.connect
 * @public
 * @param  {object} [handlers]
 * @return {object} Sonic Channel instance
 */
SonicChannelGeneric.prototype.connect = function(handlers) {
  var self = this;

  // Assign handlers (overwrite w/ orders of priority)
  handlers = Object.assign(
    {}, self.__connectHandlers, handlers
  );

  // Flush any scheduled retry timeout
  if (self.__retryTimeout !== null) {
    clearTimeout(self.__retryTimeout);

    self.__retryTimeout = null;
  }

  if (self.__client === null) {
    // Register connect handlers
    self.__connectHandlers = {
      connected    : handlers.connected,
      disconnected : handlers.disconnected,
      timeout      : handlers.timeout,
      retrying     : handlers.retrying,
      error        : handlers.error
    };

    // Setup local client
    var client = new net.Socket();

    client.setNoDelay(true);   // Disable Nagle algorithm
    client.setTimeout(60000);  // Time-out after 1m

    // Initialize connected marker and data buffer
    var isConnected = false,
        dataBuffer  = "";

    // Construct all local event handler functions
    // Notice: this is done for performance and traceability reasons, as we \
    //   would prefer those functions to be named when debugging stack traces. \
    //   As well, defining them in advance ensures that they are not lazily \
    //   compiled again and again.
    var fnHandleConnect = function() {
      isConnected = true;

      // Reset last error (if any)
      self.__lastError = null;

      // Setup ping interval
      self.__setupPingInterval(client, true);
    };

    var fnHandleData = function(data) {
      if (data) {
        // Read received data chunk (prepend it w/ pending buffer from \
        //   previous chunk cycles)
        var dataChunk = (dataBuffer + data.toString());

        if (dataChunk.length > 0) {
          // Iterate on all lines contained within this chunk (until there is \
          //   no more)
          var splitIndex = dataChunk.indexOf("\n");

          while (splitIndex !== -1) {
            // Acquire line content from data chunk
            var line = dataChunk.substring(0, splitIndex).trim();

            if (line) {
              self.__handleDataLine.bind(self)(client, line);
            }

            // Pull out current line from data chunk and update next split index
            dataChunk  = dataChunk.substring(splitIndex + 1);
            splitIndex = dataChunk.indexOf("\n");
          }

          // Assign remaining un-processed data chunk to data buffer, as the \
          //   rest of the next line might be coming at next data chunk event.
          dataBuffer = dataChunk;
        }
      }
    };

    var fnHandleTimeout = function() {
      client.end();

      // Failure (timeout)
      self.__triggerConnectHandler("timeout");
    };

    var fnHandleError = function(error) {
      // Assign last error (will be used by disconnect handler to announce \
      //   any error reason to end-user)
      self.__lastError = (error || null);

      if (isConnected === false) {
        client.destroy();

        // Failure (unknown)
        self.__triggerConnectHandler("error", error);
      }
    };

    var fnHandleClose = function() {
      if (isConnected === true) {
        client.destroy();

        // Cancel any pending offline timeout unstack
        if (self.__unstackOfflineTimeout !== null) {
          clearTimeout(self.__unstackOfflineTimeout);

          self.__unstackOfflineTimeout = null;
        }

        // Un-setup ping interval
        self.__setupPingInterval(client, false);

        // Force-trigger end callback? (as the 'ENDED' line will not be \
        //   received if a close is submitted)
        if (self.__isClosing === true) {
          self.__popDataLineCallback("quit");
        }

        // Clear all pending callbacks (with an error)
        var orphanCallbacks = [].concat(
          [self.__pendingEmit.callback],

          self.__emitQueue.map(function(item) {
            return item[1];
          }),

          Object.values(self.__eventCallbacks)
        );

        self.__emitQueue        = [];
        self.__eventCallbacks   = {};

        delete self.__pendingEmit.callback;

        // Trigger orphan callbacks
        for (var i = 0; i < orphanCallbacks.length; i++) {
          if (typeof orphanCallbacks[i] === "function") {
            orphanCallbacks[i](null, "channel closed");
          }
        }

        // Acquire last error (if any)
        var lastError = (self.__lastError || null);

        // Reset last error (if any)
        self.__lastError = null;

        // Failure (closed)
        self.__handleDisconnected.bind(self)();

        self.__triggerConnectHandler("disconnected", lastError);
      }
    };

    // Connect to Sonic Channel endpoint
    client.connect(
      {
        port : self.__options.port,
        host : self.__options.host
      },

      fnHandleConnect
    );

    // Bind all event listeners
    client.on("data", fnHandleData);
    client.on("timeout", fnHandleTimeout);
    client.on("error", fnHandleError);
    client.on("close", fnHandleClose);
  } else {
    // Immediate success (already connected)
    self.__triggerConnectHandler("connected");
  }

  return self;
};


/**
 * SonicChannelGeneric.prototype.ping
 * @public
 * @return {object} Promise object
 */
SonicChannelGeneric.prototype.ping = function() {
  return this._wrapDone(function(done) {
    if (this.__client !== null) {
      this.__execute("ping", [done]);
    } else {
      // Notice: pass a 'String' instead of an 'Error' here, as errors capture \
      //   a stack trace which is not needed here, involving a huge \
      //   performance penalty which can be CPU-intensive at scale.
      done(
        null, "Channel is disconnected, cannot send ping"
      );
    }
  });
};


/**
 * SonicChannelGeneric.prototype.close
 * @public
 * @return {object} Promise object
 */
SonicChannelGeneric.prototype.close = function() {
  return this._wrapDone(function(done) {
    if (this.__client !== null) {
      this.__execute("close", [done]);
    } else {
      done();
    }
  });
};


/**
 * SonicChannelGeneric.prototype._wrapDone
 * @protected
 * @param  {function} fn_operation
 * @return {object}   Promise object
 */
SonicChannelGeneric.prototype._wrapDone = function(fn_operation) {
  var self = this;

  return new Promise(function(resolve, reject) {
    // Wrap operation 'done' callback with a 'Promise'
    fn_operation.call(self, function(data, error) {
      if (error) {
        return reject(error);
      }

      return resolve(data);
    });
  });
};


/**
 * SonicChannelGeneric.prototype._splitCommandContent
 * @protected
 * @param  {string} content
 * @return {object} Split off content groups
 */
SonicChannelGeneric.prototype._splitCommandContent = function(content) {
  // Content should be split off? (prevents buffer overflows)
  if (this.__environment._contentSplitLimit  &&
        content.length > this.__environment._contentSplitLimit) {
    var groups = [];

    // Engage in the split loop
    // Notice: for performance reasons, we are not word-aware there, which \
    //   means we can mis-index a word that has been split in 2. This is a \
    //   trade-off, but on large text bodies it should not hurt much.
    while (content) {
      groups.push(
        content.substring(0, this.__environment._contentSplitLimit)
      );

      // Assign next content chunk (we may not be done)
      content = content.substring(this.__environment._contentSplitLimit);
    }

    return groups;
  }

  // Return non-split-off content
  return [content];
};


/**
 * SonicChannelGeneric.prototype._executeOrDefer
 * @protected
 * @param  {string}  operation
 * @param  {object}  args
 * @return {boolean} Whether was executed now or deferred
 */
SonicChannelGeneric.prototype._executeOrDefer = function(operation, args) {
  // Execute now?
  if (this.__client !== null) {
    this.__execute(operation, args);

    return true;
  }

  // Defer.
  this.__defer(operation, args);

  return false;
};


/**
 * SonicChannelGeneric.prototype._executeMultipleOrDefer
 * @protected
 * @param  {string}   operation
 * @param  {object}   items
 * @param  {function} fn_args
 * @return {boolean}  Whether everything was executed now or deferred
 */
SonicChannelGeneric.prototype._executeMultipleOrDefer = function(
  operation, items, fn_args, done
) {
  // Generate item done tick callback
  var countDone = 0,
      allResult = null,
      lastError = null;

  var tickDone = function(result, error) {
    countDone++;

    // Accumulate result
    if (typeof result === "number") {
      allResult = ((allResult || 0) + result);
    }
    if (error) {
      lastError = error;
    }

    // Trigger final done callback?
    if (countDone >= items.length && typeof done === "function") {
      if (lastError) {
        done(null, lastError);
      } else {
        done(allResult, null);
      }
    }
  };

  // Process all sub-commands
  var executed = true;

  for (var i = 0; i < items.length; i++) {
    var groupStatus = this._executeOrDefer(
      operation, fn_args(items[i], tickDone)
    );

    if (groupStatus === false) {
      executed = false;
    }
  }

  return executed;
};


/**
 * SonicChannelGeneric.prototype._emit
 * @protected
 * @param  {string}   command
 * @param  {function} done
 * @param  {object}   [client]
 * @return {undefined}
 */
SonicChannelGeneric.prototype._emit = function(command, done, client) {
  // Emit now? (ie. send on socket)
  if (this.__pendingEmit.callback === undefined) {
    this.__socketSend(command, done, client);
  } else {
    var emitError;

    // Check for any emit error
    // Notice: pass a 'String' instead of an 'Error' here, as errors capture \
    //   a stack trace which is not needed here, involving a huge \
    //   performance penalty which can be CPU-intensive at scale.
    if (this.__options.emitQueueMaxSize === 0) {
      // Emit queue is disabled
      emitError = (
        "Emit queue is disabled, cannot queue pending operations for " +
          "processing while another operation is running. Breaking Sonic " +
          "Channel right now"
      );
    } else if (this.__emitQueue.length > this.__options.emitQueueMaxSize) {
      // Emit queue is full
      emitError = (
        "Emit queue is full, cannot queue more operations for processing. " +
          "Breaking Sonic Channel right now (maximum size set to: " +
          this.__options.emitQueueMaxSize + " entries)"
      );
    } else {
      // No emit error
      emitError = null;
    }

    // Any emit error? Destroy client and force a reconnect
    if (emitError !== null) {
      (client || this.__client).destroy(emitError);
    } else {
      // Push in emit queue
      this.__emitQueue.push([command, done]);
    }
  }
};


/**
 * SonicChannelGeneric.prototype._operation_$ping
 * @protected
 * @param  {function} done
 * @return {undefined}
 */
SonicChannelGeneric.prototype._operation_$ping = function(done) {
  if (this.__client !== null) {
    this._emit("PING", done);
  }
};


/**
 * SonicChannelGeneric.prototype._operation_$close
 * @protected
 * @param  {function} done
 * @return {undefined}
 */
SonicChannelGeneric.prototype._operation_$close = function(done) {
  if (this.__client !== null) {
    this.__isClosing = true;

    this._emit("QUIT", done);
  }
};


/**
 * SonicChannelGeneric.prototype._escapeUnsafeCommandText
 * @protected
 * @param  {string} text
 * @return {string} Escaped text
 */
SonicChannelGeneric.prototype._escapeUnsafeCommandText = function(text) {
  text = (text || "");

  for (var i = 0; i < this.__textEscapePatterns.length; i++) {
    var pattern = this.__textEscapePatterns[i];

    text = text.replace(pattern[0], pattern[1]);
  }

  return text;
};


/**
 * SonicChannelGeneric.prototype.__execute
 * @private
 * @param  {string} operation
 * @param  {object} args
 * @return {undefined}
 */
SonicChannelGeneric.prototype.__execute = function(operation, args) {
  // Execute operation now.
  this["_operation_$" + operation].apply(this, (args || []));
};


/**
 * SonicChannelGeneric.prototype.__defer
 * @private
 * @param  {string} operation
 * @param  {object} args
 * @return {undefined}
 */
SonicChannelGeneric.prototype.__defer = function(operation, args) {
  // Offline stack is disabled?
  if (this.__options.offlineStackMaxSize === 0) {
    // Notice: throw a 'String' instead of an 'Error' here, as errors capture \
    //   a stack trace which is not needed here, involving a huge \
    //   performance penalty which can be CPU-intensive at scale.
    throw (
      "Offline stack is disabled, cannot stack any operation until " +
        "Sonic Channel connection is restored"
    );
  }

  // Offline stack is full?
  if (this.__offlineStack.length > this.__options.offlineStackMaxSize) {
    // Notice: throw a 'String' instead of an 'Error' here, as errors capture \
    //   a stack trace which is not needed here, involving a huge \
    //   performance penalty which can be CPU-intensive at scale.
    throw (
      "Offline stack is full, cannot stack more operations until " +
        "Sonic Channel connection is restored (maximum size set to: " +
        this.__options.offlineStackMaxSize + " entries)"
    );
  }

  // Push to offline stack
  this.__offlineStack.push([operation, (args || [])]);
};


/**
 * SonicChannelGeneric.prototype.__unstackNextEmit
 * @private
 * @return {undefined}
 */
SonicChannelGeneric.prototype.__unstackNextEmit = function() {
  // Pending emit in queue?
  var nextEmit = this.__emitQueue.shift();

  if (nextEmit !== undefined) {
    this.__socketSend(nextEmit[0], nextEmit[1]);
  }
};


/**
 * SonicChannelGeneric.prototype.__socketSend
 * @private
 * @param  {string}   command
 * @param  {function} done
 * @param  {object}   [client]
 * @return {undefined}
 */
SonicChannelGeneric.prototype.__socketSend = function(command, done, client) {
  if (this.__pendingEmit.callback !== undefined) {
    throw new Error(
      "Trying to send command on socket, but last command response not handled"
    );
  }

  if (this.__client !== null || client) {
    (client || this.__client).write(command + "\n");
  }

  if (typeof done !== "function") {
    done = null;
  }

  // Schedule callback for this emit
  this.__pendingEmit.callback = done;
};


/**
 * SonicChannelGeneric.prototype.__popDataLineCallback
 * @private
 * @param  {object}   data
 * @param  {object}   error
 * @param  {boolean}  execute
 * @return {function} Callback (if any)
 */
SonicChannelGeneric.prototype.__popDataLineCallback = function(
  data, error, execute
) {
  data = (data === undefined ? null : data);
  error = (error === undefined ? null : error);

  // Trigger callback for this line emit
  var callback = this.__pendingEmit.callback;

  delete this.__pendingEmit.callback;

  // Unstack next emit (if any)
  this.__unstackNextEmit();

  if (callback !== undefined) {
    if (execute !== false && typeof callback === "function") {
      callback(data, error);
    }

    return (callback || null);
  }

  return undefined;
};


/**
 * SonicChannelGeneric.prototype.__triggerConnectHandler
 * @private
 * @param  {string} type
 * @param  {object} data
 * @return {undefined}
 */
SonicChannelGeneric.prototype.__triggerConnectHandler = function(type, data) {
  if (typeof this.__connectHandlers[type] === "function") {
    this.__connectHandlers[type](data);
  }
};


/**
 * SonicChannelGeneric.prototype.__setupPingInterval
 * @private
 * @param  {object}  client
 * @param  {boolean} [do_setup]
 * @return {undefined}
 */
SonicChannelGeneric.prototype.__setupPingInterval = function(client, do_setup) {
  var self = this;

  // Cancel previous interval?
  if (self.__pingInterval !== null) {
    clearInterval(self.__pingInterval);

    self.__pingInterval = null;
  }

  // Cancel previous inner timeout?
  if (self.__pingDeadTimeout !== null) {
    clearTimeout(self.__pingDeadTimeout);

    self.__pingDeadTimeout = null;
  }

  if (do_setup === true) {
    // Schedule ping interval (every 30s)
    self.__pingInterval = setInterval(function() {
      // Schedule a ping timeout (this let us break the channel if this ping \
      //   takes too much time to complete, and thus start from a fresh \
      //   channel connection upon reconnect)
      self.__pingDeadTimeout = setTimeout(function() {
        self.__pingDeadTimeout = null;

        // Notice: pass a 'String' instead of an 'Error' here, as errors \
        //   capture a stack trace which is not needed here, involving a huge \
        //   performance penalty which can be CPU-intensive at scale.
        client.destroy(
          "Took too much time to answer last keep-alive PING. Breaking " +
            "Sonic Channel right now (connection is likely stalled)"
        );
      }, 20000);

      // Send this ping
      self.ping()
        .catch(function() {
          // Ignore error (eg. disconnected)
          return Promise.resolve();
        })
        .then(function() {
          // Got a pong, clear the dead timeout
          clearTimeout(self.__pingDeadTimeout);

          self.__pingDeadTimeout = null;
        });
    }, 30000);
  }
};


/**
 * SonicChannelGeneric.prototype.__parseResultItems
 * @private
 * @param  {string} result
 * @return {object} Parsed items
 */
SonicChannelGeneric.prototype.__parseResultItems = function(result) {
  // Parse environment
  var resultItems  = (result || "").split(" ").slice(1),
      resultParsed = {};

  for (var i = 0; i < resultItems.length; i++) {
    var match = resultItems[i].match(this.__resultItemPattern);

    if (match && match[1] && match[2]) {
      if (!isNaN(match[2])) {
        resultParsed[match[1]] = parseInt(match[2], 10);
      } else {
        resultParsed[match[1]] = match[2];
      }
    }
  }

  return resultParsed;
};


/**
 * SonicChannelGeneric.prototype.__handleConnected
 * @private
 * @param  {object} client
 * @return {undefined}
 */
SonicChannelGeneric.prototype.__handleConnected = function(client) {
  var self = this;

  if (self.__client === null) {
    self.__client = client;

    // Unstack pending offline operations (after an hold time)
    if (self.__offlineStack.length > 0) {
      self.__unstackOfflineTimeout = setTimeout(function() {
        self.__unstackOfflineTimeout = null;

        if (self.__client !== null) {
          while (self.__offlineStack.length > 0) {
            self.__execute.apply(self, self.__offlineStack.shift());
          }
        }
      }, 500);
    }
  }

  // Success (now connected)
  self.__triggerConnectHandler("connected");
};


/**
 * SonicChannelGeneric.prototype.__handleDisconnected
 * @private
 * @return {undefined}
 */
SonicChannelGeneric.prototype.__handleDisconnected = function() {
  var self = this;

  // Reset client and environment
  self.__client      = null;
  self.__environment = {};

  // Schedule retry?
  if (self.__isClosing !== true && self.__retryTimeout === null) {
    self.__retryTimeout = setTimeout(function() {
      self.__retryTimeout = null;

      self.connect({
        error : function() {
          // Failed retrying, schedule next retry
          self.__handleDisconnected();
        }
      });

      // Pending (retrying to connect)
      self.__triggerConnectHandler("retrying");
    }, 2000);
  }

  // Not closing anymore
  self.__isClosing = false;
};


/**
 * SonicChannelGeneric.prototype.__handleDataLine
 * @private
 * @param  {object} client
 * @param  {string} line
 * @return {undefined}
 */
SonicChannelGeneric.prototype.__handleDataLine = function(client, line) {
  // Ensure line matches recognized pattern
  var splitIndex = line.indexOf(" ");

  var lineSegments = (
    (splitIndex !== -1) ?
      [line.substring(0, splitIndex), line.substring(splitIndex + 1)] :
      [line, undefined]
  );

  if (lineSegments[0]) {
    // Route response command to handler
    var handler = this["__handleDataLine_" + lineSegments[0].toLowerCase()];

    if (typeof handler === "function") {
      // Pass response data to handler
      handler.bind(this)(client, lineSegments[1]);
    } else {
      // Pop callback straight (avoids callbacks to be de-synced if an \
      //   unsupported response is received)
      this.__popDataLineCallback(lineSegments[1], null);
    }
  } else {
    throw new Error("Handled invalid data line");
  }
};


/**
 * SonicChannelGeneric.prototype.__handleDataLine_connected
 * @private
 * @param  {object} client
 * @param  {string} argument
 * @return {undefined}
 */
SonicChannelGeneric.prototype.__handleDataLine_connected = function(
  client, argument
) {
  // Generate start values
  var startValues = [this.__mode];

  if (this.__options.auth !== null) {
    startValues.push(this.__options.auth);
  }

  this._emit(
    ("START " + startValues.join(" ")), undefined, client
  );
};


/**
 * SonicChannelGeneric.prototype.__handleDataLine_started
 * @private
 * @param  {object} client
 * @param  {string} argument
 * @return {undefined}
 */
SonicChannelGeneric.prototype.__handleDataLine_started = function(
  client, argument
) {
  this.__popDataLineCallback(argument);

  // Parse environment
  var environmentParsed = this.__parseResultItems(argument);

  if (typeof environmentParsed.buffer !== "undefined") {
    // Truncate to 50% of the allowed in-buffer characters, so that we leave \
    //   some character space for other parts of the command. Then, divide \
    //   by 4 as an UTF-8 character contains a maximum of 4 bytes.
    environmentParsed._contentSplitLimit = (
      Math.floor((environmentParsed.buffer * 0.5) / 4)
    );
  }

  this.__environment = environmentParsed;

  // Now connected
  this.__handleConnected(client);
};


/**
 * SonicChannelGeneric.prototype.__handleDataLine_ended
 * @private
 * @param  {object} client
 * @param  {string} argument
 * @return {undefined}
 */
SonicChannelGeneric.prototype.__handleDataLine_ended = function(
  client, argument
) {
  this.__popDataLineCallback(argument);

  // Destroy client
  client.destroy();
};


/**
 * SonicChannelGeneric.prototype.__handleDataLine_pending
 * @private
 * @param  {object} client
 * @param  {string} argument
 * @return {undefined}
 */
SonicChannelGeneric.prototype.__handleDataLine_pending = function(
  client, argument
) {
  this.__eventCallbacks[argument.split(" ")[0]] = (
    this.__popDataLineCallback(argument, null, false)
  );
};


/**
 * SonicChannelGeneric.prototype.__handleDataLine_result
 * @private
 * @param  {object} client
 * @param  {string} argument
 * @return {undefined}
 */
SonicChannelGeneric.prototype.__handleDataLine_result = function(
  client, argument
) {
  var resultData;

  if (argument && !isNaN(argument)) {
    resultData = Number(argument);
  } else {
    resultData = this.__parseResultItems(argument);
  }

  this.__popDataLineCallback(resultData);
};


/**
 * SonicChannelGeneric.prototype.__handleDataLine_event
 * @private
 * @param  {object} client
 * @param  {string} argument
 * @return {undefined}
 */
SonicChannelGeneric.prototype.__handleDataLine_event = function(
  client, argument
) {
  var argumentParts = argument.split(" ");

  var eventType     = argumentParts.shift(),
      eventID       = argumentParts.shift(),
      eventCallback = this.__eventCallbacks[eventID];

  if (eventCallback) {
    delete this.__eventCallbacks[eventID];

    eventCallback(argumentParts, null);
  } else {
    throw new Error(
      "No event callback found for type: " + eventType + " and ID: " + eventID
    );
  }
};


/**
 * SonicChannelGeneric.prototype.__handleDataLine_err
 * @private
 * @param  {object} client
 * @param  {string} argument
 * @return {undefined}
 */
SonicChannelGeneric.prototype.__handleDataLine_err = function(
  client, argument
) {
  var match = argument.match(this.__errorReasonPattern);

  // Parse error
  var error = {};

  if (match && match[1]) {
    error.code    = match[1];
    error.message = (match[2] || "");
  } else {
    error.code    = "unexpected_error";
    error.message = (argument || "");
  }

  this.__popDataLineCallback(null, error);
};


exports.SonicChannelGeneric = SonicChannelGeneric;
