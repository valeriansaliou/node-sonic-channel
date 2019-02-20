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
 * @param  {string}   collection
 * @param  {string}   bucket
 * @param  {string}   terms
 * @param  {function} done
 * @param  {object}   options
 * @return {boolean}  Whether operation was executed now or deferred
 */
SonicChannelSearch.prototype.query = function(
  collection, bucket, terms, done, options
) {
  // Command format:
  // QUERY <collection> <bucket> "<terms>" [LIMIT(<count>)]? [OFFSET(<count>)]?

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

  // Clean terms and check
  terms = terms.trim();

  if (!terms) {
    throw new Error("Invalid terms");
  }

  return this._executeOrDefer("query", [
    collection, bucket, terms, limit, offset, done
  ]);
};


/**
 * SonicChannelSearch.prototype._operation_$query
 * @protected
 * @param  {string|object} cacheBucketID
 * @param  {function}      done
 * @return {undefined}
 */
SonicChannelSearch.prototype._operation_$query = function(
  collection, bucket, terms, limit, offset, done
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

  this._emit(
    ("QUERY " + queryValues.join(" ")), done
  );
};


exports.SonicChannelSearch = SonicChannelSearch;
