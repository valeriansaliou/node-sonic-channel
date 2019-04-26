/*
 * node-sonic-channel
 *
 * Copyright 2019, Valerian Saliou
 * Author: Valerian Saliou <valerian@valeriansaliou.name>
 */


"use strict";


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
 * @param  {string} collection
 * @param  {string} bucket
 * @param  {string} object
 * @param  {string} text
 * @param  {object} options
 * @return {object} Promise object
 */
SonicChannelIngest.prototype.push = function(
  collection, bucket, object, text, options
) {
  // Command format:
  // PUSH <collection> <bucket> <object> "<text>" [LANG(<locale>)]?

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

  // Acquire lang from options
  var lang = null;

  if (typeof options === "object") {
    if (options.lang !== undefined) {
      if (typeof options.lang === "string"  &&
            (options.lang.length === 3 || options.lang === "none")) {
        lang = options.lang;
      } else {
        throw new Error("Invalid option: lang");
      }
    }
  }

  // Clean text and check
  var textGroups = this._splitCommandContent(text.trim());

  if (!textGroups[0]) {
    throw new Error("Invalid text");
  }

  // Execute multiple commands? (if multiple split text groups)
  if (textGroups.length > 1) {
    return this._wrapDone(function(done) {
      this._executeMultipleOrDefer(
        "push", textGroups,

        function(text, tickDone) {
          return [collection, bucket, object, text, lang, tickDone];
        },

        done
      );
    });
  }

  // Execute a single command
  return this._wrapDone(function(done) {
    this._executeOrDefer(
      "push", [collection, bucket, object, textGroups[0], lang, done]
    );
  });
};


/**
 * SonicChannelIngest.prototype.pop
 * @public
 * @param  {string} collection
 * @param  {string} bucket
 * @param  {string} object
 * @param  {string} text
 * @return {object} Promise object
 */
SonicChannelIngest.prototype.pop = function(collection, bucket, object, text) {
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
  var textGroups = this._splitCommandContent(text.trim());

  if (!textGroups[0]) {
    throw new Error("Invalid text");
  }

  // Execute multiple commands? (if multiple split text groups)
  if (textGroups.length > 1) {
    return this._wrapDone(function(done) {
      this._executeMultipleOrDefer(
        "pop", textGroups,

        function(text, tickDone) {
          return [collection, bucket, object, text, tickDone];
        },

        done
      );
    });
  }

  // Execute a single command
  return this._wrapDone(function(done) {
    this._executeOrDefer(
      "pop", [collection, bucket, object, textGroups[0], done]
    );
  });
};


/**
 * SonicChannelIngest.prototype.count
 * @public
 * @param  {string} collection
 * @param  {string} bucket
 * @param  {string} object
 * @return {object} Promise object
 */
SonicChannelIngest.prototype.count = function(collection, bucket, object) {
  // Command format:
  // COUNT <collection> [<bucket> [<object>]?]?

  // Check arguments
  if (!collection) {
    throw new Error("Missing collection");
  }

  return this._wrapDone(function(done) {
    this._executeOrDefer("count", [collection, bucket, object, done]);
  });
};


/**
 * SonicChannelIngest.prototype.flushc
 * @public
 * @param  {string} collection
 * @return {object} Promise object
 */
SonicChannelIngest.prototype.flushc = function(collection) {
  // Command format:
  // FLUSHC <collection>

  // Check arguments
  if (!collection) {
    throw new Error("Missing collection");
  }

  return this._wrapDone(function(done) {
    this._executeOrDefer("flushc", [collection, done]);
  });
};


/**
 * SonicChannelIngest.prototype.flushb
 * @public
 * @param  {string} collection
 * @param  {string} bucket
 * @return {object} Promise object
 */
SonicChannelIngest.prototype.flushb = function(collection, bucket) {
  // Command format:
  // FLUSHB <collection> <bucket>

  // Check arguments
  if (!collection) {
    throw new Error("Missing collection");
  }
  if (!bucket) {
    throw new Error("Missing bucket");
  }

  return this._wrapDone(function(done) {
    this._executeOrDefer("flushb", [collection, bucket, done]);
  });
};


/**
 * SonicChannelIngest.prototype.flusho
 * @public
 * @param  {string} collection
 * @param  {string} bucket
 * @param  {string} object
 * @return {object} Promise object
 */
SonicChannelIngest.prototype.flusho = function(collection, bucket, object) {
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

  return this._wrapDone(function(done) {
    this._executeOrDefer("flusho", [collection, bucket, object, done]);
  });
};


/**
 * SonicChannelIngest.prototype._operation_$push
 * @protected
 * @param  {string}   collection
 * @param  {string}   bucket
 * @param  {string}   object
 * @param  {string}   text
 * @param  {string}   lang
 * @param  {function} done
 * @return {undefined}
 */
SonicChannelIngest.prototype._operation_$push = function(
  collection, bucket, object, text, lang, done
) {
  // Generate push values
  var pushValues = [collection, bucket, object];

  pushValues.push("\"" + this._escapeUnsafeCommandText(text) + "\"");

  if (lang !== null) {
    pushValues.push("LANG(" + lang + ")");
  }

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


exports.SonicChannelIngest = SonicChannelIngest;
