/*
 * node-sonic-channel
 *
 * Copyright 2019, Valerian Saliou
 * Author: Valerian Saliou <valerian@valeriansaliou.name>
 */


"use strict";


var SonicChannelGeneric  = require("./generic").SonicChannelGeneric;


/**
 * SonicChannelSearch
 * @class
 * @classdesc  Instanciates a new Sonic Channel Search connector.
 * @param      {string} mode
 * @param      {object} options
 */
var SonicChannelSearch = function(options) {
  SonicChannelGeneric.call(this, "search", options);
};


/**
 * SonicChannelSearch.prototype
 * @public
 */
SonicChannelSearch.prototype = Object.create(SonicChannelGeneric.prototype);

Object.defineProperty(
  SonicChannelSearch.prototype, "constructor", {
    value      : SonicChannelSearch,
    enumerable : false,
    writable   : true
  }
);


/**
 * SonicChannelSearch.prototype.query
 * @public
 * @param  {string} collection
 * @param  {string} bucket
 * @param  {string} terms
 * @param  {object} options
 * @return {object} Promise object
 */
SonicChannelSearch.prototype.query = function(
  collection, bucket, terms, options
) {
  // Command format:
  // QUERY <collection> <bucket> "<terms>" [LIMIT(<count>)]? \
  //   [OFFSET(<count>)]? [LANG(<locale>)]?

  // Check arguments
  if (!collection) {
    throw new Error("Missing collection");
  }
  if (!bucket) {
    throw new Error("Missing bucket");
  }
  if (!terms) {
    throw new Error("Missing terms");
  }

  // Acquire limit, offset and lang from options
  var limit  = null,
      offset = null,
      lang   = null;

  if (typeof options === "object") {
    if (options.limit !== undefined) {
      if (typeof options.limit === "number" && options.limit > 0  &&
            Number.isInteger(options.limit) === true) {
        limit = options.limit;
      } else {
        throw new Error("Invalid option: limit");
      }
    }

    if (options.offset !== undefined) {
      if (typeof options.offset === "number" && options.offset > -1  &&
            Number.isInteger(options.offset) === true) {
        offset = options.offset;
      } else {
        throw new Error("Invalid option: offset");
      }
    }

    if (options.lang !== undefined) {
      if (typeof options.lang === "string"  &&
            (options.lang.length === 3 || options.lang === "none")) {
        lang = options.lang;
      } else {
        throw new Error("Invalid option: lang");
      }
    }
  }

  // Clean terms and check (only pick first split group)
  terms = this._splitCommandContent(terms.trim())[0];

  if (!terms) {
    throw new Error("Invalid terms");
  }

  return this._wrapDone(function(done) {
    this._executeOrDefer("query", [
      collection, bucket, terms, limit, offset, lang, done
    ]);
  });
};


/**
 * SonicChannelSearch.prototype.suggest
 * @public
 * @param  {string} collection
 * @param  {string} bucket
 * @param  {string} word
 * @param  {object} options
 * @return {object} Promise object
 */
SonicChannelSearch.prototype.suggest = function(
  collection, bucket, word, options
) {
  // Command format:
  // SUGGEST <collection> <bucket> "<word>" [LIMIT(<count>)]?

  // Check arguments
  if (!collection) {
    throw new Error("Missing collection");
  }
  if (!bucket) {
    throw new Error("Missing bucket");
  }
  if (!word) {
    throw new Error("Missing word");
  }
  if (word.indexOf(" ") !== -1) {
    throw new Error("Word should not contain spaces");
  }

  // Acquire limit from options
  var limit = null;

  if (typeof options === "object") {
    if (options.limit !== undefined) {
      if (typeof options.limit === "number" && options.limit > 0  &&
            Number.isInteger(options.limit) === true) {
        limit = options.limit;
      } else {
        throw new Error("Invalid option: limit");
      }
    }
  }

  // Clean word and check
  word = word.trim();

  if (!word) {
    throw new Error("Invalid word");
  }

  return this._wrapDone(function(done) {
    this._executeOrDefer("suggest", [
      collection, bucket, word, limit, done
    ]);
  });
};


/**
 * SonicChannelSearch.prototype.list
 * @public
 * @param  {string} collection
 * @param  {string} bucket
 * @param  {object} options
 * @return {object} Promise object
 */
SonicChannelSearch.prototype.list = function(
  collection, bucket, options
) {
  // Command format:
  // LIST <collection> <bucket> [LIMIT(<count>)]? [OFFSET(<count>)]?

  // Check arguments
  if (!collection) {
    throw new Error("Missing collection");
  }
  if (!bucket) {
    throw new Error("Missing bucket");
  }

  // Acquire limit and offset from options
  var limit  = null,
      offset = null;

  if (typeof options === "object") {
    if (options.limit !== undefined) {
      if (typeof options.limit === "number" && options.limit > 0  &&
            Number.isInteger(options.limit) === true) {
        limit = options.limit;
      } else {
        throw new Error("Invalid option: limit");
      }
    }

    if (options.offset !== undefined) {
      if (typeof options.offset === "number" && options.offset > -1  &&
            Number.isInteger(options.offset) === true) {
        offset = options.offset;
      } else {
        throw new Error("Invalid option: offset");
      }
    }
  }

  return this._wrapDone(function(done) {
    this._executeOrDefer("list", [
      collection, bucket, limit, offset, done
    ]);
  });
};


/**
 * SonicChannelSearch.prototype._operation_$query
 * @protected
 * @param  {string}   collection
 * @param  {string}   bucket
 * @param  {string}   terms
 * @param  {number}   limit
 * @param  {number}   offset
 * @param  {string}   lang
 * @param  {function} done
 * @return {undefined}
 */
SonicChannelSearch.prototype._operation_$query = function(
  collection, bucket, terms, limit, offset, lang, done
) {
  // Generate query values
  var queryValues = [collection, bucket];

  queryValues.push("\"" + this._escapeUnsafeCommandText(terms) + "\"");

  if (limit !== null) {
    queryValues.push("LIMIT(" + limit + ")");
  }
  if (offset !== null) {
    queryValues.push("OFFSET(" + offset + ")");
  }
  if (lang !== null) {
    queryValues.push("LANG(" + lang + ")");
  }

  this._emit(
    ("QUERY " + queryValues.join(" ")), done
  );
};


/**
 * SonicChannelSearch.prototype._operation_$suggest
 * @protected
 * @param  {string}   collection
 * @param  {string}   bucket
 * @param  {string}   word
 * @param  {number}   limit
 * @param  {function} done
 * @return {undefined}
 */
SonicChannelSearch.prototype._operation_$suggest = function(
  collection, bucket, word, limit, done
) {
  // Generate suggest values
  var suggestValues = [collection, bucket];

  suggestValues.push("\"" + this._escapeUnsafeCommandText(word) + "\"");

  if (limit !== null) {
    suggestValues.push("LIMIT(" + limit + ")");
  }

  this._emit(
    ("SUGGEST " + suggestValues.join(" ")), done
  );
};


/**
 * SonicChannelSearch.prototype._operation_$list
 * @protected
 * @param  {string}   collection
 * @param  {string}   bucket
 * @param  {number}   limit
 * @param  {number}   offset
 * @param  {function} done
 * @return {undefined}
 */
SonicChannelSearch.prototype._operation_$list = function(
  collection, bucket, limit, offset, done
) {
  // Generate list values
  var listValues = [collection, bucket];

  if (limit !== null) {
    listValues.push("LIMIT(" + limit + ")");
  }
  if (offset !== null) {
    listValues.push("OFFSET(" + offset + ")");
  }

  this._emit(
    ("LIST " + listValues.join(" ")), done
  );
};


exports.SonicChannelSearch = SonicChannelSearch;
