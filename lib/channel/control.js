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
 * @param  {string}   action
 * @param  {function} done
 * @return {boolean}  Whether operation was executed now or deferred
 */
SonicChannelControl.prototype.trigger = function(
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
 * SonicChannelControl.prototype._operation_$trigger
 * @protected
 * @param  {string}   action
 * @param  {function} done
 * @return {undefined}
 */
SonicChannelControl.prototype._operation_$trigger = function(
  action, done
) {
  this._emit(
    ("TRIGGER " + action), done
  );
};


exports.SonicChannelControl = SonicChannelControl;
