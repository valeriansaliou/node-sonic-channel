/*
 * node-sonic-channel
 *
 * Copyright 2019, Valerian Saliou
 * Author: Valerian Saliou <valerian@valeriansaliou.name>
 */


"use strict";


var net                  = require("net");

var SonicChannelGeneric  = require("./generic").SonicChannelGeneric;


/**
 * SonicChannelIngest
 * @class
 * @classdesc  Instanciates a new Sonic Channel Ingest connector.
 * @param      {string} mode
 * @param      {object} options
 */
var SonicChannelIngest = function(options) {
  SonicChannelGeneric.call(this, "ingest", options);
};


/**
 * SonicChannelIngest.prototype
 * @public
 */
SonicChannelIngest.prototype = Object.create(SonicChannelGeneric.prototype);

Object.defineProperty(
  SonicChannelIngest.prototype, "constructor", {
    value      : SonicChannelIngest,
    enumerable : false,
    writable   : true
  }
);


/**
 * SonicChannelIngest.prototype.push
 * @public
 * @param  {string}   collection
 * @param  {string}   bucket
 * @param  {string}   object
 * @param  {string}   text
 * @param  {function} done
 * @return {boolean}  Whether operation was executed now or deferred
 */
SonicChannelIngest.prototype.push = function(
  collection, bucket, object, text, done
) {
  // Command format:
  // PUSH <collection> <bucket> <object> "<text>"

  // Check arguments
  if (!collection) {
    throw new Error("Missing collection");
  }
  if (!bucket) {
    throw new Error("Missing bucket");
  }
  if (!object) {
    throw new Error("Missing object");
  }
  if (!text) {
    throw new Error("Missing text");
  }

  // Clean text and check
  text = text.trim();

  if (!text) {
    throw new Error("Invalid text");
  }
  if (text.length >= this._options.textMaximumLength) {
    throw new Error(
      "The text value is too long (maximum length set to: " +
        this._options.textMaximumLength + " characters)"
    );
  }

  return this._executeOrDefer("push", [collection, bucket, object, text, done]);
};


/**
 * SonicChannelIngest.prototype.pop
 * @public
 * @param  {string}   collection
 * @param  {string}   bucket
 * @param  {string}   object
 * @param  {string}   text
 * @param  {function} done
 * @return {boolean}  Whether operation was executed now or deferred
 */
SonicChannelIngest.prototype.pop = function(
  collection, bucket, object, text, done
) {
  // Command format:
  // POP <collection> <bucket> <object> "<text>"

  // Check arguments
  if (!collection) {
    throw new Error("Missing collection");
  }
  if (!bucket) {
    throw new Error("Missing bucket");
  }
  if (!object) {
    throw new Error("Missing object");
  }
  if (!text) {
    throw new Error("Missing text");
  }

  // Clean text and check
  text = text.trim();

  if (!text) {
    throw new Error("Invalid text");
  }
  if (text.length >= this._options.textMaximumLength) {
    throw new Error(
      "The text value is too long (maximum length set to: " +
        this._options.textMaximumLength + " characters)"
    );
  }

  return this._executeOrDefer("pop", [collection, bucket, object, text, done]);
};


/**
 * SonicChannelIngest.prototype.count
 * @public
 * @param  {string}   collection
 * @param  {string}   bucket
 * @param  {string}   object
 * @param  {function} done
 * @return {boolean}  Whether operation was executed now or deferred
 */
SonicChannelIngest.prototype.count = function(
  collection, bucket, object, done
) {
  // Command format:
  // COUNT <collection> [<bucket> [<object>]?]?

  // Check arguments
  if (!collection) {
    throw new Error("Missing collection");
  }

  return this._executeOrDefer("count", [collection, bucket, object, done]);
};


/**
 * SonicChannelIngest.prototype.flushc
 * @public
 * @param  {string}   collection
 * @param  {function} done
 * @return {boolean}  Whether operation was executed now or deferred
 */
SonicChannelIngest.prototype.flushc = function(collection, done) {
  // Command format:
  // FLUSHC <collection>

  // Check arguments
  if (!collection) {
    throw new Error("Missing collection");
  }

  return this._executeOrDefer("flushc", [collection, done]);
};


/**
 * SonicChannelIngest.prototype.flushb
 * @public
 * @param  {string}   collection
 * @param  {string}   bucket
 * @param  {function} done
 * @return {boolean}  Whether operation was executed now or deferred
 */
SonicChannelIngest.prototype.flushb = function(collection, bucket, done) {
  // Command format:
  // FLUSHB <collection> <bucket>

  // Check arguments
  if (!collection) {
    throw new Error("Missing collection");
  }
  if (!bucket) {
    throw new Error("Missing bucket");
  }

  return this._executeOrDefer("flushb", [collection, bucket, done]);
};


/**
 * SonicChannelIngest.prototype.flusho
 * @public
 * @param  {string}   collection
 * @param  {string}   bucket
 * @param  {string}   object
 * @param  {function} done
 * @return {boolean}  Whether operation was executed now or deferred
 */
SonicChannelIngest.prototype.flusho = function(
  collection, bucket, object, done
) {
  // Command format:
  // FLUSHO <collection> <bucket> <object>

  // Check arguments
  if (!collection) {
    throw new Error("Missing collection");
  }
  if (!bucket) {
    throw new Error("Missing bucket");
  }
  if (!object) {
    throw new Error("Missing object");
  }

  return this._executeOrDefer("flusho", [collection, bucket, object, done]);
};


/**
 * SonicChannelIngest.prototype.trigger
 * @public
 * @param  {string}   action
 * @param  {function} done
 * @return {boolean}  Whether operation was executed now or deferred
 */
SonicChannelIngest.prototype.trigger = function(
  action, done
) {
  // Command format:
  // TRIGGER <action>

  // Check arguments
  if (!action) {
    throw new Error("Missing action");
  }

  return this._executeOrDefer("trigger", [action, done]);
};


/**
 * SonicChannelIngest.prototype._operation_$push
 * @protected
 * @param  {string}   collection
 * @param  {string}   bucket
 * @param  {string}   object
 * @param  {string}   text
 * @param  {function} done
 * @return {undefined}
 */
SonicChannelIngest.prototype._operation_$push = function(
  collection, bucket, object, text, done
) {
  // Generate push values
  var pushValues = [collection, bucket, object];

  pushValues.push("\"" + this._escapeUnsafeCommandText(text) + "\"");

  this._emit(
    ("PUSH " + pushValues.join(" ")), done
  );
};


/**
 * SonicChannelIngest.prototype._operation_$pop
 * @protected
 * @param  {string}   collection
 * @param  {string}   bucket
 * @param  {string}   object
 * @param  {string}   text
 * @param  {function} done
 * @return {undefined}
 */
SonicChannelIngest.prototype._operation_$pop = function(
  collection, bucket, object, text, done
) {
  // Generate pop values
  var popValues = [collection, bucket, object];

  popValues.push("\"" + this._escapeUnsafeCommandText(text) + "\"");

  this._emit(
    ("POP " + popValues.join(" ")), done
  );
};


/**
 * SonicChannelIngest.prototype._operation_$count
 * @protected
 * @param  {string}   collection
 * @param  {string}   bucket
 * @param  {string}   object
 * @param  {function} done
 * @return {undefined}
 */
SonicChannelIngest.prototype._operation_$count = function(
  collection, bucket, object, done
) {
  // Generate count values
  var countValues = [collection];

  if (bucket) {
    countValues.push(bucket);

    if (object) {
      countValues.push(object);
    }
  }

  this._emit(
    ("COUNT " + countValues.join(" ")), done
  );
};


/**
 * SonicChannelIngest.prototype._operation_$flushc
 * @protected
 * @param  {string}   collection
 * @param  {function} done
 * @return {undefined}
 */
SonicChannelIngest.prototype._operation_$flushc = function(collection, done) {
  this._emit(
    ("FLUSHC " + collection), done
  );
};


/**
 * SonicChannelIngest.prototype._operation_$flushb
 * @protected
 * @param  {string}   collection
 * @param  {string}   bucket
 * @param  {function} done
 * @return {undefined}
 */
SonicChannelIngest.prototype._operation_$flushb = function(
  collection, bucket, done
) {
  this._emit(
    ("FLUSHB " + [collection, bucket].join(" ")), done
  );
};


/**
 * SonicChannelIngest.prototype._operation_$flusho
 * @protected
 * @param  {string}   collection
 * @param  {string}   bucket
 * @param  {string}   object
 * @param  {function} done
 * @return {undefined}
 */
SonicChannelIngest.prototype._operation_$flusho = function(
  collection, bucket, object, done
) {
  this._emit(
    ("FLUSHO " + [collection, bucket, object].join(" ")), done
  );
};


/**
 * SonicChannelIngest.prototype._operation_$trigger
 * @protected
 * @param  {string}   action
 * @param  {function} done
 * @return {undefined}
 */
SonicChannelIngest.prototype._operation_$trigger = function(
  action, done
) {
  this._emit(
    ("TRIGGER " + action), done
  );
};


exports.SonicChannelIngest = SonicChannelIngest;
