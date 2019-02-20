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


exports.SonicChannelIngest = SonicChannelIngest;
