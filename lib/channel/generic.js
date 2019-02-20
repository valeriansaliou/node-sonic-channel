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
  if (typeof options.offlineStackMaxSize !== "undefined"  &&
        (typeof options.offlineStackMaxSize !== "number" ||
          options.offlineStackMaxSize < 0)) {
    throw new Error("Invalid options.offlineStackMaxSize");
  }

  // Environment
  var offlineStackMaxSizeDefault = 10000;

  // Patterns
  this.__responsePattern  = /^([A-Z]+)(?:\s(.*))?$/;

  // Storage space
  this.__mode             = mode;

  this.__options          = {
    host                : (options.host   || null),
    port                : (options.port   || null),

    offlineStackMaxSize : (
      typeof options.offlineStackMaxSize === "number" ?
        options.offlineStackMaxSize : offlineStackMaxSizeDefault
    )
  };

  this.__client           = null;
  this.__isClosing        = false;
  this.__retryTimeout     = null;
  this.__pingInterval     = null;
  this.__lastCommands     = [];

  this.__connectHandlers  = {};
  this.__responseHandlers = {};

  this.__offlineStack     = [];
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

      client.setNoDelay(true);    // Disable Nagle algorithm
      client.setTimeout(300000);  // Time-out after 5m

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

      client.on("close", function(hadError) {
        if (isConnected === true) {
          client.destroy();

          // Un-setup ping interval
          self.__setupPingInterval(false);

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
 * SonicChannelGeneric.prototype.on
 * @public
 * @param  {string}   type
 * @param  {function} handler
 * @return {undefined}
 */
SonicChannelGeneric.prototype.on = function(type, handler) {
  this.__responseHandlers[type] = handler;
};


/**
 * SonicChannelGeneric.prototype.off
 * @public
 * @param  {string}   type
 * @param  {function} handler
 * @return {undefined}
 */
SonicChannelGeneric.prototype.off = function(type, handler) {
  delete this.__responseHandlers[type];
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

    // Unbind client immediately
    this.__client = null;

    return true;
  }

  return false;
};


/**
 * SonicChannelGeneric.prototype.__executeOrDefer
 * @private
 * @param  {string}  operation
 * @param  {object}  args
 * @return {boolean} Whether was executed now or deferred
 */
SonicChannelGeneric.prototype.__executeOrDefer = function(operation, args) {
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
 * SonicChannelGeneric.prototype.__execute
 * @private
 * @param  {string} operation
 * @param  {object} args
 * @return {undefined}
 */
SonicChannelGeneric.prototype.__execute = function(operation, args) {
  // Execute operation now.
  this["__operation_$" + operation].apply(this, (args || []));
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
 * SonicChannelGeneric.prototype.__operation_$ping
 * @private
 * @param  {function} done
 * @return {undefined}
 */
SonicChannelGeneric.prototype.__operation_$ping = function(done) {
  if (this.__client !== null) {
    this.__emit("PING", done);
  }
};


/**
 * SonicChannelGeneric.prototype.__operation_$close
 * @private
 * @param  {function} done
 * @return {undefined}
 */
SonicChannelGeneric.prototype.__operation_$close = function(done) {
  if (this.__client !== null) {
    this.__isClosing = true;

    this.__emit("QUIT", done);
  }
};


/**
 * SonicChannelGeneric.prototype.__emit
 * @private
 * @param  {string}   command
 * @param  {function} done
 * @param  {object}   [client]
 * @return {undefined}
 */
SonicChannelGeneric.prototype.__emit = function(command, done, client) {
  var result;

  if (this.__client !== null || client) {
    this.__lastCommands.push(command);

    (client || this.__client).write(command + "\n");
  } else {
    result = new Error("Channel closed");
  }

  if (typeof done === "function") {
    done(result);
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
 * SonicChannelGeneric.prototype.__triggerResponseHandler
 * @private
 * @param  {string} type
 * @return {undefined}
 */
SonicChannelGeneric.prototype.__triggerResponseHandler = function(type) {
  var lastCommand = this.__lastCommands.shift();

  if (typeof this.__responseHandlers[type] === "function") {
    this.__responseHandlers[type](lastCommand);
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
    // Schedule ping interval (every 60s)
    this.__pingInterval = setInterval(function() {
      self.ping();
    }, 60000);
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

  self.__client = null;

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
    // Trigger response handler (straight)
    this.__triggerResponseHandler(match[1]);

    // Route response command to handler
    var handler = this["__handleDataLine_" + match[1].toLowerCase()];

    if (typeof handler === "function") {
      handler.bind(this)(client, match[2]);
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
  this.__emit(
    ("START " + this.__mode), undefined, client
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
  // Destroy client
  client.destroy();
};


exports.SonicChannelGeneric = SonicChannelGeneric;
