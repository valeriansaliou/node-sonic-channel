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

  // TODO
};


/**
 * SonicChannelIngest.prototype.pop
 * @public
 * @param  {string}   collection
 * @param  {string}   bucket
 * @param  {string}   object
 * @param  {function} done
 * @return {boolean}  Whether operation was executed now or deferred
 */
SonicChannelIngest.prototype.pop = function(
  collection, bucket, object, done
) {
  // Command format:
  // POP <collection> <bucket> <object>

  // TODO
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

  // TODO
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

  // TODO
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

  // TODO
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

  // TODO
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
  // TODO
};


/**
 * SonicChannelIngest.prototype._operation_$pop
 * @protected
 * @param  {string}   collection
 * @param  {string}   bucket
 * @param  {string}   object
 * @param  {function} done
 * @return {undefined}
 */
SonicChannelIngest.prototype._operation_$pop = function(
  collection, bucket, object, done
) {
  // TODO
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
  // TODO
};


/**
 * SonicChannelIngest.prototype._operation_$flushc
 * @protected
 * @param  {string}   collection
 * @param  {function} done
 * @return {undefined}
 */
SonicChannelIngest.prototype._operation_$flushc = function(collection, done) {
  // TODO
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
  // TODO
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
  // TODO
};


exports.SonicChannelIngest = SonicChannelIngest;
