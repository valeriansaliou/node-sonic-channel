/*
 * node-sonic-channel
 *
 * Copyright 2019, Valerian Saliou
 * Author: Valerian Saliou <valerian@valeriansaliou.name>
 */


"use strict";


var SonicChannelGeneric  = require("./generic").SonicChannelGeneric;


/**
 * SonicChannelControl
 * @class
 * @classdesc  Instanciates a new Sonic Channel Control connector.
 * @param      {string} mode
 * @param      {object} options
 */
var SonicChannelControl = function(options) {
  SonicChannelGeneric.call(this, "control", options);
};


/**
 * SonicChannelControl.prototype
 * @public
 */
SonicChannelControl.prototype = Object.create(SonicChannelGeneric.prototype);

Object.defineProperty(
  SonicChannelControl.prototype, "constructor", {
    value      : SonicChannelControl,
    enumerable : false,
    writable   : true
  }
);


/**
 * SonicChannelControl.prototype.trigger
 * @public
 * @param  {string} action
 * @param  {string} data
 * @return {object} Promise object
 */
SonicChannelControl.prototype.trigger = function(action, data) {
  // Command format:
  // TRIGGER [<action>]? [<data>]?

  // Check arguments
  if (!action) {
    throw new Error("Missing action");
  }

  return this._wrapDone(function(done) {
    this._executeOrDefer("trigger", [action, data, done]);
  });
};


/**
 * SonicChannelControl.prototype.info
 * @public
 * @return {object} Promise object
 */
SonicChannelControl.prototype.info = function() {
  // Command format:
  // INFO

  return this._wrapDone(function(done) {
    this._executeOrDefer("info", [done]);
  });
};


/**
 * SonicChannelControl.prototype._operation_$trigger
 * @protected
 * @param  {string}   action
 * @param  {string}   data
 * @param  {function} done
 * @return {undefined}
 */
SonicChannelControl.prototype._operation_$trigger = function(
  action, data, done
) {
  // Generate trigger values
  var triggerValues = [action];

  if (data) {
    triggerValues.push(data);
  }

  this._emit(
    ("TRIGGER " + triggerValues.join(" ")), done
  );
};


/**
 * SonicChannelControl.prototype._operation_$info
 * @protected
 * @param  {function} done
 * @return {undefined}
 */
SonicChannelControl.prototype._operation_$info = function(done) {
  this._emit("INFO", done);
};


exports.SonicChannelControl = SonicChannelControl;
