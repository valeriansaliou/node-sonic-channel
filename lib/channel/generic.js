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
  // Sanitize options
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

  // Environment
  var offlineStackMaxSizeDefault = 1000;

  // Patterns
  this.__responsePattern    = /^([A-Z]+)(?:\s(.*))?$/;
  this.__startedItemPattern = /^([a-z_]+)\(([^\)\()]*)\)$/;
  this.__errorReasonPattern = /^([^\(\)]+)\((.*)\)$/;

  this.__textEscapePatterns = [
    [/\\/g, '\\\\'],
    [/\n/g, '\\n'],
    [/"/g,  '\\"']
  ];

  // Storage space
  this.__mode            = mode;

  this.__options         = {
    host : (options.host || null),
    port : (options.port || null),
    auth : (options.auth || null),

    offlineStackMaxSize : (
      typeof options.offlineStackMaxSize === "number" ?
        options.offlineStackMaxSize : offlineStackMaxSizeDefault
    )
  };

  this.__client          = null;
  this.__environment     = {};

  this.__isClosing       = false;
  this.__retryTimeout    = null;
  this.__pingInterval    = null;

  this.__connectHandlers = {};

  this.__emitCallbacks   = [];
  this.__eventCallbacks  = {};

  this.__offlineStack    = [];
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
    var isConnected = false;

    // Register connect handlers
    self.__connectHandlers = {
      connected    : handlers.connected,
      disconnected : handlers.disconnected,
      timeout      : handlers.timeout,
      retrying     : handlers.retrying,
      error        : handlers.error
    };

    try {
      // Setup client
      var client = new net.Socket();

      client.setNoDelay(true);   // Disable Nagle algorithm
      client.setTimeout(60000);  // Time-out after 1m

      // Initialize data buffer
      var data_buffer = "";

      // Connect to Sonic Channel endpoint
      client.connect(
        {
          port : self.__options.port,
          host : self.__options.host
        },

        function() {
          isConnected = true;

          // Setup ping interval
          self.__setupPingInterval(true);
        }
      );

      client.on("data", function(data) {
        if (data) {
          data_buffer += data.toString();

          // Handle buffer? (line is complete)
          if (data_buffer.length > 0  &&
                data_buffer[data_buffer.length - 1] === "\n") {
            var lines = data_buffer.trim().split("\n");

            // Clear data buffer immediately
            data_buffer = "";

            for (var i = 0; i < lines.length; i++) {
              var line = lines[i].trim();

              if (line) {
                self.__handleDataLine.bind(self)(client, line);
              }
            }
          }
        }
      });

      client.on("timeout", function() {
        client.end();

        // Failure (timeout)
        self.__triggerConnectHandler("timeout");
      });

      client.on("error", function(error) {
        if (isConnected === false) {
          client.destroy();

          // Failure (unknown)
          self.__triggerConnectHandler("error", error);
        }
      });

      client.on("close", function() {
        if (isConnected === true) {
          client.destroy();

          // Un-setup ping interval
          self.__setupPingInterval(false);

          // Force-trigger end callback? (as the 'ENDED' line will not be \
          //   received if a close is submitted)
          if (self.__isClosing === true) {
            self.__popDataLineCallback("quit");
          }

          // Clear pending callbacks (with an error)
          var orphanCallbacks = [].concat(
            self.__emitCallbacks, Object.values(self.__eventCallbacks)
          );

          self.__emitCallbacks  = [];
          self.__eventCallbacks = {};

          // Trigger orphan callbacks
          for (var i = 0; i < orphanCallbacks.length; i++) {
            orphanCallbacks[i](null, "channel closed");
          }

          // Failure (closed)
          self.__triggerConnectHandler("disconnected");

          self.__handleDisconnected.bind(self)();
        }
      });
    } catch (error) {
      // Failure (could not connect)
      self.__triggerConnectHandler("error", error);
    }
  } else {
    // Immediate success (already connected)
    self.__triggerConnectHandler("connected");
  }

  return self;
};


/**
 * SonicChannelGeneric.prototype.ping
 * @public
 * @param  {function} done
 * @return {undefined}
 */
SonicChannelGeneric.prototype.ping = function(done) {
  if (this.__client !== null) {
    this.__execute("ping", [done]);
  }
};


/**
 * SonicChannelGeneric.prototype.close
 * @public
 * @param  {function} done
 * @return {boolean}  Whether connection was closed now or not
 */
SonicChannelGeneric.prototype.close = function(done) {
  if (this.__client !== null) {
    this.__execute("close", [done]);

    return true;
  }

  return false;
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
  if (this.__client !== null || client) {
    (client || this.__client).write(command + "\n");
  }

  if (typeof done !== "function") {
    done = null;
  }

  this.__emitCallbacks.push(done);
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
  // Offline stack is full?
  if (this.__offlineStack.length >= this.__options.offlineStackMaxSize) {
    throw new Error(
      "Offline stack is full, cannot stack more operations until " +
        "Sonic Channel connection is restored (maximum size set to: " +
        this.__options.offlineStackMaxSize + " entries)"
    );
  }

  // Push to offline stack
  this.__offlineStack.push([operation, (args || [])]);
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

  var callback = this.__emitCallbacks.shift();

  if (callback !== undefined) {
    if (execute !== false && typeof callback === "function") {
      callback(data, error);
    }

    return (callback || null);
  }
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
 * @param  {boolean} [do_setup]
 * @return {undefined}
 */
SonicChannelGeneric.prototype.__setupPingInterval = function(do_setup) {
  var self = this;

  // Cancel previous interval?
  if (this.__pingInterval !== null) {
    clearInterval(this.__pingInterval);

    this.__pingInterval = null;
  }

  if (do_setup === true) {
    // Schedule ping interval (every 30s)
    this.__pingInterval = setInterval(function() {
      self.ping();
    }, 30000);
  }
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
      setTimeout(function() {
        while (self.__offlineStack.length > 0) {
          self.__execute.apply(self, self.__offlineStack.shift());
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

  self.__client      = null;
  self.__environment = {};

  // Schedule retry?
  if (self.__isClosing !== true && self.__retryTimeout === null) {
    self.__retryTimeout = setTimeout(function() {
      self.__retryTimeout = null;

      // Pending (retrying to connect)
      self.__triggerConnectHandler("retrying");

      self.connect({
        error : function() {
          // Failed retrying, schedule next retry
          self.__handleDisconnected();
        }
      });
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
  var match = line.match(this.__responsePattern);

  if (match && match[1]) {
    // Route response command to handler
    var handler = this["__handleDataLine_" + match[1].toLowerCase()];

    if (typeof handler === "function") {
      // Pass response data to handler
      handler.bind(this)(client, match[2]);
    } else {
      // Pop callback straight (avoids callbacks to be de-synced if an \
      //   unsupported response is received)
      this.__popDataLineCallback(match[2], null);
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
  var environmentItems  = argument.split(" ").slice(1),
      environmentParsed = {};

  for (var i = 0; i < environmentItems.length; i++) {
    var match = environmentItems[i].match(this.__startedItemPattern);

    if (match && match[1] && match[2]) {
      if (!isNaN(match[2])) {
        environmentParsed[match[1]] = parseInt(match[2], 10);
      } else {
        environmentParsed[match[1]] = match[2];
      }
    }
  }

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
    resultData = argument;
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
